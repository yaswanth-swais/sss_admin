import { NextResponse } from 'next/server';
import postgres from 'postgres';

export const dynamic = 'force-dynamic';

const sql = postgres(process.env.DATABASE_URL, { 
  ssl: 'require'
});

// Email validation - must end with @gmail.com
const validateEmail = (email) => {
  if (!email || email.trim() === '') return null;
  const trimmedEmail = email.trim().toLowerCase();
  if (trimmedEmail.endsWith('@gmail.com')) {
    return trimmedEmail;
  }
  return null;
};

export async function GET(request) {
  try {
    const students = await sql`
      SELECT
  student_id as "id",
  admission_no as "admissionNo",
  name as "name",
  class_name as "class",
  section as "section",
  roll_number as "rollNo",
  parent_name as "parentName",
  parent_phone as "parentPhone",
  parent_email as "parentEmail",
  student_phone as "contact",
  student_email as "email",
  guardian_name as "guardianName",
  guardian_phone as "guardianPhone",
  CASE
    WHEN is_active = true THEN 'active'
    ELSE 'inactive'
  END as "status"
FROM sss_student_master
      WHERE record_status = 'Active' OR record_status IS NULL
      ORDER BY student_id DESC
      LIMIT 100
    `;
    
    console.log('Returning', students.length, 'students');
    return NextResponse.json({ success: true, students: students });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      admissionNo, name, class: className, section, rollNo,
      parentName, parentPhone, parentEmail,
      contact, email, guardianName, guardianPhone, status
    } = body;
    
    const isActive = status === 'active';
    const validEmail = validateEmail(email);
    const validParentEmail = validateEmail(parentEmail);
    
    const result = await sql`
      INSERT INTO sss_student_master (
        admission_no,
        name,
        class_name,
        section,
        roll_number,
        parent_name,
        parent_phone,
        parent_email,
        student_phone,
        student_email,
        guardian_name,
        guardian_phone,
        is_active,
        created_at,
        record_status
      )
      VALUES (
        ${admissionNo || null},
        ${name}, 
        ${className || null},
        ${section || null},
        ${rollNo || null},
        ${parentName || null},
        ${parentPhone || null},
        ${validParentEmail},
        ${contact || null}, 
        ${validEmail},
        ${guardianName || null},
        ${guardianPhone || null},
        NOW(),
        'Active'
      )
      RETURNING student_id as id
    `;
    
    return NextResponse.json({ success: true, message: 'Student added successfully', student: result[0] });
  } catch (error) {
    console.error('Error inserting student:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
