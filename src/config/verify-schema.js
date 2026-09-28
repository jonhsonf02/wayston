const { connectAll, getPgPool } = require('./db');

async function verifySchema() {
  await connectAll();
  const pool = getPgPool();

  const result = await pool.query(`
    SELECT table_name, column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name IN ('users', 'audit_log')
    ORDER BY table_name, ordinal_position;
  `);

  console.log('📋 Column verification:\n');
  let currentTable = '';
  for (const row of result.rows) {
    if (row.table_name !== currentTable) {
      currentTable = row.table_name;
      console.log(`\n-- ${currentTable} --`);
    }
    console.log(`  ${row.column_name}: ${row.data_type} | nullable: ${row.is_nullable} | default: ${row.column_default || 'none'}`);
  }

  process.exit(0);
}

verifySchema().catch((err) => {
  console.error('❌ Verification failed:', err.message);
  process.exit(1);
});