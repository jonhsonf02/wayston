const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getPgPool } = require('../config/db');
const env = require('../config/env');

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

function signAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    { id: user.id },
    env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const pool = getPgPool();
  const result = await pool.query(
    'SELECT id, full_name, email, password_hash, role, is_active FROM users WHERE email = $1',
    [email]
  );

  const user = result.rows[0];
  if (!user || !user.is_active) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  await pool.query('UPDATE users SET last_login = now() WHERE id = $1', [user.id]);

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  res.json({
    accessToken,
    refreshToken,
    user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role },
  });
}

async function refresh(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'refreshToken is required' });
  }

  let payload;
  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }

  const pool = getPgPool();
  const result = await pool.query(
    'SELECT id, email, role, is_active FROM users WHERE id = $1',
    [payload.id]
  );

  const user = result.rows[0];
  if (!user || !user.is_active) {
    return res.status(401).json({ error: 'User not found or inactive' });
  }

  const accessToken = signAccessToken(user);
  res.json({ accessToken });
}

async function logout(req, res) {
  // Stateless JWT — logout is handled client-side by discarding tokens.
  // If you later add Redis, this is where refresh tokens would be blacklisted.
  res.json({ message: 'Logged out' });
}

module.exports = { login, refresh, logout };