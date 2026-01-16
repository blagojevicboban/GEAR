#!/bin/bash
# scripts/deploy_full.sh

# Configuration
REMOTE_USER="root"
REMOTE_HOST="gear.tsp.edu.rs"
REMOTE_APP_DIR="/home/gear/public_html"
LOCAL_DB_USER="gear"
LOCAL_DB_PASS="Tsp-2024" # Should ideally be read from .env
LOCAL_DB_NAME="gear"
REMOTE_DB_USER="gear"
REMOTE_DB_PASS="Tsp-2024" # Assuming same dev password, verify if different!
REMOTE_DB_NAME="gear"

echo "=== STARTING FULL DEPLOYMENT ==="

# 1. Start by pushing local code to GitHub
echo "--- Syncing Code to GitHub ---"
git add .
git commit -m "Auto-deploy commit: $(date)" || echo "Nothing to commit"
git push origin main

# 2. Sync Uploaded Files (PDBs, Thumbnails)
echo "--- Syncing Uploaded Files ---"
# Using rsync to copy uploads folder. 
# -a: archive mode, -v: verbose, -z: compress
rsync -avz --progress ./server/uploads/ $REMOTE_USER@$REMOTE_HOST:$REMOTE_APP_DIR/server/uploads/

# 3. Database Sync (Structure & Data)
echo "--- Syncing Database ---"
DUMP_FILE="gear_sync.sql"
# Dump local DB
mysqldump -u $LOCAL_DB_USER -p"$LOCAL_DB_PASS" $LOCAL_DB_NAME > $DUMP_FILE

# Upload dump
scp $DUMP_FILE $REMOTE_USER@$REMOTE_HOST:/tmp/$DUMP_FILE

# Import on remote
ssh $REMOTE_USER@$REMOTE_HOST "mysql -u $REMOTE_DB_USER -p'$REMOTE_DB_PASS' $REMOTE_DB_NAME < /tmp/$DUMP_FILE"

# Clean up
rm $DUMP_FILE
ssh $REMOTE_USER@$REMOTE_HOST "rm /tmp/$DUMP_FILE"

# 4. Trigger Remote Build/Restart
echo "--- Triggering Remote Build ---"
# We execute the existing deploy logic on the server
ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_APP_DIR && git pull && npm install && npm run build && pm2 restart all"

echo "=== DEPLOYMENT COMPLETE ==="
