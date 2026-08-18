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

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT class_id, class_name, section_name 
      FROM sgs_class_master 
      WHERE record_status = 'Active'
      ORDER BY class_id
    `);
    console.log('Available classes:', result.rows.map(r => ({ id: r.class_id, name: r.class_name })));
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching classes:', error);
    return NextResponse.json([], { status: 200 });
  }
}
