#!/bin/bash

# Deployment script for Bird Identifier Backend
# This script deploys using Docker Compose
# Run this on the server: /var/www/bird-identifier/BirdIdentifier-Backend

set -e  # Exit on error

echo "🚀 Starting Bird Identifier Backend deployment..."

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found!"
    echo "Please run this script from the project root directory."
    exit 1
fi

# Pull latest code
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build application
echo "🔨 Building application..."
npm run build

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed!"
    echo "Please install Docker first. See SERVER-SETUP.md"
    exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    if [ -f .env.production ]; then
        echo "Creating .env from .env.production..."
        cp .env.production .env
        echo "🔧 Please update .env with your credentials before continuing!"
        exit 1
    else
        echo "❌ No .env.production template found!"
        exit 1
    fi
fi

# Stop old PM2 processes (if running)
if command -v pm2 &> /dev/null; then
    echo "🛑 Stopping old PM2 processes..."
    pm2 delete all || true
    pm2 save || true
fi

# Build Docker containers
echo "🐳 Building Docker containers..."
docker compose build

# Start services
echo "🔄 Starting services with Docker Compose..."
docker compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check container status
echo "📊 Container status:"
docker compose ps

# Run database migrations
echo "🗄️  Running database migrations..."
docker compose exec -T app npm run migration:run || true

# Health checks
echo "🏥 Running health checks..."

# Check BirdNET
if curl -f http://localhost:8080/health > /dev/null 2>&1; then
    echo "✅ BirdNET is healthy"
else
    echo "⚠️  BirdNET health check failed"
    docker compose logs birdnet
fi

# Check NestJS API
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ NestJS API is healthy"
else
    echo "⚠️  NestJS API health check failed"
    docker compose logs app
fi

# Check Database
if docker compose exec -T db pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ Database is healthy"
else
    echo "⚠️  Database health check failed"
    docker compose logs db
fi

echo ""
echo "✨ Deployment completed!"
echo ""
echo "📝 Useful commands:"
echo "  - View logs:       docker compose logs -f"
echo "  - Restart:         docker compose restart"
echo "  - Stop:            docker compose down"
echo "  - Rebuild:         docker compose up -d --build"
echo ""