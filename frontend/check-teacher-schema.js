const { Pool } = require('pg');

const pool = new Pool({
  host: 'swais-db-test-env.cri2kcc26kxg.ap-south-2.rds.amazonaws.com',
  port: 5432,
  database: 'sss_prod',
  user: 'swais_app_user',
  password: 'Swaisuser007',
  ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
  try {
    console.log('🔍 Checking sss_teacher_master schema...\n');
    
    const result = await pool.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'sss_teacher_master'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Column Schema:');
    console.log('----------------------------------------');
    result.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'required'})`);
    });
    console.log('----------------------------------------');
    
    // Check if there's a separate column for teacher ID
    const hasTeacherId = result.rows.some(r => r.column_name === 'teacher_id');
    const hasId = result.rows.some(r => r.column_name === 'id');
    
    console.log(`\n📊 Has 'teacher_id' column: ${hasTeacherId}`);
    console.log(`📊 Has 'id' column: ${hasId}`);
    
    // Check sample data
    const sample = await pool.query('SELECT * FROM sss_teacher_master LIMIT 3');
    if (sample.rows.length > 0) {
      console.log('\n📝 Sample data:');
      sample.rows.forEach((row, i) => {
        console.log(`  ${i+1}. ${JSON.stringify(row)}`);
      });
    } else {
      console.log('\n⚠️ No data in teacher table');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkSchema();
