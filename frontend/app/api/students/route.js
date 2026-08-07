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
    console.log('Fetching students...');
    
    // Check if we can connect first
    const client = await pool.connect();
    client.release();
    
    const columnsResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sgs_student_master'
      ORDER BY ordinal_position
    `);
    const existingColumns = columnsResult.rows.map(r => r.column_name);

    let selectFields = [];
    const columnMap = {
      'admission_no': ['admission_no', 'student_id', 'id'],
      'full_name': ['full_name', 'student_name', 'name'],
      'class_id': ['class_id', 'class'],
      'section': ['section'],
      'roll_no': ['roll_no', 'roll_number'],
      'parent1_name': ['parent1_name', 'parent_1_name'],
      'parent1_phone': ['parent1_phone', 'parent_1_phone'],
      'parent1_email': ['parent1_email', 'parent_1_email'],
      'parent2_name': ['parent2_name', 'parent_2_name'],
      'parent2_phone': ['parent2_phone', 'parent_2_phone'],
      'parent2_email': ['parent2_email', 'parent_2_email'],
      'student_phone': ['student_phone', 'student_contact'],
      'student_email': ['student_email'],
      'guardian_name': ['guardian_name'],
      'guardian_phone': ['guardian_phone'],
      'guardian_email': ['guardian_email'],
      'record_status': ['record_status', 'status']
    };

    for (const [key, alternatives] of Object.entries(columnMap)) {
      const found = alternatives.find(alt => existingColumns.includes(alt));
      if (found) {
        selectFields.push(`${found} as ${key}`);
      }
    }

    let query = `SELECT ${selectFields.join(', ')} FROM sgs_student_master`;
    if (existingColumns.includes('record_status')) {
      query += ` WHERE record_status = 'Active'`;
    }
    query += ' ORDER BY admission_no';

    console.log('Executing query:', query);
    const result = await pool.query(query);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    // Return empty array instead of error
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Received student data:', body);

    // Check if we can connect first
    const client = await pool.connect();
    client.release();

    const columnsResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sgs_student_master'
      ORDER BY ordinal_position
    `);
    const existingColumns = columnsResult.rows.map(r => r.column_name);

    const fieldMap = {
      'admission_no': ['admission_no', 'student_id', 'id'],
      'full_name': ['full_name', 'student_name', 'name'],
      'class_id': ['class_id', 'class'],
      'section': ['section'],
      'roll_no': ['roll_no', 'roll_number'],
      'parent1_name': ['parent1_name', 'parent_1_name'],
      'parent1_phone': ['parent1_phone', 'parent_1_phone'],
      'parent1_email': ['parent1_email', 'parent_1_email'],
      'parent2_name': ['parent2_name', 'parent_2_name'],
      'parent2_phone': ['parent2_phone', 'parent_2_phone'],
      'parent2_email': ['parent2_email', 'parent_2_email'],
      'student_phone': ['student_phone', 'student_contact'],
      'student_email': ['student_email'],
      'guardian_name': ['guardian_name'],
      'guardian_phone': ['guardian_phone'],
      'guardian_email': ['guardian_email']
    };

    const insertColumns = [];
    const values = [];

    const frontendData = {
      admission_no: body.admission_no || body.admissionNo,
      full_name: body.full_name || body.name,
      class_id: body.class_id || body.class,
      section: body.section,
      roll_no: body.roll_no || body.rollNo,
      parent1_name: body.parent1_name || body.parentName,
      parent1_phone: body.parent1_phone || body.parentPhone,
      parent1_email: body.parent1_email || body.parentEmail,
      parent2_name: body.parent2_name || body.parent2Name,
      parent2_phone: body.parent2_phone || body.parent2Phone,
      parent2_email: body.parent2_email || body.parent2Email,
      student_phone: body.student_phone || body.contact,
      student_email: body.student_email || body.email,
      guardian_name: body.guardian_name || body.guardianName,
      guardian_phone: body.guardian_phone || body.guardianPhone,
      guardian_email: body.guardian_email || body.guardianEmail
    };

    for (const [frontendKey, dbAlternatives] of Object.entries(fieldMap)) {
      const foundColumn = dbAlternatives.find(alt => existingColumns.includes(alt));
      if (foundColumn) {
        insertColumns.push(foundColumn);
        let value = frontendData[frontendKey] || null;
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
        error: 'No matching columns found in the database table'
      }, { status: 400 });
    }

    const columnNames = insertColumns.join(', ');
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    const query = `INSERT INTO sgs_student_master (${columnNames}) VALUES (${placeholders}) RETURNING *`;

    console.log('Insert query:', query);
    console.log('Values:', values);

    // Check duplicate
    const admissionNo = frontendData.admission_no;
    if (admissionNo && existingColumns.includes('admission_no')) {
      const checkDuplicate = await pool.query(
        `SELECT admission_no FROM sgs_student_master WHERE admission_no = $1`,
        [admissionNo]
      );
      if (checkDuplicate.rows.length > 0) {
        return NextResponse.json(
          { error: `Student ID ${admissionNo} already exists` },
          { status: 400 }
        );
      }
    }

    const result = await pool.query(query, values);
    return NextResponse.json({
      success: true,
      student: result.rows[0]
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding student:', error);
    return NextResponse.json({
      error: error.message,
      details: error.stack
    }, { status: 500 });
  }
}

