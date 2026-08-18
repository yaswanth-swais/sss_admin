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
    const result = await pool.query(
      `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `,
      [tableName]
    );

    return result.rows.map((row) => row.column_name);
  } catch (error) {
    console.error('Error getting columns:', error);
    return [];
  }
}

// Helper to find a column that exists
function findColumn(possibleColumns, existingColumns) {
  for (const column of possibleColumns) {
    if (existingColumns.includes(column)) {
      return column;
    }
  }

  return null;
}

// Detect which student table to use
async function getTableName() {
  // First preference: sss_student_master
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

  // Fallback: sgs_student_master
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
}

export async function GET() {
  try {
    console.log('🔍 Fetching students...');

    const tableName = await getTableName();

    if (!tableName) {
      console.log('❌ No student table found');
      return NextResponse.json([], { status: 200 });
    }

    const existingColumns = await getExistingColumns(tableName);

    console.log('📋 Available columns:', existingColumns);

    // Map frontend fields to possible database columns
    const columnMap = {
      admission_no: ['admission_no', 'student_id'],

      full_name: ['full_name', 'name', 'student_name'],

      class_id: ['class_id'],

      class_name: ['class_name'],

      section: ['section'],

      roll_no: ['roll_no', 'roll_number'],

      parent1_name: [
        'parent1_name',
        'parent_name',
        'father_name',
      ],

      parent1_phone: [
        'parent1_phone',
        'parent_phone',
        'mobile_no',
      ],

      parent1_email: [
        'parent1_email',
        'parent_email',
      ],

      parent2_name: [
        'parent2_name',
        'mother_name',
      ],

      parent2_phone: [
        'parent2_phone',
      ],

      parent2_email: [
        'parent2_email',
      ],

      student_phone: [
        'student_phone',
        'student_contact',
      ],

      student_email: [
        'student_email',
      ],

      guardian_name: [
        'guardian_name',
      ],

      guardian_phone: [
        'guardian_phone',
      ],

      guardian_email: [
        'guardian_email',
      ],

      record_status: [
        'record_status',
        'status',
        'is_active',
      ],

      student_photo_key: [
        'student_photo_key',
      ],

      parent1_photo_key: [
        'parent1_photo_key',
      ],

      parent2_photo_key: [
        'parent2_photo_key',
      ],

      guardian_photo_key: [
        'guardian_photo_key',
      ],
    };

    const selectFields = [];

    for (const [frontendField, possibleColumns] of Object.entries(
      columnMap
    )) {
      const foundColumn = findColumn(
        possibleColumns,
        existingColumns
      );

      if (foundColumn) {
        selectFields.push(
          `${foundColumn} AS ${frontendField}`
        );
      }
    }

    let query;

    if (selectFields.length === 0) {
      query = `SELECT * FROM ${tableName}`;
    } else {
      query = `
        SELECT ${selectFields.join(', ')}
        FROM ${tableName}
      `;

      const statusCol = findColumn(
        ['record_status', 'status', 'is_active'],
        existingColumns
      );

      if (statusCol) {
        // Handle both text status and boolean is_active
        if (statusCol === 'is_active') {
          query += `
            WHERE ${statusCol} = true
          `;
        } else {
          query += `
            WHERE ${statusCol} = 'Active'
          `;
        }
      }

      const idCol = findColumn(
        ['admission_no', 'student_id'],
        existingColumns
      );

      if (idCol) {
        query += `
          ORDER BY ${idCol}
        `;
      }
    }

    console.log('📝 Executing query:', query);

    const result = await pool.query(query);

    console.log(
      `✅ Found ${result.rows.length} students`
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('❌ Database error:', error);

    return NextResponse.json([], {
      status: 200,
    });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    console.log(
      '📝 Received student data:',
      body
    );

    const tableName = await getTableName();

    if (!tableName) {
      return NextResponse.json(
        {
          error: 'Student table not found',
        },
        {
          status: 500,
        }
      );
    }

    const existingColumns =
      await getExistingColumns(tableName);

    console.log(
      '📋 Available columns for INSERT:',
      existingColumns
    );

    // Map frontend fields to database columns
    const fieldMap = {
      admission_no: [
        'admission_no',
        'student_id',
      ],

      full_name: [
        'full_name',
        'name',
        'student_name',
      ],

      class_id: [
        'class_id',
      ],

      class_name: [
        'class_name',
      ],

      section: [
        'section',
      ],

      roll_no: [
        'roll_no',
        'roll_number',
      ],

      parent1_name: [
        'parent1_name',
        'parent_name',
        'father_name',
      ],

      parent1_phone: [
        'parent1_phone',
        'parent_phone',
        'mobile_no',
      ],

      parent1_email: [
        'parent1_email',
        'parent_email',
      ],

      parent2_name: [
        'parent2_name',
        'mother_name',
      ],

      parent2_phone: [
        'parent2_phone',
      ],

      parent2_email: [
        'parent2_email',
      ],

      student_phone: [
        'student_phone',
        'student_contact',
      ],

      student_email: [
        'student_email',
      ],

      guardian_name: [
        'guardian_name',
      ],

      guardian_phone: [
        'guardian_phone',
      ],

      guardian_email: [
        'guardian_email',
      ],

      student_photo_key: [
        'student_photo_key',
      ],

      parent1_photo_key: [
        'parent1_photo_key',
      ],

      parent2_photo_key: [
        'parent2_photo_key',
      ],

      guardian_photo_key: [
        'guardian_photo_key',
      ],
    };

    const insertColumns = [];
    const values = [];

    for (const [
      frontendKey,
      possibleColumns,
    ] of Object.entries(fieldMap)) {
      const foundColumn = findColumn(
        possibleColumns,
        existingColumns
      );

      if (foundColumn) {
        insertColumns.push(foundColumn);

        let value =
          body[frontendKey] !== undefined
            ? body[frontendKey]
            : null;

        // Handle class_id
        if (
          frontendKey === 'class_id' &&
          value !== null &&
          value !== ''
        ) {
          value = parseInt(value, 10) || null;
        }

        values.push(value);
      }
    }

    // Add status column
    const statusCol = findColumn(
      ['record_status', 'status', 'is_active'],
      existingColumns
    );

    if (statusCol) {
      insertColumns.push(statusCol);

      if (statusCol === 'is_active') {
        values.push(true);
      } else {
        values.push('Active');
      }
    }

    if (insertColumns.length === 0) {
      return NextResponse.json(
        {
          error:
            'No matching columns found in the database table',
        },
        {
          status: 400,
        }
      );
    }

    const columnNames =
      insertColumns.join(', ');

    const placeholders = values
      .map((_, index) => `$${index + 1}`)
      .join(', ');

    const query = `
      INSERT INTO ${tableName}
      (${columnNames})
      VALUES (${placeholders})
      RETURNING *
    `;

    console.log(
      '📝 Insert query:',
      query
    );

    console.log(
      '📊 Values:',
      values
    );

    // Check duplicate admission number
    const idCol = findColumn(
      ['admission_no', 'student_id'],
      existingColumns
    );

    if (
      idCol &&
      body.admission_no
    ) {
      const checkDuplicate =
        await pool.query(
          `
            SELECT ${idCol}
            FROM ${tableName}
            WHERE ${idCol} = $1
          `,
          [body.admission_no]
        );

      if (checkDuplicate.rows.length > 0) {
        return NextResponse.json(
          {
            error: `Student ID ${body.admission_no} already exists`,
          },
          {
            status: 400,
          }
        );
      }
    }

    const result =
      await pool.query(query, values);

    console.log(
      '✅ Student added successfully:',
      result.rows[0]
    );

    return NextResponse.json(
      {
        success: true,
        student: result.rows[0],
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      '❌ Error adding student:',
      error
    );

    return NextResponse.json(
      {
        error: error.message,
        details: error.stack,
      },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();

    console.log(
      '📝 Updating student:',
      body
    );

    const tableName = await getTableName();

    if (!tableName) {
      return NextResponse.json(
        {
          error: 'Student table not found',
        },
        {
          status: 500,
        }
      );
    }

    const existingColumns =
      await getExistingColumns(tableName);

    const idCol = findColumn(
      ['admission_no', 'student_id'],
      existingColumns
    );

    const studentId =
      body.admission_no ||
      body.student_id ||
      body.id;

    if (!studentId || !idCol) {
      return NextResponse.json(
        {
          error: 'Student ID is required',
        },
        {
          status: 400,
        }
      );
    }

    // Check if student exists
    const checkExists =
      await pool.query(
        `
          SELECT ${idCol}
          FROM ${tableName}
          WHERE ${idCol} = $1
        `,
        [studentId]
      );

    if (checkExists.rows.length === 0) {
      return NextResponse.json(
        {
          error: `Student with ID ${studentId} not found`,
        },
        {
          status: 404,
        }
      );
    }

    // Map frontend fields to database columns
    const fieldMap = {
      full_name: [
        'full_name',
        'name',
        'student_name',
      ],

      class_id: [
        'class_id',
      ],

      class_name: [
        'class_name',
      ],

      section: [
        'section',
      ],

      roll_no: [
        'roll_no',
        'roll_number',
      ],

      parent1_name: [
        'parent1_name',
        'parent_name',
        'father_name',
      ],

      parent1_phone: [
        'parent1_phone',
        'parent_phone',
        'mobile_no',
      ],

      parent1_email: [
        'parent1_email',
        'parent_email',
      ],

      parent2_name: [
        'parent2_name',
        'mother_name',
      ],

      parent2_phone: [
        'parent2_phone',
      ],

      parent2_email: [
        'parent2_email',
      ],

      student_phone: [
        'student_phone',
        'student_contact',
      ],

      student_email: [
        'student_email',
      ],

      guardian_name: [
        'guardian_name',
      ],

      guardian_phone: [
        'guardian_phone',
      ],

      guardian_email: [
        'guardian_email',
      ],

      student_photo_key: [
        'student_photo_key',
      ],

      parent1_photo_key: [
        'parent1_photo_key',
      ],

      parent2_photo_key: [
        'parent2_photo_key',
      ],

      guardian_photo_key: [
        'guardian_photo_key',
      ],
    };

    const setClauses = [];
    const values = [];

    let paramCounter = 1;

    for (const [
      frontendKey,
      possibleColumns,
    ] of Object.entries(fieldMap)) {
      const foundColumn = findColumn(
        possibleColumns,
        existingColumns
      );

      if (
        foundColumn &&
        body[frontendKey] !== undefined
      ) {
        let value =
          body[frontendKey];

        // Handle class_id
        if (
          frontendKey === 'class_id' &&
          value !== null &&
          value !== ''
        ) {
          value =
            parseInt(value, 10) || null;
        }

        setClauses.push(
          `${foundColumn} = $${paramCounter}`
        );

        values.push(value);

        paramCounter++;
      }
    }

    if (setClauses.length === 0) {
      return NextResponse.json(
        {
          error: 'No fields to update',
        },
        {
          status: 400,
        }
      );
    }

    values.push(studentId);

    const query = `
      UPDATE ${tableName}
      SET ${setClauses.join(', ')}
      WHERE ${idCol} = $${paramCounter}
      RETURNING *
    `;

    console.log(
      '📝 Update query:',
      query
    );

    console.log(
      '📊 Values:',
      values
    );

    const result =
      await pool.query(
        query,
        values
      );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          error: `Student with ID ${studentId} not found`,
        },
        {
          status: 404,
        }
      );
    }

    console.log(
      '✅ Student updated successfully:',
      result.rows[0]
    );

    return NextResponse.json({
      success: true,
      student: result.rows[0],
    });
  } catch (error) {
    console.error(
      '❌ Error updating student:',
      error
    );

    return NextResponse.json(
      {
        error: error.message,
        details: error.stack,
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } =
      new URL(request.url);

    const id =
      searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          error: 'Student ID is required',
        },
        {
          status: 400,
        }
      );
    }

    const tableName =
      await getTableName();

    if (!tableName) {
      return NextResponse.json(
        {
          error: 'Student table not found',
        },
        {
          status: 500,
        }
      );
    }

    const existingColumns =
      await getExistingColumns(
        tableName
      );

    const idCol = findColumn(
      ['admission_no', 'student_id'],
      existingColumns
    );

    const statusCol = findColumn(
      [
        'record_status',
        'status',
        'is_active',
      ],
      existingColumns
    );

    if (!idCol || !statusCol) {
      return NextResponse.json(
        {
          error:
            'Required columns not found',
        },
        {
          status: 500,
        }
      );
    }

    let result;

    if (statusCol === 'is_active') {
      result = await pool.query(
        `
          UPDATE ${tableName}
          SET ${statusCol} = false
          WHERE ${idCol} = $1
          RETURNING *
        `,
        [id]
      );
    } else {
      result = await pool.query(
        `
          UPDATE ${tableName}
          SET ${statusCol} = 'Deleted'
          WHERE ${idCol} = $1
          RETURNING *
        `,
        [id]
      );
    }

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          error: `Student with ID ${id} not found`,
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        'Student deleted successfully',
    });
  } catch (error) {
    console.error(
      '❌ Error deleting student:',
      error
    );

    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}