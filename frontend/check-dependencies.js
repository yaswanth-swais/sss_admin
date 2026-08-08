const { Pool } = require('pg');

const pool = new Pool({
  host: 'swais-db-test-env.cri2kcc26kxg.ap-south-2.rds.amazonaws.com',
  port: 5432,
  database: 'sss_prod',
  user: 'swais_app_user',
  password: 'Swaisuser007',
  ssl: { rejectUnauthorized: false }
});

async function checkDependencies() {
  try {
    console.log('🔍 Checking dependencies on sss_teacher_master...\n');
    
    // Check foreign key constraints
    const fkResult = await pool.query(`
      SELECT 
        conname as constraint_name,
        conrelid::regclass as table_name,
        a.attname as column_name
      FROM pg_constraint 
      JOIN pg_class ON conrelid = pg_class.oid 
      JOIN pg_attribute a ON a.attrelid = conrelid AND a.attnum = ANY(conkey)
      WHERE confrelid = 'sss_teacher_master'::regclass
      AND contype = 'f'
    `);
    
    if (fkResult.rows.length > 0) {
      console.log('📋 Tables that reference sss_teacher_master:');
      fkResult.rows.forEach(row => {
        console.log(`  - ${row.table_name}.${row.column_name} (constraint: ${row.constraint_name})`);
      });
    } else {
      console.log('✅ No foreign key dependencies found');
    }
    
    // Check if there are any views or other objects
    const viewResult = await pool.query(`
      SELECT 
        dependent_ns.nspname as schema,
        dependent_view.relname as view_name,
        source_ns.nspname as source_schema,
        source_table.relname as source_table
      FROM pg_depend 
      JOIN pg_rewrite ON pg_depend.objid = pg_rewrite.oid 
      JOIN pg_class as dependent_view ON pg_rewrite.ev_class = dependent_view.oid 
      JOIN pg_class as source_table ON pg_depend.refobjid = source_table.oid 
      JOIN pg_namespace dependent_ns ON dependent_view.relnamespace = dependent_ns.oid 
      JOIN pg_namespace source_ns ON source_table.relnamespace = source_ns.oid 
      WHERE source_table.relname = 'sss_teacher_master'
      AND pg_depend.deptype = 'n'
    `);
    
    if (viewResult.rows.length > 0) {
      console.log('\n📋 Views that depend on sss_teacher_master:');
      viewResult.rows.forEach(row => {
        console.log(`  - ${row.view_name}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkDependencies();
