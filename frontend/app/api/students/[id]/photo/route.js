import { NextResponse } from 'next/server';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import postgres from 'postgres';

const sql = postgres({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false,
  },
});

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// =====================================================
// Photo type configuration
// =====================================================

const PHOTO_CONFIG = {
  student: {
    dbColumn: 'student_photo_key',
    s3Folder: 'students',
    responseKey: 'studentPhotoKey',
  },

  parent1: {
    dbColumn: 'parent1_photo_key',
    s3Folder: 'parents',
    responseKey: 'parent1PhotoKey',
  },

  parent2: {
    dbColumn: 'parent2_photo_key',
    s3Folder: 'parents',
    responseKey: 'parent2PhotoKey',
  },

  guardian: {
    dbColumn: 'guardian_photo_key',
    s3Folder: 'guardians',
    responseKey: 'guardianPhotoKey',
  },
};

// =====================================================
// Helper - Get photo configuration
// =====================================================

function getPhotoConfig(photoType) {
  return PHOTO_CONFIG[photoType] || null;
}

// =====================================================
// GET - Fetch photo URL
//
// Supported:
// student
// parent1
// parent2
// guardian
//
// If photoType is omitted, defaults to student.
// This preserves the existing student-photo behavior.
// =====================================================

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const { searchParams } = new URL(request.url);

    // Existing student behavior is preserved
    const photoType = searchParams.get('photoType') || 'student';

    const config = getPhotoConfig(photoType);

    if (!config) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid photoType. Allowed values: student, parent1, parent2, guardian',
        },
        { status: 400 }
      );
    }

    console.log(
      `🔍 Fetching ${photoType} photo for admission number:`,
      id
    );

    // -------------------------------------------------
    // Get photo key from database
    // -------------------------------------------------

    // The column names come only from our fixed PHOTO_CONFIG
    // and are NOT taken directly from user input.
    const query = `
      SELECT ${config.dbColumn}
      FROM sss_student_master
      WHERE admission_no = $1
        AND record_status = 'Active'
      LIMIT 1
    `;

    const result = await sql.unsafe(query, [id]);

    if (result.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Student not found',
        },
        { status: 404 }
      );
    }

    const photoKey = result[0][config.dbColumn];

    // -------------------------------------------------
    // No photo uploaded
    // -------------------------------------------------

    if (!photoKey) {
      return NextResponse.json({
        success: true,
        photoUrl: null,
        photoType,
        message: `No ${photoType} photo available`,
      });
    }

    console.log(
      `🖼️ ${photoType} S3 photo key:`,
      photoKey
    );

    // -------------------------------------------------
    // Generate temporary signed URL
    // -------------------------------------------------

    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: photoKey,
    });

    const photoUrl = await getSignedUrl(s3, command, {
      expiresIn: 3600,
    });

    console.log(
      `✅ Signed ${photoType} photo URL generated`
    );

    return NextResponse.json({
      success: true,
      photoType,
      photoUrl,
      [config.responseKey]: photoKey,
    });

  } catch (error) {
    console.error('❌ Photo GET Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch photo',
      },
      { status: 500 }
    );
  }
}

// =====================================================
// POST - Upload photo
//
// Supported:
// student
// parent1
// parent2
// guardian
//
// Existing student upload behavior is preserved when
// photoType is omitted.
// =====================================================

export async function POST(request, { params }) {
  try {
    const { id } = await params;

    const formData = await request.formData();

    const file = formData.get('file');

    // Existing behavior:
    // If photoType is not supplied, treat it as student.
    const photoType =
      formData.get('photoType')?.toString() || 'student';

    const admissionNo =
      formData.get('admission_no')?.toString() || id;

    // -------------------------------------------------
    // Validate photo type
    // -------------------------------------------------

    const config = getPhotoConfig(photoType);

    if (!config) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid photoType. Allowed values: student, parent1, parent2, guardian',
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------
    // Validate file
    // -------------------------------------------------

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'No photo file selected',
        },
        { status: 400 }
      );
    }

    if (!admissionNo) {
      return NextResponse.json(
        {
          success: false,
          error: 'Admission number is required',
        },
        { status: 400 }
      );
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Only image files are allowed',
        },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          error: 'Photo size must be less than 5 MB',
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------
    // Convert file to buffer
    // -------------------------------------------------

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const extension =
      file.name.split('.').pop()?.toLowerCase() || 'jpg';

    // -------------------------------------------------
    // Create S3 file name
    // -------------------------------------------------

    const fileName =
      `${config.s3Folder}/${admissionNo}-${photoType}-${Date.now()}.${extension}`;

    console.log(
      `📤 Uploading ${photoType} photo to S3:`,
      fileName
    );

    // -------------------------------------------------
    // Upload to S3
    // -------------------------------------------------

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    });

    await s3.send(command);

    console.log(
      `✅ ${photoType} photo uploaded to S3:`,
      fileName
    );

    // -------------------------------------------------
    // Save S3 key in database
    // -------------------------------------------------

    const updateQuery = `
      UPDATE sss_student_master
      SET ${config.dbColumn} = $1
      WHERE admission_no = $2
        AND record_status = 'Active'
      RETURNING
        student_id AS id,
        admission_no,
        ${config.dbColumn}
    `;

    const result = await sql.unsafe(updateQuery, [
      fileName,
      id,
    ]);

    if (result.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Student not found',
        },
        { status: 404 }
      );
    }

    const savedPhotoKey =
      result[0][config.dbColumn];

    console.log(
      `✅ ${photoType} S3 key saved in DB:`,
      savedPhotoKey
    );

    return NextResponse.json({
      success: true,
      message: `${photoType} photo uploaded and saved successfully`,
      photoType,
      admissionNo: result[0].admission_no,
      [config.responseKey]: savedPhotoKey,
    });

  } catch (error) {
    console.error(
      '❌ S3 Upload / DB Error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message || 'Failed to upload photo',
      },
      { status: 500 }
    );
  }
}