const { Pool } = require('pg');

const pool = new Pool({
  host: 'swais-db-hyd.cri2kcc26kxg.ap-south-2.rds.amazonaws.com',
  port: 5432,
  database: 'postgres',  // or the specific database name
  user: 'swais_app_user',
  password: 'Swaisuser007',
  ssl: {
    rejectUnauthorized: false  // Required for AWS RDS
  }
});

async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully!');
    console.log('Server time:', result.rows[0].now);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
  process.exit();
}

testConnection();
