-- Users (admin/staff) — Postgres because auth needs ACID guarantees
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin', 'support')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Immutable audit log — append-only, no updates/deletes expected
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,               -- e.g. 'event.create', 'event.edit', 'event.delete', 'shipment.create'
  target_type TEXT NOT NULL,          -- e.g. 'TrackingEvent', 'Shipment'
  target_id TEXT NOT NULL,            -- the Mongo ObjectId as a string (cross-DB reference)
  details JSONB,                      -- flexible: old/new values, notes, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_target ON audit_log (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log (actor_user_id);