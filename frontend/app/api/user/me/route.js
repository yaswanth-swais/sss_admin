import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import postgres from 'postgres';

const pool = postgres(process.env.DATABASE_URL, { 
  ssl: 'require'
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
    try {
      // Verify token - this will automatically check expiry
      const decoded = jwt.verify(token, JWT_SECRET);
      
      const users = await pool`
        SELECT user_id, email, username, role, is_active, created_at
        FROM users_master 
        WHERE user_id = ${decoded.userId}
      `;

      if (users.length === 0) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        user: users[0]
      });

    } catch (jwtError) {
      // Token expired or invalid
      if (jwtError.name === 'TokenExpiredError') {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Session expired. Please login again.',
            code: 'TOKEN_EXPIRED'
          },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { success: false, message: 'Authentication failed' },
      { status: 500 }
    );
  }
}
