#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR/../backups"
ENV_FILE="$SCRIPT_DIR/../.env"
LOG="$BACKUP_DIR/backup.log"

mkdir -p "$BACKUP_DIR"

# Extract DB URL from .env (DB_DEV_URL takes priority, fall back to DATABASE_URL)
DB_URL=""
if [ -f "$ENV_FILE" ]; then
  DB_URL=$(grep "^DB_DEV_URL=" "$ENV_FILE" | cut -d'=' -f2-)
  if [ -z "$DB_URL" ]; then
    DB_URL=$(grep "^DATABASE_URL=" "$ENV_FILE" | cut -d'=' -f2-)
  fi
fi

if [ -z "$DB_URL" ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: No DB_DEV_URL or DATABASE_URL found in .env" >> "$LOG"
  exit 1
fi

TIMESTAMP=$(date +%Y-%m-%d_%H-%M)
FILENAME="save_backup_${TIMESTAMP}.sql.gz"
FILEPATH="$BACKUP_DIR/$FILENAME"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting backup → $FILENAME" >> "$LOG"

if pg_dump "$DB_URL" | gzip > "$FILEPATH"; then
  SIZE=$(du -sh "$FILEPATH" 2>/dev/null | cut -f1)
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $FILENAME ($SIZE)" >> "$LOG"
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] FAILED: pg_dump exited non-zero" >> "$LOG"
  exit 1
fi

# Remove backups older than 7 days
DELETED=$(find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -print -delete | wc -l)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Cleanup: removed $DELETED file(s) older than 7 days" >> "$LOG"
