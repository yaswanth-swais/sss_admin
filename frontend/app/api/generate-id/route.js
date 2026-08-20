import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});

// Detect which table to use (sss_ or sgs_)
async function getTableName() {
  try {
    // Check if sss_student_master exists
    const sssCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'sss_student_master'
      )
    `);
    
    if (sssCheck.rows[0].exists) {
      console.log('📋 Using sss_student_master table');
      return 'sss_student_master';
    }
    
    // Fallback to sgs_student_master
    const sgsCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'sgs_student_master'
      )
    `);
    
    if (sgsCheck.rows[0].exists) {
      console.log('📋 Using sgs_student_master table');
      return 'sgs_student_master';
    }
    
    return null;
  } catch (error) {
    console.error('Error checking tables:', error);
    return null;
  }
}

// Helper to get existing columns
async function getExistingColumns(tableName) {
  try {
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);
    return result.rows.map(r => r.column_name);
  } catch (error) {
    console.error('Error getting columns:', error);
    return [];
  }
}

// Helper to find a column that exists
function findColumn(possibleColumns, existingColumns) {
  for (const col of possibleColumns) {
    if (existingColumns.includes(col)) {
      return col;
    }
  }
  return null;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'student';
    
    let prefix = 'S';
    if (type === 'teacher') {
      prefix = 'T';
    } else if (type === 'headmaster') {
      prefix = 'H';
    }
    
    console.log(`🔍 Generating ${type} ID...`);
    
    const tableName = await getTableName();
    if (!tableName) {
      console.log('❌ No student table found');
      return NextResponse.json({ id: `${prefix}001` });
    }
    
    const existingColumns = await getExistingColumns(tableName);
    const idCol = findColumn(['admission_no', 'student_id'], existingColumns);
    
    if (!idCol) {
      console.log('❌ No ID column found');
      return NextResponse.json({ id: `${prefix}001` });
    }
    
    console.log(`📋 Table: ${tableName}, ID Column: ${idCol}`);
    
    // Get the highest ID - using multiple methods to ensure we get it
    let maxNumber = 0;
    
    // Method 1: Get all IDs and find the max
    try {
      const result = await pool.query(
        `SELECT ${idCol} FROM ${tableName} 
         WHERE ${idCol} LIKE $1 
         AND ${idCol} ~ '^[A-Z][0-9]+$' 
         ORDER BY ${idCol} DESC`,
        [`${prefix}%`]
      );
      
      console.log(`📊 Found ${result.rows.length} existing ${type} IDs`);
      
      if (result.rows.length > 0) {
        // Get the first one (highest)
        const lastId = result.rows[0][idCol];
        console.log(`📝 Last ID from DB: ${lastId}`);
        
        // Extract the number part
        const numPart = parseInt(lastId.replace(prefix, ''));
        if (!isNaN(numPart) && numPart > 0) {
          maxNumber = numPart;
          console.log(`📊 Highest number found: ${maxNumber}`);
        }
      }
    } catch (error) {
      console.error('Error fetching IDs:', error);
    }
    
    // Method 2: If method 1 failed, try a different query
    if (maxNumber === 0) {
      try {
        const result = await pool.query(
          `SELECT MAX(CAST(SUBSTRING(${idCol} FROM 2) AS INTEGER)) as max_num
           FROM ${tableName} 
           WHERE ${idCol} ~ '^[A-Z][0-9]+$'`
        );
        
        if (result.rows[0]?.max_num) {
          maxNumber = parseInt(result.rows[0].max_num);
          console.log(`📊 Max number from SUBSTRING: ${maxNumber}`);
        }
      } catch (error) {
        console.error('Error with SUBSTRING method:', error);
      }
    }
    
    const nextNumber = maxNumber + 1;
    const newId = `${prefix}${String(nextNumber).padStart(3, '0')}`;
    console.log(`✅ Generated ${type} ID: ${newId} (next number: ${nextNumber})`);
    
    return NextResponse.json({ id: newId });
  } catch (error) {
    console.error('❌ Error generating ID:', error);
    // Return a simple fallback
    const fallbackId = 'S001';
    console.log(`⚠️ Using fallback ID: ${fallbackId}`);
    return NextResponse.json({ id: fallbackId });
  }
}
