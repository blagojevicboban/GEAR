#!/bin/bash

# Navigate to project root
cd /home/gear/public_html

echo "Starting deployment at $(date)"

# Discard local changes (safety first for production)
git reset --hard HEAD

# Pull latest code
git pull origin main

# Install dependencies (if package.json changed)
npm install

# Build the frontend
npm run build

# Restart the backend service
# Use --update-env to pick up potential .env changes
pm2 restart gear-backend --update-env || pm2 start server/index.js --name gear-backend

echo "Deployment finished at $(date)"

# Restart webhook if it exists
pm2 restart gear-webhook --update-env || pm2 start deployment/webhook.js --name gear-webhook || echo "Webhook skip"
