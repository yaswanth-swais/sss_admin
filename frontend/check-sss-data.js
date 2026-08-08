const { Pool } = require('pg');

const pool = new Pool({
  host: 'swais-db-test-env.cri2kcc26kxg.ap-south-2.rds.amazonaws.com',
  port: 5432,
  database: 'sss_prod',
  user: 'swais_app_user',
  password: 'Swaisuser007',
  ssl: { rejectUnauthorized: false }
});

async function checkData() {
  try {
    console.log('🔍 Checking data in SSS tables...\n');
    
    // Check students
    const students = await pool.query('SELECT COUNT(*) FROM sss_student_master');
    console.log(`📊 Students: ${students.rows[0].count} records`);
    
    // Check teachers
    const teachers = await pool.query('SELECT COUNT(*) FROM sss_teacher_master');
    console.log(`📊 Teachers: ${teachers.rows[0].count} records`);
    
    // Check notices
    const notices = await pool.query('SELECT COUNT(*) FROM sss_notice_board');
    console.log(`📊 Notices: ${notices.rows[0].count} records`);
    
    // Get sample students
    if (parseInt(students.rows[0].count) > 0) {
      const sampleStudents = await pool.query('SELECT * FROM sss_student_master LIMIT 3');
      console.log('\n📝 Sample Students:');
      sampleStudents.rows.forEach(row => {
        console.log(`  - ${row.admission_no || row.student_id}: ${row.name || row.full_name}`);
      });
    } else {
      console.log('\n⚠️ No students found. Inserting sample data...');
      
      // Insert sample student
      await pool.query(`
        INSERT INTO sss_student_master (admission_no, name, class_name, section, roll_number, record_status) 
        VALUES ('S001', 'Sample Student', '1', 'A', '01', 'Active')
        ON CONFLICT (admission_no) DO NOTHING
      `);
      console.log('✅ Added sample student');
    }
    
    if (parseInt(teachers.rows[0].count) > 0) {
      const sampleTeachers = await pool.query('SELECT * FROM sss_teacher_master LIMIT 3');
      console.log('\n📝 Sample Teachers:');
      sampleTeachers.rows.forEach(row => {
        console.log(`  - ${row.teacher_id}: ${row.full_name || row.first_name + ' ' + row.last_name}`);
      });
    } else {
      console.log('\n⚠️ No teachers found. Inserting sample data...');
      
      // Insert sample teacher
      await pool.query(`
        INSERT INTO sss_teacher_master (teacher_id, full_name, subject_name, email_id, is_active) 
        VALUES ('T001', 'Sample Teacher', 'Mathematics', 'teacher@sss.com', true)
        ON CONFLICT (teacher_id) DO NOTHING
      `);
      console.log('✅ Added sample teacher');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkData();
