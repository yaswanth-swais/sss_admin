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
    console.log('🔍 Fetching teachers from SSS...');
    
    // Check if sss_teacher_master exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'sss_teacher_master'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ sss_teacher_master table not found');
      return NextResponse.json([], { status: 200 });
    }
    
    // Get column names
    const columnsResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sss_teacher_master'
      ORDER BY ordinal_position
    `);
    
    const existingColumns = columnsResult.rows.map(r => r.column_name);
    console.log('📋 Available columns:', existingColumns);

    // Build query based on available columns
    let selectFields = [];
    
    // Map SSS teacher columns to frontend expected fields
    if (existingColumns.includes('teacher_id')) {
      selectFields.push('teacher_id::text as id');
    }
    if (existingColumns.includes('full_name')) {
      selectFields.push('full_name as name');
    } else if (existingColumns.includes('first_name') && existingColumns.includes('last_name')) {
      selectFields.push("CONCAT(first_name, ' ', last_name) as name");
    }
    if (existingColumns.includes('subject_name')) {
      selectFields.push('subject_name as subject');
    } else if (existingColumns.includes('subject')) {
      selectFields.push('subject as subject');
    }
    if (existingColumns.includes('qualification')) {
      selectFields.push('qualification');
    }
    if (existingColumns.includes('class_id')) {
      selectFields.push('class_id');
    }
    if (existingColumns.includes('section_1')) {
      selectFields.push('section_1');
    }
    if (existingColumns.includes('section_2')) {
      selectFields.push('section_2');
    }
    if (existingColumns.includes('role')) {
      selectFields.push('role');
    }
    if (existingColumns.includes('is_class_teacher')) {
      selectFields.push('is_class_teacher');
    }
    if (existingColumns.includes('subjects')) {
      selectFields.push('subjects');
    }
    if (existingColumns.includes('phone')) {
      selectFields.push('phone as contact');
    } else if (existingColumns.includes('contact')) {
      selectFields.push('contact');
    }
    if (existingColumns.includes('email_id')) {
      selectFields.push('email_id as email');
    } else if (existingColumns.includes('email')) {
      selectFields.push('email');
    }
    if (existingColumns.includes('is_active')) {
      selectFields.push('is_active');
      selectFields.push("CASE WHEN is_active = true THEN 'Active' ELSE 'Inactive' END as status");
    }

    let query;
    if (selectFields.length === 0) {
      query = `SELECT * FROM sss_teacher_master`;
    } else {
      query = `SELECT ${selectFields.join(', ')} FROM sss_teacher_master`;
      if (existingColumns.includes('is_active')) {
        query += ` WHERE is_active = true OR is_active IS NULL`;
      } else if (existingColumns.includes('record_status')) {
        query += ` WHERE record_status = 'Active'`;
      }
      if (existingColumns.includes('teacher_id')) {
        query += ' ORDER BY teacher_id';
      }
    }

    console.log('📝 Executing query:', query);
    const result = await pool.query(query);
    console.log(`✅ Found ${result.rows.length} teachers`);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('❌ Database error:', error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('📝 Received teacher data:', body);
    
    const { teacher_id, name, subject, qualification, class_id, section_1, section_2, role, is_class_teacher, subjects, contact, email, status } = body;

    if (!teacher_id || !name || !email) {
      return NextResponse.json(
        { error: 'Teacher ID, Name, and Email are required' },
        { status: 400 }
      );
    }

    // Insert into sss_teacher_master
    const result = await pool.query(`
      INSERT INTO sss_teacher_master 
      (teacher_id, full_name, subject_name, qualification, class_id, section_1, section_2, role, is_class_teacher, subjects, phone, email_id, is_active) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      teacher_id, name, subject || null, qualification || null,
      class_id || null, section_1 || null, section_2 || null,
      role || 'Teacher', is_class_teacher || false,
      subjects || null, contact || null, email,
      status === 'Active'
    ]);

    return NextResponse.json({
      success: true,
      teacher: result.rows[0]
    }, { status: 201 });
  } catch (error) {
    console.error('❌ Error adding teacher:', error);
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { teacher_id, name, subject, qualification, class_id, section_1, section_2, role, is_class_teacher, subjects, contact, email, status } = body;

    if (!teacher_id) {
      return NextResponse.json(
        { error: 'Teacher ID is required' },
        { status: 400 }
      );
    }

    const result = await pool.query(`
      UPDATE sss_teacher_master SET
        full_name = $1, subject_name = $2, qualification = $3,
        class_id = $4, section_1 = $5, section_2 = $6,
        role = $7, is_class_teacher = $8, subjects = $9,
        phone = $10, email_id = $11, is_active = $12
      WHERE teacher_id = $13
      RETURNING *
    `, [
      name, subject || null, qualification || null,
      class_id || null, section_1 || null, section_2 || null,
      role || 'Teacher', is_class_teacher || false,
      subjects || null, contact || null, email,
      status === 'Active',
      teacher_id
    ]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: `Teacher with ID ${teacher_id} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Teacher updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating teacher:', error);
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
        { error: 'Teacher ID is required' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE sss_teacher_master SET is_active = false WHERE teacher_id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: `Teacher with ID ${id} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Teacher deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting teacher:', error);
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}
