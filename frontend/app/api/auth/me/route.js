import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import postgres from 'postgres';

const pool = postgres(process.env.DATABASE_URL, { 
  ssl: 'require'
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export async function GET(request) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user from database
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

  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { success: false, message: 'Invalid or expired token' },
      { status: 401 }
    );
  }
}
