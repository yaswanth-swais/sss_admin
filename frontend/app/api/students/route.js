import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'swais-db-test-env.cri2kcc26kxg.ap-south-2.rds.amazonaws.com',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'sss_prod',
  user: process.env.DB_USER || 'swais_app_user',
  password: process.env.DB_PASSWORD || 'Swaisuser007',
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

export async function GET() {
  try {
    console.log('🔍 GET - Fetching students...');
    
    const tableName = await getTableName();
    if (!tableName) {
      console.log('❌ No student table found');
      return NextResponse.json([], { status: 200 });
    }
    
    const existingColumns = await getExistingColumns(tableName);
    console.log('📋 Available columns:', existingColumns);

    // Map frontend fields to database columns
    const columnMap = {
      'admission_no': ['admission_no', 'student_id'],
      'full_name': ['full_name', 'name', 'student_name'],
      'class_id': ['class_id'],
      'class_name': ['class_name'],
      'section': ['section'],
      'roll_no': ['roll_no', 'roll_number'],
      'parent1_name': ['parent1_name', 'parent_name', 'father_name'],
      'parent1_phone': ['parent1_phone', 'parent_phone', 'mobile_no'],
      'parent1_email': ['parent1_email', 'parent_email'],
      'parent2_name': ['parent2_name', 'mother_name'],
      'parent2_phone': ['parent2_phone'],
      'parent2_email': ['parent2_email'],
      'student_phone': ['student_phone', 'student_contact'],
      'student_email': ['student_email'],
      'guardian_name': ['guardian_name'],
      'guardian_phone': ['guardian_phone'],
      'guardian_email': ['guardian_email'],
      'record_status': ['record_status', 'status', 'is_active']
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
      const statusCol = findColumn(['record_status', 'status', 'is_active'], existingColumns);
      if (statusCol) {
        // Check if the column type is text/varchar or boolean
        try {
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
        } catch (error) {
          console.error('Error checking column type:', error);
          query += ` WHERE ${statusCol} = 'Active'`;
        }
      }
      const idCol = findColumn(['admission_no', 'student_id'], existingColumns);
      if (idCol) {
        query += ` ORDER BY ${idCol}`;
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
    console.log('📝 POST - Received student data:', body);

    const tableName = await getTableName();
    if (!tableName) {
      return NextResponse.json({
        error: 'Student table not found'
      }, { status: 500 });
    }

    const existingColumns = await getExistingColumns(tableName);
    console.log('📋 Available columns for INSERT:', existingColumns);

    // Map frontend fields to database columns
    const fieldMap = {
      'admission_no': ['admission_no', 'student_id'],
      'full_name': ['full_name', 'name', 'student_name'],
      'class_id': ['class_id'],
      'class_name': ['class_name'],
      'section': ['section'],
      'roll_no': ['roll_no', 'roll_number'],
      'parent1_name': ['parent1_name', 'parent_name', 'father_name'],
      'parent1_phone': ['parent1_phone', 'parent_phone', 'mobile_no'],
      'parent1_email': ['parent1_email', 'parent_email'],
      'parent2_name': ['parent2_name', 'mother_name'],
      'parent2_phone': ['parent2_phone'],
      'parent2_email': ['parent2_email'],
      'student_phone': ['student_phone', 'student_contact'],
      'student_email': ['student_email'],
      'guardian_name': ['guardian_name'],
      'guardian_phone': ['guardian_phone'],
      'guardian_email': ['guardian_email']
    };

    const insertColumns = [];
    const values = [];

    for (const [frontendKey, possibleColumns] of Object.entries(fieldMap)) {
      const found = findColumn(possibleColumns, existingColumns);
      if (found) {
        insertColumns.push(found);
        let value = body[frontendKey] || null;
        if (frontendKey === 'class_id' && value) {
          value = parseInt(value) || null;
        }
        values.push(value);
      }
    }

    // Add status column
    const statusCol = findColumn(['record_status', 'status', 'is_active'], existingColumns);
    if (statusCol) {
      insertColumns.push(statusCol);
      // Check if column is boolean or text
      try {
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
      } catch (error) {
        console.error('Error checking column type:', error);
        values.push('Active');
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

    // Check for duplicate admission number
    const idCol = findColumn(['admission_no', 'student_id'], existingColumns);
    if (idCol && body.admission_no) {
      const checkDuplicate = await pool.query(
        `SELECT ${idCol} FROM ${tableName} WHERE ${idCol} = $1`,
        [body.admission_no]
      );
      if (checkDuplicate.rows.length > 0) {
        return NextResponse.json(
          { error: `Student ID ${body.admission_no} already exists` },
          { status: 400 }
        );
      }
    }

    const result = await pool.query(query, values);
    console.log('✅ Student added successfully:', result.rows[0]);

    return NextResponse.json({
      success: true,
      student: result.rows[0]
    }, { status: 201 });
  } catch (error) {
    console.error('❌ Error adding student:', error);
    return NextResponse.json({
      error: error.message,
      details: error.stack
    }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    console.log('📝 PUT - Updating student:', body);

    const tableName = await getTableName();
    if (!tableName) {
      return NextResponse.json({
        error: 'Student table not found'
      }, { status: 500 });
    }

    const existingColumns = await getExistingColumns(tableName);
    
    const idCol = findColumn(['admission_no', 'student_id'], existingColumns);
    const studentId = body.admission_no || body.student_id || body.id;
    
    if (!studentId || !idCol) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Check if student exists
    const checkExists = await pool.query(
      `SELECT ${idCol} FROM ${tableName} WHERE ${idCol} = $1`,
      [studentId]
    );

    if (checkExists.rows.length === 0) {
      return NextResponse.json(
        { error: `Student with ID ${studentId} not found` },
        { status: 404 }
      );
    }

    // Map frontend fields to database columns for UPDATE
    const fieldMap = {
      'full_name': ['full_name', 'name', 'student_name'],
      'class_id': ['class_id'],
      'class_name': ['class_name'],
      'section': ['section'],
      'roll_no': ['roll_no', 'roll_number'],
      'parent1_name': ['parent1_name', 'parent_name', 'father_name'],
      'parent1_phone': ['parent1_phone', 'parent_phone', 'mobile_no'],
      'parent1_email': ['parent1_email', 'parent_email'],
      'parent2_name': ['parent2_name', 'mother_name'],
      'parent2_phone': ['parent2_phone'],
      'parent2_email': ['parent2_email'],
      'student_phone': ['student_phone', 'student_contact'],
      'student_email': ['student_email'],
      'guardian_name': ['guardian_name'],
      'guardian_phone': ['guardian_phone'],
      'guardian_email': ['guardian_email'],
      'status': ['record_status', 'status', 'is_active']
    };

    const setClauses = [];
    const values = [];
    let paramCounter = 1;

    for (const [frontendKey, possibleColumns] of Object.entries(fieldMap)) {
      const found = findColumn(possibleColumns, existingColumns);
      if (found && body[frontendKey] !== undefined) {
        let value = body[frontendKey];
        if (frontendKey === 'class_id' && value) {
          value = parseInt(value) || null;
        }
        // Handle status/record_status specially
        if (frontendKey === 'status') {
          try {
            const colType = await pool.query(`
              SELECT data_type 
              FROM information_schema.columns 
              WHERE table_name = $1 AND column_name = $2
            `, [tableName, found]);
            
            const dataType = colType.rows[0]?.data_type || '';
            if (dataType === 'boolean') {
              value = value === 'Active' || value === true;
            }
          } catch (error) {
            console.error('Error checking column type for status:', error);
          }
        }
        setClauses.push(`${found} = $${paramCounter}`);
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

    values.push(studentId);
    const query = `UPDATE ${tableName} SET ${setClauses.join(', ')} WHERE ${idCol} = $${paramCounter} RETURNING *`;

    console.log('📝 Update query:', query);
    console.log('📊 Values:', values);

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: `Student with ID ${studentId} not found` },
        { status: 404 }
      );
    }

    console.log('✅ Student updated successfully:', result.rows[0]);

    return NextResponse.json({
      success: true,
      student: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error updating student:', error);
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

    const tableName = await getTableName();
    if (!tableName) {
      return NextResponse.json({
        error: 'Student table not found'
      }, { status: 500 });
    }

    const existingColumns = await getExistingColumns(tableName);
    const idCol = findColumn(['admission_no', 'student_id'], existingColumns);
    const statusCol = findColumn(['record_status', 'status', 'is_active'], existingColumns);

    if (!idCol || !statusCol) {
      return NextResponse.json(
        { error: 'Required columns not found' },
        { status: 500 }
      );
    }

    // Check column type for status
    let deleteValue = 'Deleted';
    try {
      const colType = await pool.query(`
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = $2
      `, [tableName, statusCol]);
      
      const dataType = colType.rows[0]?.data_type || '';
      if (dataType === 'boolean') {
        deleteValue = false;
      }
    } catch (error) {
      console.error('Error checking column type for delete:', error);
    }

    const result = await pool.query(
      `UPDATE ${tableName} SET ${statusCol} = $1 WHERE ${idCol} = $2 RETURNING *`,
      [deleteValue, id]
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
    console.error('❌ Error deleting student:', error);
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}
