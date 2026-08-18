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
    console.log('🔍 Fetching students from SSS...');
    
    // Check if sss_student_master exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'sss_student_master'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ sss_student_master table not found');
      return NextResponse.json([], { status: 200 });
    }
    
    // Get column names
    const columnsResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sss_student_master'
      ORDER BY ordinal_position
    `);
    
    const existingColumns = columnsResult.rows.map(r => r.column_name);
    console.log('📋 Available columns:', existingColumns);

    // Build query based on existing columns
    let selectFields = [];
    
    // Map SSS columns to frontend expected fields
    const columnMap = {
      'admission_no': ['admission_no', 'student_id'],
      'full_name': ['name', 'full_name', 'student_name'],
      'class_id': ['class_id'],
      'section': ['section'],
      'roll_no': ['roll_number', 'roll_no'],
      'parent1_name': ['parent_name', 'parent1_name'],
      'parent1_phone': ['parent_phone', 'parent1_phone'],
      'parent1_email': ['parent_email', 'parent1_email'],
      'student_phone': ['student_phone'],
      'student_email': ['student_email'],
      'guardian_name': ['guardian_name'],
      'guardian_phone': ['guardian_phone'],
      'guardian_email': ['guardian_email'],
      'record_status': ['record_status', 'status'],
      'student_photo_key': ['student_photo_key'],
      'parent1_photo_key': ['parent1_photo_key'],
      'parent2_photo_key': ['parent2_photo_key'],
      'guardian_photo_key': ['guardian_photo_key']

    };

    for (const [asField, possibleColumns] of Object.entries(columnMap)) {
      for (const col of possibleColumns) {
        if (existingColumns.includes(col)) {
          selectFields.push(`${col} as ${asField}`);
          break;
        }
      }
    }

    let query;
    if (selectFields.length === 0) {
      query = `SELECT * FROM sss_student_master`;
    } else {
      query = `SELECT ${selectFields.join(', ')} FROM sss_student_master`;
      if (existingColumns.includes('record_status')) {
        query += ` WHERE record_status = 'Active'`;
      } else if (existingColumns.includes('status')) {
        query += ` WHERE status = 'Active'`;
      }
      if (existingColumns.includes('admission_no')) {
        query += ' ORDER BY admission_no';
      } else if (existingColumns.includes('student_id')) {
        query += ' ORDER BY student_id';
      }
    }

    console.log('📝 Executing query:', query);
    const result = await pool.query(query);
    console.log(`✅ Found ${result.rows.length} students`);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('❌ Database error:', error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('📝 Received student data:', body);

    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'sss_student_master'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      return NextResponse.json({
        error: 'sss_student_master table not found'
      }, { status: 500 });
    }

    // Get column names
    const columnsResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sss_student_master'
      ORDER BY ordinal_position
    `);
    
    const existingColumns = columnsResult.rows.map(r => r.column_name);

    // Map frontend fields to database columns
    const fieldMap = {
      'admission_no': ['admission_no', 'student_id'],
      'full_name': ['name', 'full_name', 'student_name'],
      'class_id': ['class_id'],
      'section': ['section'],
      'roll_no': ['roll_number', 'roll_no'],
      'parent1_name': ['parent_name', 'parent1_name'],
      'parent1_phone': ['parent_phone', 'parent1_phone'],
      'parent1_email': ['parent_email', 'parent1_email'],
      'student_phone': ['student_phone'],
      'student_email': ['student_email'],
      'guardian_name': ['guardian_name'],
      'guardian_phone': ['guardian_phone'],
      'guardian_email': ['guardian_email']
    };

    const insertColumns = [];
    const values = [];

    for (const [frontendKey, dbAlternatives] of Object.entries(fieldMap)) {
      const foundColumn = dbAlternatives.find(alt => existingColumns.includes(alt));
      if (foundColumn) {
        insertColumns.push(foundColumn);
        let value = body[frontendKey] || null;
        if (frontendKey === 'class_id' && value) {
          value = parseInt(value) || null;
        }
        values.push(value);
      }
    }

    if (existingColumns.includes('record_status')) {
      insertColumns.push('record_status');
      values.push('Active');
    }

    if (insertColumns.length === 0) {
      return NextResponse.json({
        error: 'No matching columns found'
      }, { status: 400 });
    }

    const columnNames = insertColumns.join(', ');
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    const query = `INSERT INTO sss_student_master (${columnNames}) VALUES (${placeholders}) RETURNING *`;

    console.log('📝 Insert query:', query);
    const result = await pool.query(query, values);

    return NextResponse.json({
      success: true,
      student: result.rows[0]
    }, { status: 201 });
  } catch (error) {
    console.error('❌ Error adding student:', error);
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const admissionNo = body.admission_no;
    
    if (!admissionNo) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    const columnsResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sss_student_master'
      ORDER BY ordinal_position
    `);
    
    const existingColumns = columnsResult.rows.map(r => r.column_name);

    const fieldMap = {
      'full_name': ['name', 'full_name', 'student_name'],
      'class_id': ['class_id'],
      'section': ['section'],
      'roll_no': ['roll_number', 'roll_no'],
      'parent1_name': ['parent_name', 'parent1_name'],
      'parent1_phone': ['parent_phone', 'parent1_phone'],
      'parent1_email': ['parent_email', 'parent1_email'],
      'student_phone': ['student_phone'],
      'student_email': ['student_email'],
      'guardian_name': ['guardian_name'],
      'guardian_phone': ['guardian_phone'],
      'guardian_email': ['guardian_email']
    };

    const setClauses = [];
    const values = [];
    let paramCounter = 1;

    for (const [frontendKey, dbAlternatives] of Object.entries(fieldMap)) {
      const foundColumn = dbAlternatives.find(alt => existingColumns.includes(alt));
      if (foundColumn && body[frontendKey] !== undefined) {
        let value = body[frontendKey];
        if (frontendKey === 'class_id' && value) {
          value = parseInt(value) || null;
        }
        setClauses.push(`${foundColumn} = $${paramCounter}`);
        values.push(value);
        paramCounter++;
      }
    }

    if (setClauses.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    values.push(admissionNo);
    const query = `UPDATE sss_student_master SET ${setClauses.join(', ')} WHERE admission_no = $${paramCounter} RETURNING *`;

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: `Student with ID ${admissionNo} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Student updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating student:', error);
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
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    const columnsResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sss_student_master'
    `);
    const existingColumns = columnsResult.rows.map(r => r.column_name);

    let query;
    if (existingColumns.includes('record_status')) {
      query = `UPDATE sss_student_master SET record_status = 'Deleted' WHERE admission_no = $1 RETURNING *`;
    } else {
      query = `DELETE FROM sss_student_master WHERE admission_no = $1 RETURNING *`;
    }

    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: `Student with ID ${id} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting student:', error);
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}
