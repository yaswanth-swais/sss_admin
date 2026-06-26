import { NextResponse } from 'next/server';
import postgres from 'postgres';

export const dynamic = 'force-dynamic';

const sql = postgres(process.env.DATABASE_URL, { 
  ssl: 'require'
});

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
      WHERE record_status IS NULL OR record_status = 'A'
      ORDER BY teacher_id DESC
      LIMIT 100
    `;
    
    return NextResponse.json({ success: true, teachers: teachers });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      name, subject, qualification, classId, section1, section2, 
      role, contact, email, isClassTeacher,subjects, status
    } = body;
    
    const isActive = status === 'inactive' ? false : true;
    const validEmail = validateEmail(email);
    const isClassTeacherFlag = isClassTeacher === 'Yes';
    const subjectsArray = subjects ? subjects.split(',').map(s => s.trim()) : [];
    
    const result = await sql`
      INSERT INTO sss_teacher_master (
        full_name,
        subject_name,
        qualification,
        class_id,
        section_1,
        section_2,
        role,
        phone,
        email_id,
        is_class_teacher,
        subjects,
        is_active,
        record_status
        created_at
      )
      VALUES (
        ${name}, 
        ${subject || null},
        ${qualification || null},
        ${classId || null},
        ${section1 || null},
        ${section2 || null},
        ${role || 'TEACHER'},
        ${contact || null}, 
        ${validEmail},
        ${isClassTeacherFlag},
        ${subjectsArray},
        ${isActive},
        'A'
        NOW()
      )
      RETURNING teacher_id as id
    `;
    
    return NextResponse.json({ success: true, message: 'Teacher added successfully', teacher: result[0] });
  } catch (error) {
    console.error('Error inserting teacher:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
