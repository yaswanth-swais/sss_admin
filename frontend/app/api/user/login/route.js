import { NextResponse } from 'next/server';
import postgres from 'postgres';
import jwt from 'jsonwebtoken';

const pool = postgres(process.env.DATABASE_URL, { 
  ssl: 'require'
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('Login attempt for email:', email);

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Query the database for the user
    const users = await pool`
      SELECT user_id, email, username, role, is_active, password_hash
      FROM users_master 
      WHERE email = ${email}
    `;

    console.log('User found:', users.length > 0 ? 'Yes' : 'No');

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = users[0];

    // For now, accept any password for testing
    // In production, use bcrypt.compare()
    if (user.password_hash !== password && user.password_hash !== 'google_oauth_user') {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.is_active) {
      return NextResponse.json(
        { success: false, message: 'Account is inactive. Please contact admin.' },
        { status: 403 }
      );
    }

    // Generate JWT Token
    const token = jwt.sign(
      { 
        userId: user.user_id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '5h' }
    );

    const isAdmin = ['admin', 'super_admin'].includes(user.role);

    console.log('Login successful for:', email);

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      token: token,
      isAdmin: isAdmin,
      user: {
        id: user.user_id,
        email: user.email,
        username: user.username,
        role: user.role,
        isActive: user.is_active
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Login failed', 
        error: error.message 
      },
      { status: 500 }
    );
  }
}
