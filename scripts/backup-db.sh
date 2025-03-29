#!/bin/bash

# Load environment variables
source .env.production

# Create backup directory if it doesn't exist
mkdir -p backups

# Generate timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Backup database
pg_dump -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB > "backups/backup_$TIMESTAMP.sql"

# Compress backup
gzip "backups/backup_$TIMESTAMP.sql"

# Keep only last 7 days of backups
find backups -name "backup_*.sql.gz" -mtime +7 -delete

echo "Database backup completed: backup_$TIMESTAMP.sql.gz" 