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

async function findTable(tableName) {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = $1
      )
    `, [tableName]);
    return result.rows[0].exists;
  } catch (error) {
    return false;
  }
}

async function getTableName(baseName) {
  const variations = [
    `sss_${baseName}`,
    `sss_${baseName}`,
    `${baseName}`
  ];
  
  for (const name of variations) {
    const exists = await findTable(name);
    if (exists) {
      console.log(`✅ Found table: ${name}`);
      return name;
    }
  }
  return null;
}

export async function GET() {
  try {
    console.log('🔍 Fetching classes...');
    
    const tableName = await getTableName('class_master');
    if (!tableName) {
      console.log('❌ No class table found');
      return NextResponse.json([], { status: 200 });
    }
    
    console.log(`📋 Using table: ${tableName}`);
    
    const result = await pool.query(`
      SELECT class_id, class_name, section_name 
      FROM ${tableName} 
      WHERE record_status = 'Active'
      ORDER BY class_id
    `);
    
    console.log(`✅ Found ${result.rows.length} classes`);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching classes:', error);
    return NextResponse.json([], { status: 200 });
  }
}
