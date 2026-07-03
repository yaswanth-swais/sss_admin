import { NextResponse } from 'next/server';
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, {
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function GET() {
  try {
    const notices = await sql`
      SELECT 
        notice_id as id,
        notice_title as title,
        notice_text as message,
        applicable_class as role,
        notice_date as date,
        record_status as status,
        is_read
      FROM sss_notice_board
      WHERE record_status = 'Active'
      ORDER BY notice_date DESC
    `;
    return NextResponse.json(notices);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { title, message, role, date } = body;
    
    const notice = await sql`
      INSERT INTO sss_notice_board (
        notice_title,
        notice_text,
        applicable_class,
        notice_date,
        record_status,
        is_read
      )

      VALUES (
        ${title},
        ${message},
        ${role || "all"},
        ${date || new Date().toISOString().split("T")[0]},
        'Active',
        true
      )

      RETURNING *
      `;

    return NextResponse.json(notice[0], {
    status:201
    });
  } catch (error) {
    console.error('Error adding notice:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, title, message, role, date } = body;
    
    const updated = await sql`
    UPDATE sss_notice_board

    SET

    notice_title=${title},
    notice_text=${message},
    applicable_class=${role},
    notice_date=${date}

    WHERE notice_id=${id}

    RETURNING *
    `;

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating notice:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    await sql
      `UPDATE sss_notice_board SET record_status = 'Deleted' WHERE notice_id = ${id}`;
    
    return NextResponse.json({ message: 'Notice deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}