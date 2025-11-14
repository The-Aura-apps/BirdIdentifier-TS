#!/bin/bash

# This script assumes it's run on the server in /var/www/bird-identifier
# You can test it locally if your env matches, or SCP it to server for manual runs

echo "Starting deployment..."

# Pull latest code
git pull origin main

# Install dependencies
npm ci

# Build application
npm run build

# Run database migrations (if applicable)
npm run migration:run || true

# Restart application with PM2
pm2 reload ecosystem.config.js --update-env

# Save PM2 process list
pm2 save

echo "Deployment completed successfully!"