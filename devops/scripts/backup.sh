#!/bin/bash
# scripts/backup.sh — Daily database backups
set -e
APP_DIR=/opt/najah
BACKUP_DIR=$APP_DIR/backups
TS=$(date +%Y%m%d_%H%M%S)
KEEP_DAYS=30

mkdir -p $BACKUP_DIR
cd $APP_DIR
source .env.production

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"; }

log "📦 Backing up PostgreSQL..."
docker compose exec -T postgres pg_dump \
  -U "${DB_USER:-postgres}" -d "${DB_NAME:-najah_db}" -F c \
  > $BACKUP_DIR/pg_${TS}.dump
log "✅ PostgreSQL: pg_${TS}.dump"

log "📦 Backing up MongoDB..."
docker compose exec -T mongo mongodump \
  --username "${MONGO_USER:-admin}" --password "$MONGO_PASSWORD" \
  --authenticationDatabase admin --db najah_chat \
  --archive --gzip > $BACKUP_DIR/mongo_${TS}.gz
log "✅ MongoDB: mongo_${TS}.gz"

log "🗜️  Compressing..."
tar -czf $BACKUP_DIR/najah_backup_${TS}.tar.gz \
  -C $BACKUP_DIR pg_${TS}.dump mongo_${TS}.gz
rm -f $BACKUP_DIR/pg_${TS}.dump $BACKUP_DIR/mongo_${TS}.gz

SIZE=$(du -sh $BACKUP_DIR/najah_backup_${TS}.tar.gz | cut -f1)
log "✅ Archive: najah_backup_${TS}.tar.gz ($SIZE)"

log "🧹 Pruning backups older than ${KEEP_DAYS} days..."
find $BACKUP_DIR -name "najah_backup_*.tar.gz" -mtime +${KEEP_DAYS} -delete

COUNT=$(ls $BACKUP_DIR/najah_backup_*.tar.gz 2>/dev/null | wc -l)
log "📊 Total backups on disk: ${COUNT}"
log "🎉 Backup complete!"
