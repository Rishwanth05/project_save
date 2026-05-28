-- Change 6: Add comments column to account_deletions for optional farewell feedback
ALTER TABLE account_deletions ADD COLUMN IF NOT EXISTS comments TEXT;
