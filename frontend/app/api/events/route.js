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

// Detect which table to use
async function getTableName() {
  // Check if sss_events exists
  const sssCheck = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'sss_events'
    )
  `);
  
  if (sssCheck.rows[0].exists) {
    console.log('📋 Using sss_events table');
    return 'sss_events';
  }
  
  // Fallback to sgs_events
  const sgsCheck = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'sgs_events'
    )
  `);
  
  if (sgsCheck.rows[0].exists) {
    console.log('📋 Using sgs_events table');
    return 'sgs_events';
  }
  
  return null;
}

export async function GET() {
  try {
    console.log('🔍 Fetching events...');
    
    const tableName = await getTableName();
    if (!tableName) {
      console.log('❌ No events table found');
      return NextResponse.json([], { status: 200 });
    }
    
    const existingColumns = await getExistingColumns(tableName);
    console.log('📋 Available columns:', existingColumns);

    // Map frontend fields to database columns
    const columnMap = {
      'id': ['event_id', 'id'],
      'title': ['event_title', 'title', 'name', 'event_name'],
      'message': ['event_description', 'description', 'message', 'event_message'],
      'date': ['event_date', 'date', 'start_date'],
      'status': ['status', 'record_status', 'is_active']
    };

    let selectFields = [];
    for (const [asField, possibleColumns] of Object.entries(columnMap)) {
      const found = findColumn(possibleColumns, existingColumns);
      if (found) {
        selectFields.push(`${found} as ${asField}`);
      }
    }

    let query;
    if (selectFields.length === 0) {
      query = `SELECT * FROM ${tableName}`;
    } else {
      query = `SELECT ${selectFields.join(', ')} FROM ${tableName}`;
      
      // Check status column type
      const statusCol = findColumn(['status', 'record_status', 'is_active'], existingColumns);
      if (statusCol) {
        const colType = await pool.query(`
          SELECT data_type 
          FROM information_schema.columns 
          WHERE table_name = $1 AND column_name = $2
        `, [tableName, statusCol]);
        
        const dataType = colType.rows[0]?.data_type || '';
        if (dataType === 'boolean') {
          query += ` WHERE ${statusCol} = true`;
        } else {
          query += ` WHERE ${statusCol} = 'Active'`;
        }
      }
      
      // Order by date
      const dateCol = findColumn(['event_date', 'date', 'start_date'], existingColumns);
      if (dateCol) {
        query += ` ORDER BY ${dateCol} DESC`;
      }
    }

    console.log('📝 Executing query:', query);
    const result = await pool.query(query);
    console.log(`✅ Found ${result.rows.length} events`);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('❌ Database error:', error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('📝 Received event data:', body);

    const tableName = await getTableName();
    if (!tableName) {
      return NextResponse.json({
        error: 'Events table not found'
      }, { status: 500 });
    }

    const existingColumns = await getExistingColumns(tableName);
    console.log('📋 Available columns for INSERT:', existingColumns);

    // Map frontend fields to database columns
    const fieldMap = {
      'title': ['event_title', 'title', 'name', 'event_name'],
      'message': ['event_description', 'description', 'message', 'event_message'],
      'date': ['event_date', 'date', 'start_date'],
      'status': ['status', 'record_status', 'is_active']
    };

    const insertColumns = [];
    const values = [];

    for (const [frontendKey, possibleColumns] of Object.entries(fieldMap)) {
      const found = findColumn(possibleColumns, existingColumns);
      if (found && body[frontendKey] !== undefined) {
        insertColumns.push(found);
        let value = body[frontendKey] || null;
        values.push(value);
      }
    }

    // Add status if not provided
    if (!body.status) {
      const statusCol = findColumn(['status', 'record_status', 'is_active'], existingColumns);
      if (statusCol) {
        insertColumns.push(statusCol);
        const colType = await pool.query(`
          SELECT data_type 
          FROM information_schema.columns 
          WHERE table_name = $1 AND column_name = $2
        `, [tableName, statusCol]);
        
        const dataType = colType.rows[0]?.data_type || '';
        if (dataType === 'boolean') {
          values.push(true);
        } else {
          values.push('Active');
        }
      }
    }

    if (insertColumns.length === 0) {
      return NextResponse.json({
        error: 'No matching columns found in the database table'
      }, { status: 400 });
    }

    const columnNames = insertColumns.join(', ');
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    const query = `INSERT INTO ${tableName} (${columnNames}) VALUES (${placeholders}) RETURNING *`;

    console.log('📝 Insert query:', query);
    console.log('📊 Values:', values);

    const result = await pool.query(query, values);
    console.log('✅ Event added successfully:', result.rows[0]);

    return NextResponse.json({
      success: true,
      event: result.rows[0]
    }, { status: 201 });
  } catch (error) {
    console.error('❌ Error adding event:', error);
    return NextResponse.json({
      error: error.message,
      details: error.stack
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const tableName = await getTableName();
    if (!tableName) {
      return NextResponse.json({
        error: 'Events table not found'
      }, { status: 500 });
    }

    const existingColumns = await getExistingColumns(tableName);
    const idCol = findColumn(['event_id', 'id'], existingColumns);
    const statusCol = findColumn(['status', 'record_status', 'is_active'], existingColumns);

    if (!idCol || !statusCol) {
      return NextResponse.json(
        { error: 'Required columns not found' },
        { status: 500 }
      );
    }

    // Check column type for status
    const colType = await pool.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = $1 AND column_name = $2
    `, [tableName, statusCol]);
    
    const dataType = colType.rows[0]?.data_type || '';
    let deleteValue = 'Deleted';
    if (dataType === 'boolean') {
      deleteValue = false;
    }

    const result = await pool.query(
      `UPDATE ${tableName} SET ${statusCol} = $1 WHERE ${idCol} = $2 RETURNING *`,
      [deleteValue, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: `Event with ID ${id} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting event:', error);
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}
