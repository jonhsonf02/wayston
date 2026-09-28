const bcrypt = require('bcrypt');
const { connectAll, getPgPool } = require('./db');

async function createMyAdmin() {
  await connectAll();
  const pool = getPgPool();

  // ⬇️ EDIT THESE THREE LINES WITH YOUR REAL INFO BEFORE RUNNING ⬇️
  const fullName = 'Owoseni Oluwasesan Motunrayo';
  const email = 'gtina9601@gmail.com';       // ← your real email
  const plainPassword = 'Motunrayo23!';  // ← a password you will remember
  // ⬆️ EDIT ABOVE ⬆️

  const passwordHash = await bcrypt.hash(plainPassword, 10);

  const result = await pool.query(
    `INSERT INTO users (full_name, email, password_hash, role)
     VALUES ($1, $2, $3, 'superadmin')
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
     RETURNING id, email, role`,
    [fullName, email, passwordHash]
  );

  console.log(`✅ Superadmin ready: ${result.rows[0].email} (role: ${result.rows[0].role})`);
  process.exit(0);
}

createMyAdmin().catch((err) => {
  console.error('❌ Failed to create admin:', err.message);
  process.exit(1);
});