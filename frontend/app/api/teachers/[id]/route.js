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
    const teachers = await sql`
      SELECT 
        teacher_id as id,
        full_name as name,
        subject_name as subject,
        qualification as qualification,
        class_id as classId,
        section_1 as section1,
        section_2 as section2,
        role as role,
        phone as contact,
        email_id as email,
        CASE WHEN is_class_teacher = true THEN 'Y' ELSE '' END as "isClassTeacher",
        subjects as subjects,
        CASE WHEN is_active = true THEN 'active' ELSE 'inactive' END as status
      FROM sss_teacher_master
      FROM sss_teacher_master
      WHERE record_status IS NULL OR record_status = 'A'
      teacher_id = ${id}
    `;
    
    if (teachers.length === 0) {
      return NextResponse.json({ success: false, error: 'Teacher not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, teacher: teachers[0] });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { 
      name, subject, qualification, classId, section1, section2, 
      role, contact, email, isClassTeacher, subjects, status
    } = body;
    
    const isActive = status !== undefined ? status === 'active' : null;
    const validEmail = validateEmail(email);
    const isClassTeacherFlag = isClassTeacher === 'Y';
    const subjectsArray = subjects ? subjects.split(',').map(s => s.trim()) : [];
    
    const result = await sql`
      UPDATE sss_teacher_master 
      SET 
        full_name = ${name},
        subject_name = ${subject},
        qualification = ${qualification},
        class_id = ${classId || null},
        section_1 = ${section1},
        section_2 = ${section2},
        role = ${role || 'TEACHER'},
        phone = ${contact},
        email_id = ${validEmail},
        is_class_teacher = ${isClassTeacherFlag},
        subjects = ${subjectsArray},
        is_active = ${isActive}
      WHERE teacher_id = ${id}
      RETURNING teacher_id as id
    `;
    
    return NextResponse.json({ success: true, teacher: result[0] });
  } catch (error) {
    console.error('Teacher Update Error:', error);

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
      UPDATE sss_teacher_master 
      SET is_active = ${isActive}
      WHERE teacher_id = ${id}
      RETURNING teacher_id as id
    `;
    
    return NextResponse.json({ success: true, teacher: result[0] });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    
    await sql`
      UPDATE sss_teacher_master 
      SET
        is_active = false,
        record_status = 'D'
      WHERE teacher_id = ${id}
    `;
    
    return NextResponse.json({ success: true, message: 'Teacher deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
