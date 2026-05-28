-- Change 1: Admin audit log table (append-only — no UPDATE or DELETE)
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id           SERIAL PRIMARY KEY,
  admin_id     INTEGER NOT NULL,
  admin_email  TEXT NOT NULL,
  action       TEXT NOT NULL,
  target_type  TEXT NOT NULL,
  target_id    TEXT,
  old_value    JSONB,
  new_value    JSONB,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin_id   ON admin_audit_log (admin_id);
