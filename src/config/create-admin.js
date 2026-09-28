const bcrypt = require('bcrypt');
const { connectAll, getPgPool } = require('./db');

async function createAdmin() {
  await connectAll();
  const pool = getPgPool();

  const fullName = 'Owoseni Oluwasesan';
  const email = 'admin@waystone.local'; // change this if you want
  const plainPassword = 'ChangeMe123!'; // change this — you'll use it to log in, then can change later

  const passwordHash = await bcrypt.hash(plainPassword, 10);

  await pool.query(
    `INSERT INTO users (full_name, email, password_hash, role)
     VALUES ($1, $2, $3, 'superadmin')
     ON CONFLICT (email) DO NOTHING`,
    [fullName, email, passwordHash]
  );

  console.log(`✅ Superadmin ready: ${email} / ${plainPassword}`);
  process.exit(0);
}

createAdmin().catch((err) => {
  console.error('❌ Failed to create admin:', err.message);
  process.exit(1);
});