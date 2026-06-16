CREATE TABLE IF NOT EXISTS resolution_votes (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_id   INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  vote        VARCHAR(10) NOT NULL CHECK (vote IN ('confirmed', 'disputed')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, report_id)
);
