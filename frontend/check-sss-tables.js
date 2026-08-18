const { Pool } = require('pg');

const pool = new Pool({
  host: 'swais-db-test-env.cri2kcc26kxg.ap-south-2.rds.amazonaws.com',
  port: 5432,
  database: 'sss_prod',
  user: 'swais_app_user',
  password: 'Swaisuser007',
  ssl: { rejectUnauthorized: false }
});

async function checkTables() {
  try {
    console.log('🔍 Checking tables in sss_prod database...\n');
    
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 Available tables:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check for student tables specifically
    const studentTables = result.rows.filter(r => 
      r.table_name.includes('student') || 
      r.table_name.includes('teacher') ||
      r.table_name.includes('class')
    );
    
    console.log('\n📚 Education-related tables:');
    studentTables.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkTables();
