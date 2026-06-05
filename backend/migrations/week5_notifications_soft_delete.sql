-- NOTIF1/NOTIF2 — soft-delete support for notifications
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
