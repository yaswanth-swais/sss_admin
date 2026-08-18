import { NextResponse } from 'next/server';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

const validateEmail = (email) => {
  if (!email || email.trim() === '') return null;
  const trimmedEmail = email.trim().toLowerCase();
  if (trimmedEmail.endsWith('@gmail.com')) {
    return trimmedEmail;
  }
  return null;
};

export async function GET(request, { params }) {
  try {
    const { id } = await params;
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
      WHERE student_id = ${id}
    `;

    
    if (students.length === 0) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, student: students[0] });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { 
      admissionNo, name, class: className, section, rollNo,
      parentName, parentPhone, parentEmail,
      contact, email, guardianName, guardianPhone, status
    } = body;
    
    const validEmail = validateEmail(email);
    const validParentEmail = validateEmail(parentEmail);
    
    const result = await sql`
      UPDATE sss_student_master 
      SET 
        admission_no = ${admissionNo || null},
        name = ${name},
        class_name = ${className || null},
        section = ${section || null},
        roll_number = ${rollNo || null},
        parent_name = ${parentName || null},
        parent_phone = ${parentPhone || null},
        parent_email = ${validParentEmail},
        student_phone = ${contact || null},
        student_email = ${validEmail},
        guardian_name = ${guardianName || null},
        guardian_phone = ${guardianPhone || null}
      WHERE student_id = ${id}
      RETURNING student_id as id
    `;
    
    return NextResponse.json({ success: true, student: result[0] });
  } catch (error) {
    console.error('Student Update Error:', error);

    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;
    
    const isActive = status === 'active';
    
    const result = await sql`
      UPDATE sss_student_master 
      SET is_active = ${isActive}
      WHERE student_id = ${id}
      RETURNING student_id as id
    `;
    
    return NextResponse.json({ success: true, student: result[0] });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    
    await sql`
      UPDATE sss_student_master 
      SET is_active = false,
          record_status = 'D'
      WHERE student_id = ${id}
    `;
    
    return NextResponse.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}