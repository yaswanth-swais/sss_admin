import { NextResponse } from 'next/server';
import postgres from 'postgres';

export const dynamic = 'force-dynamic';

const sql = postgres(process.env.DATABASE_URL, { 
  ssl: 'require'
});

export async function GET(request) {
  try {
    const notices = await sql`
      SELECT 
        notice_id as id,
        notice_title as title,
        notice_text as description,
        applicable_class as targetAudience,
        notice_date as noticeDate,
        created_datetime as createdAt,
        CASE WHEN record_status = 'Active' THEN 'active' ELSE 'inactive' END as status
      FROM sss_notice_board
      WHERE record_status = 'Active' OR record_status IS NULL
      ORDER BY notice_id DESC
      LIMIT 100
    `;
    
    return NextResponse.json({ success: true, notices: notices });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { title, description, targetAudience, noticeDate, status } = body;
    
    const isActive = status === 'active';
    const currentDate = noticeDate || new Date().toISOString().split('T')[0];
    
    const result = await sql`
      INSERT INTO sss_notice_board (
        notice_title,
        notice_text,
        applicable_class,
        notice_date,
        created_datetime,
        record_status
      )
      VALUES (
        ${title}, 
        ${description || null},
        ${targetAudience || null},
        ${currentDate},
        NOW(),
        'Active'
      )
      RETURNING notice_id as id
    `;
    
    return NextResponse.json({ success: true, message: 'Notice added successfully', notice: result[0] });
  } catch (error) {
    console.error('Error inserting notice:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
