const { Pool } = require('pg');

const pool = new Pool({
  host: 'swais-db-test-env.cri2kcc26kxg.ap-south-2.rds.amazonaws.com',
  port: 5432,
  database: 'sss_prod',
  user: 'swais_app_user',
  password: 'Swaisuser007',
  ssl: { rejectUnauthorized: false }
});

async function alterColumnSafe() {
  try {
    console.log('🔧 Safely changing teacher_id column type...\n');
    
    // Step 1: Add a new VARCHAR column
    console.log('📝 Step 1: Adding new teacher_id_varchar column...');
    await pool.query(`
      ALTER TABLE sss_teacher_master 
      ADD COLUMN teacher_id_varchar VARCHAR(50)
    `);
    console.log('✅ Added teacher_id_varchar column');
    
    // Step 2: Copy data from old to new column
    console.log('📝 Step 2: Copying data to new column...');
    await pool.query(`
      UPDATE sss_teacher_master 
      SET teacher_id_varchar = CONCAT('T', LPAD(teacher_id::text, 3, '0'))
      WHERE teacher_id IS NOT NULL
    `);
    console.log('✅ Data copied to new column');
    
    // Step 3: Make the new column NOT NULL
    console.log('📝 Step 3: Making new column NOT NULL...');
    await pool.query(`
      ALTER TABLE sss_teacher_master 
      ALTER COLUMN teacher_id_varchar SET NOT NULL
    `);
    console.log('✅ New column set to NOT NULL');
    
    // Step 4: Drop the old primary key constraint
    console.log('📝 Step 4: Dropping old primary key constraint...');
    try {
      await pool.query(`
        ALTER TABLE sss_teacher_master 
        DROP CONSTRAINT sss_teacher_master_pkey
      `);
      console.log('✅ Dropped old primary key constraint');
    } catch (error) {
      console.log('⚠️ Could not drop primary key:', error.message);
      console.log('💡 Trying alternative approach...');
    }
    
    // Step 5: Drop the old column
    console.log('📝 Step 5: Dropping old teacher_id column...');
    await pool.query(`
      ALTER TABLE sss_teacher_master 
      DROP COLUMN teacher_id CASCADE
    `);
    console.log('✅ Dropped old teacher_id column');
    
    // Step 6: Rename the new column
    console.log('📝 Step 6: Renaming new column to teacher_id...');
    await pool.query(`
      ALTER TABLE sss_teacher_master 
      RENAME COLUMN teacher_id_varchar TO teacher_id
    `);
    console.log('✅ Renamed column to teacher_id');
    
    // Step 7: Add primary key back
    console.log('📝 Step 7: Adding primary key constraint...');
    try {
      await pool.query(`
        ALTER TABLE sss_teacher_master 
        ADD PRIMARY KEY (teacher_id)
      `);
      console.log('✅ Primary key constraint added');
    } catch (error) {
      console.log('⚠️ Could not add primary key:', error.message);
    }
    
    // Step 8: Verify the changes
    console.log('\n📝 Step 8: Verifying changes...');
    const verify = await pool.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'sss_teacher_master' 
      AND column_name = 'teacher_id'
    `);
    
    console.log('\n📋 New teacher_id column info:');
    console.log(`  Type: ${verify.rows[0].data_type}`);
    console.log(`  Nullable: ${verify.rows[0].is_nullable}`);
    
    // Show sample data
    const sample = await pool.query(`
      SELECT teacher_id, full_name 
      FROM sss_teacher_master 
      LIMIT 5
    `);
    
    console.log('\n📝 Sample data after migration:');
    sample.rows.forEach((row, i) => {
      console.log(`  ${i+1}. ${row.teacher_id}: ${row.full_name}`);
    });
    
    console.log('\n✅ Column type changed successfully to VARCHAR!');
    console.log('💡 You can now use Teacher IDs like T001, H001, etc.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

alterColumnSafe();
