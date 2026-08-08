const { Pool } = require('pg');

const pool = new Pool({
  host: 'swais-db-test-env.cri2kcc26kxg.ap-south-2.rds.amazonaws.com',
  port: 5432,
  database: 'sss_prod',
  user: 'swais_app_user',
  password: 'Swaisuser007',
  ssl: { rejectUnauthorized: false }
});

async function backupData() {
  try {
    console.log('📋 Backing up teacher data...');
    
    // Check if there's data
    const count = await pool.query('SELECT COUNT(*) FROM sss_teacher_master');
    console.log(`📊 Found ${count.rows[0].count} records`);
    
    if (parseInt(count.rows[0].count) > 0) {
      const data = await pool.query('SELECT * FROM sss_teacher_master');
      console.log('\n📝 Sample data (first 3 rows):');
      data.rows.slice(0, 3).forEach((row, i) => {
        console.log(`  ${i+1}. teacher_id: ${row.teacher_id}, full_name: ${row.full_name}`);
      });
      
      // Create a backup table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS sss_teacher_master_backup AS 
        SELECT * FROM sss_teacher_master
      `);
      console.log('✅ Backup table created: sss_teacher_master_backup');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

backupData();
