const { getPgPool } = require('../config/db');

async function logAction({ actorUserId, action, targetType, targetId, details = null }) {
  const pool = getPgPool();
  await pool.query(
    `INSERT INTO audit_log (actor_user_id, action, target_type, target_id, details)
     VALUES ($1, $2, $3, $4, $5)`,
    [actorUserId, action, targetType, targetId, details ? JSON.stringify(details) : null]
  );
}

module.exports = { logAction };