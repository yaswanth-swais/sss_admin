import { NextResponse } from 'next/server';
import postgres from 'postgres';
import jwt from 'jsonwebtoken';

const pool = postgres(process.env.DATABASE_URL, {
  ssl: 'require'
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const ALLOWED_ROLES = ['admin', 'super_admin', 'teacher', 'student', 'parent'];

// --- JWT Functions (Integrated) ---
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '5h' });
};
// ----------------------------------

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, userType } = body;

    if (!email || !userType) {
      return NextResponse.json(
        { success: false, message: 'Email and User Type are required' },
        { status: 400 }
      );
    }

    if (!ALLOWED_ROLES.includes(userType.toLowerCase())) {
      return NextResponse.json(
        { success: false, message: 'Invalid user type' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await pool`
      SELECT user_id, email, username, role, is_active
      FROM users_master
      WHERE email = ${email}
    `;

    let user;
    let isNewUser = false;

    if (existingUser.length > 0) {
      user = existingUser[0];
      if (user.role !== userType.toLowerCase()) {
        await pool`
          UPDATE users_master
          SET role = ${userType.toLowerCase()}, updated_at = NOW()
          WHERE user_id = ${user.user_id}
        `;
        user.role = userType.toLowerCase();
      }
    } else {
      isNewUser = true;
      const username = email.split('@')[0];

      const result = await pool`
        INSERT INTO users_master (
          email,
          username,
          password_hash,
          role,
          is_active,
          created_at
        )
        VALUES (
          ${email},
          ${username},
          'google_oauth_user',
          ${userType.toLowerCase()},
          true,
          NOW()
        )
        RETURNING user_id, email, username, role, is_active
      `;

      user = result[0];
    }

    // Generate JWT Token using integrated function
    const token = generateToken({
      userId: user.user_id,
      email: user.email,
      role: user.role
    });

    const isAdmin = ['admin', 'super_admin'].includes(user.role);

    return NextResponse.json({
      success: true,
      message: isNewUser ? 'User registered successfully' : 'User login successful',
      token: token,
      expiresIn: '5 hours',
      isAdmin: isAdmin,
      user: {
        id: user.user_id,
        email: user.email,
        username: user.username || email.split('@')[0],
        role: user.role,
        isActive: user.is_active,
        isNewUser: isNewUser,
        isAdmin: isAdmin
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Registration failed',
        error: error.message
      },
      { status: 500 }
    );
  }
}
