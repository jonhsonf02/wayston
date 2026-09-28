const fs = require('fs');
const path = require('path');
const { connectAll, getPgPool } = require('./db');

async function runMigration() {
  await connectAll();
  const pool = getPgPool();

  const sqlPath = path.join(__dirname, 'migrations', '001_init.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('▶️  Running migration: 001_init.sql');
  await pool.query(sql);
  console.log('✅ Migration complete: users, audit_log tables ready');

  process.exit(0);
}

runMigration().catch((err) => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});