import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'student';
    
    let prefix = 'S';
    let tableName = 'sgs_student_master';
    let idColumn = 'admission_no';
    
    if (type === 'teacher') {
      prefix = 'T';
      tableName = 'sgs_teacher_master';
      idColumn = 'teacher_id';
    } else if (type === 'headmaster') {
      prefix = 'H';
      tableName = 'sgs_teacher_master';
      idColumn = 'teacher_id';
    }
    
    // Get the highest existing ID
    const result = await pool.query(
      `SELECT ${idColumn} FROM ${tableName} WHERE ${idColumn} LIKE $1 ORDER BY ${idColumn} DESC LIMIT 1`,
      [`${prefix}%`]
    );
    
    let nextNumber = 1;
    if (result.rows.length > 0) {
      const lastId = result.rows[0][idColumn];
      const numPart = parseInt(lastId.replace(prefix, ''));
      if (!isNaN(numPart)) {
        nextNumber = numPart + 1;
      }
    }
    
    const newId = `${prefix}${String(nextNumber).padStart(3, '0')}`;
    
    return NextResponse.json({ id: newId });
  } catch (error) {
    console.error('Error generating ID:', error);
    // Return a fallback ID if database query fails
    const fallbackId = `S${String(Math.floor(Math.random() * 9000) + 1000)}`;
    return NextResponse.json({ id: fallbackId });
  }
}