// Keep PUT and DELETE with similar error handling...
export async function PUT(request) {
  try {
    const body = await request.json();
    const admissionNo = body.admission_no || body.admissionNo;
    
    if (!admissionNo) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    client.release();

    const columnsResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sgs_student_master'
      ORDER BY ordinal_position
    `);
    const existingColumns = columnsResult.rows.map(r => r.column_name);

    const fieldMap = {
      'full_name': ['full_name', 'student_name', 'name'],
      'class_id': ['class_id', 'class'],
      'section': ['section'],
      'roll_no': ['roll_no', 'roll_number'],
      'parent1_name': ['parent1_name', 'parent_1_name'],
      'parent1_phone': ['parent1_phone', 'parent_1_phone'],
      'parent1_email': ['parent1_email', 'parent_1_email'],
      'parent2_name': ['parent2_name', 'parent_2_name'],
      'parent2_phone': ['parent2_phone', 'parent_2_phone'],
      'parent2_email': ['parent2_email', 'parent_2_email'],
      'student_phone': ['student_phone', 'student_contact'],
      'student_email': ['student_email'],
      'guardian_name': ['guardian_name'],
      'guardian_phone': ['guardian_phone'],
      'guardian_email': ['guardian_email']
    };

    const setClauses = [];
    const values = [];
    let paramCounter = 1;

    const updateData = {
      full_name: body.full_name || body.name,
      class_id: body.class_id || body.class,
      section: body.section,
      roll_no: body.roll_no || body.rollNo,
      parent1_name: body.parent1_name || body.parentName,
      parent1_phone: body.parent1_phone || body.parentPhone,
      parent1_email: body.parent1_email || body.parentEmail,
      parent2_name: body.parent2_name || body.parent2Name,
      parent2_phone: body.parent2_phone || body.parent2Phone,
      parent2_email: body.parent2_email || body.parent2Email,
      student_phone: body.student_phone || body.contact,
      student_email: body.student_email || body.email,
      guardian_name: body.guardian_name || body.guardianName,
      guardian_phone: body.guardian_phone || body.guardianPhone,
      guardian_email: body.guardian_email || body.guardianEmail
    };

    for (const [frontendKey, dbAlternatives] of Object.entries(fieldMap)) {
      const foundColumn = dbAlternatives.find(alt => existingColumns.includes(alt));
      if (foundColumn && updateData[frontendKey] !== undefined) {
        let value = updateData[frontendKey];
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
    const query = `UPDATE sgs_student_master SET ${setClauses.join(', ')} WHERE admission_no = $${paramCounter} RETURNING *`;

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
    console.error('Error updating student:', error);
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
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE sgs_student_master SET record_status = 'Deleted' WHERE admission_no = $1 RETURNING *`,
      [id]
    );

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
    console.error('Error deleting student:', error);
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}
