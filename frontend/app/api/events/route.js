import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000,
});

export async function GET() {
  try {
    console.log('🔍 Fetching events...');
    
    // Check if events table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'sss_events'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ sss_events table not found');
      return NextResponse.json([], { status: 200 });
    }
    
    const result = await pool.query(`
      SELECT 
        event_id as id,
        event_title as title,
        event_description as message,
        event_date as date,
        status
      FROM sss_events
      WHERE status = 'Active'
      ORDER BY event_date DESC
    `);
    
    console.log(`✅ Found ${result.rows.length} events`);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('❌ Database error:', error);
    return NextResponse.json([], { status: 200 });
  }
}
