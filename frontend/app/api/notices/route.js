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

// Try different table name variations
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
    `sgs_${baseName}`,
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
    console.log('🔍 Fetching notices...');
    
    const tableName = await getTableName('notice_board');
    if (!tableName) {
      console.log('❌ No notice table found');
      return NextResponse.json([], { status: 200 });
    }
    
    console.log(`📋 Using table: ${tableName}`);
    
    // Get column names
    const columnsResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);
    
    const existingColumns = columnsResult.rows.map(r => r.column_name);
    console.log('📋 Available columns:', existingColumns);

    // Build query based on existing columns
    let selectFields = [];
    const columnMap = {
      'id': ['notice_id', 'id'],
      'title': ['notice_title', 'title'],
      'message': ['notice_text', 'message'],
      'date': ['notice_date', 'date'],
      'applicable_class': ['applicable_class'],
      'status': ['record_status', 'status']
    };

    for (const [key, alternatives] of Object.entries(columnMap)) {
      const found = alternatives.find(alt => existingColumns.includes(alt));
      if (found) {
        selectFields.push(`${found} as ${key}`);
      }
    }

    let query;
    if (selectFields.length === 0) {
      query = `SELECT * FROM ${tableName}`;
    } else {
      query = `SELECT ${selectFields.join(', ')} FROM ${tableName}`;
      if (existingColumns.includes('record_status')) {
        query += ` WHERE record_status = 'Active'`;
      }
      query += ' ORDER BY notice_date DESC';
    }

    console.log('📝 Executing query:', query);
    const result = await pool.query(query);
    console.log(`✅ Found ${result.rows.length} notices`);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('❌ Database error:', error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('📝 Received notice data:', body);
    
    const tableName = await getTableName('notice_board');
    if (!tableName) {
      return NextResponse.json({
        error: 'Notice table not found'
      }, { status: 500 });
    }

    const {
      title,
      message,
      date,
      applicable_class
    } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      );
    }

    // Get column names
    const columnsResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);
    
    const existingColumns = columnsResult.rows.map(r => r.column_name);

    const insertColumns = [];
    const values = [];

    const fieldMap = {
      'notice_title': title,
      'notice_text': message,
      'notice_date': date || new Date().toISOString().split('T')[0],
      'applicable_class': applicable_class || 'all'
    };

    for (const [column, value] of Object.entries(fieldMap)) {
      if (existingColumns.includes(column)) {
        insertColumns.push(column);
        values.push(value);
      }
    }

    if (existingColumns.includes('record_status')) {
      insertColumns.push('record_status');
      values.push('Active');
    }

    if (insertColumns.length === 0) {
      return NextResponse.json(
        { error: 'No matching columns found' },
        { status: 400 }
      );
    }

    const columnNames = insertColumns.join(', ');
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    const query = `INSERT INTO ${tableName} (${columnNames}) VALUES (${placeholders}) RETURNING *`;

    console.log('📝 Insert query:', query);
    const result = await pool.query(query, values);

    return NextResponse.json({
      success: true,
      notice: result.rows[0]
    }, { status: 201 });
  } catch (error) {
    console.error('❌ Error adding notice:', error);
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Notice ID is required' },
        { status: 400 }
      );
    }

    const tableName = await getTableName('notice_board');
    if (!tableName) {
      return NextResponse.json(
        { error: 'Notice table not found' },
        { status: 500 }
      );
    }

    const result = await pool.query(
      `UPDATE ${tableName} SET record_status = 'Deleted' WHERE notice_id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: `Notice with ID ${id} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notice deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting notice:', error);
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}
