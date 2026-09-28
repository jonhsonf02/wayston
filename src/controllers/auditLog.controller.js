const { getPgPool } = require('../config/db');

// GET /admin/audit-log — superadmin only, per your spec's accountability layer
async function listAuditLog(req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;

  const pool = getPgPool();

  const result = await pool.query(
    `SELECT al.id, al.action, al.target_type, al.target_id, al.details, al.created_at,
            u.full_name AS actor_name, u.email AS actor_email
     FROM audit_log al
     LEFT JOIN users u ON u.id = al.actor_user_id
     ORDER BY al.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  const countResult = await pool.query('SELECT COUNT(*) FROM audit_log');
  const total = parseInt(countResult.rows[0].count);

  res.json({ entries: result.rows, total, page, pages: Math.ceil(total / limit) });
}

module.exports = { listAuditLog };