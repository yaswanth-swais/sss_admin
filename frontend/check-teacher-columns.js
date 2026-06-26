const { Pool } = require('pg');

const pool = new Pool({
  host: 'swais-db-hyd.cri2kcc26kxg.ap-south-2.rds.amazonaws.com',
  port: 5432,
  database: 'sss_prod',
  user: 'swais_app_user',
  password: 'Swaisuser007',
  ssl: { rejectUnauthorized: false }
});

async function checkColumns() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'sss_teacher_master'
      ORDER BY ordinal_position
    `);
    
    console.log('Columns in sss_teacher_master:');
    result.rows.forEach(row => {
      console.log('  - ' + row.column_name + ' (' + row.data_type + ')');
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  process.exit();
}

checkColumns();
