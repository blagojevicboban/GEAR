#!/bin/bash

# Navigate to project root (Virtualmin user home)
cd /home/gear/app

echo "Starting deployment at $(date)"

# Discard local changes (safety first for production)
git reset --hard HEAD

# Pull latest code
git pull origin main

# Install dependencies (if package.json changed)
npm install

# Build the frontend
npm run build

# Restart the backend service (assuming we use PM2 for node apps)
# pm2 restart gear-backend
# pm2 restart gear-webhook

echo "Deployment finished at $(date)"
