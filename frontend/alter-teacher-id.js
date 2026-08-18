const { Pool } = require('pg');

const pool = new Pool({
  host: 'swais-db-test-env.cri2kcc26kxg.ap-south-2.rds.amazonaws.com',
  port: 5432,
  database: 'sss_prod',
  user: 'swais_app_user',
  password: 'Swaisuser007',
  ssl: { rejectUnauthorized: false }
});

async function alterColumn() {
  try {
    console.log('🔧 Changing teacher_id column type...');
    
    // Step 1: Check current column type
    const typeCheck = await pool.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'sss_teacher_master' 
      AND column_name = 'teacher_id'
    `);
    
    console.log(`📋 Current column type: ${typeCheck.rows[0].data_type}`);
    
    // Step 2: Check if there are any constraints on the column
    const constraints = await pool.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'sss_teacher_master'
      AND constraint_type = 'PRIMARY KEY'
    `);
    
    if (constraints.rows.length > 0) {
      console.log('⚠️ This column is a PRIMARY KEY. We need to handle it carefully.');
      
      // Drop the primary key constraint temporarily
      await pool.query(`
        ALTER TABLE sss_teacher_master 
        DROP CONSTRAINT ${constraints.rows[0].constraint_name}
      `);
      console.log('✅ Dropped primary key constraint');
    }
    
    // Step 3: Alter the column type
    await pool.query(`
      ALTER TABLE sss_teacher_master 
      ALTER COLUMN teacher_id TYPE VARCHAR(50) 
      USING teacher_id::VARCHAR
    `);
    console.log('✅ Changed column type to VARCHAR(50)');
    
    // Step 4: Update existing IDs to T format
    await pool.query(`
      UPDATE sss_teacher_master 
      SET teacher_id = CONCAT('T', LPAD(teacher_id::text, 3, '0'))
      WHERE teacher_id::text ~ '^[0-9]+$'
    `);
    console.log('✅ Updated existing teacher IDs to T format');
    
    // Step 5: Add primary key back if it was dropped
    if (constraints.rows.length > 0) {
      await pool.query(`
        ALTER TABLE sss_teacher_master 
        ADD PRIMARY KEY (teacher_id)
      `);
      console.log('✅ Restored primary key constraint');
    }
    
    // Step 6: Verify the changes
    const verify = await pool.query(`
      SELECT teacher_id, full_name 
      FROM sss_teacher_master 
      LIMIT 5
    `);
    
    console.log('\n📝 Updated records:');
    verify.rows.forEach((row, i) => {
      console.log(`  ${i+1}. ${row.teacher_id}: ${row.full_name}`);
    });
    
    console.log('\n✅ Column type changed successfully!');
    console.log('💡 You can now use Teacher IDs like T001, H001, etc.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

alterColumn();
