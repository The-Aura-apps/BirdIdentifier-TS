#!/bin/bash

# Deployment script for Bird Identifier Backend
# This script deploys using Docker Compose
# Run this on the server: /var/www/bird-identifier/BirdIdentifier-Backend

set -e  # Exit on error

echo "Starting Bird Identifier Backend deployment..."

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "ERROR: docker-compose.yml not found!"
    echo "Please run this script from the project root directory."
    exit 1
fi

# Check if port 5432 is already in use (existing PostgreSQL)
if lsof -Pi :5432 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "WARNING: Port 5432 is in use (PostgreSQL already running)"
    echo "Using docker-compose.no-db.yml (without database container)"
    COMPOSE_FILE="docker-compose.no-db.yml"
else
    echo "Using docker-compose.yml (with database container)"
    COMPOSE_FILE="docker-compose.yml"
fi

# Pull latest code
echo "Pulling latest code from GitHub..."
git pull origin main

# Install dependencies
echo "Installing dependencies..."
npm ci

# Build application
echo "Building application..."
npm run build

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed!"
    echo "Please install Docker first. See SERVER-SETUP.md"
    exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "WARNING: .env file not found!"
    if [ -f .env.production ]; then
        echo "Creating .env from .env.production..."
        cp .env.production .env
        echo "Please update .env with your credentials before continuing!"
        exit 1
    else
        echo "ERROR: No .env.production template found!"
        exit 1
    fi
fi

# Stop old PM2 processes (if running)
if command -v pm2 &> /dev/null; then
    echo "Stopping old PM2 processes..."
    pm2 delete all || true
    pm2 save || true
fi

# Build Docker containers
echo "Building Docker containers..."
docker compose -f $COMPOSE_FILE build

# Start services
echo "Starting services with Docker Compose..."
docker compose -f $COMPOSE_FILE up -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 10

# Check container status
echo "Container status:"
docker compose -f $COMPOSE_FILE ps

# Run database migrations
echo "Running database migrations..."
docker compose -f $COMPOSE_FILE exec -T app npm run migration:run || true

# Health checks
echo "Running health checks..."

# Check BirdNET
if curl -f http://localhost:8080/health > /dev/null 2>&1; then
    echo "BirdNET is healthy"
else
    echo "WARNING: BirdNET health check failed"
    docker compose -f $COMPOSE_FILE logs birdnet
fi

# Check NestJS API
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "NestJS API is healthy"
else
    echo "WARNING: NestJS API health check failed"
    docker compose -f $COMPOSE_FILE logs app
fi

# Check Database (only if using docker-compose.yml with db container)
if [ "$COMPOSE_FILE" = "docker-compose.yml" ]; then
    if docker compose -f $COMPOSE_FILE exec -T db pg_isready -U postgres > /dev/null 2>&1; then
        echo "Database is healthy"
    else
        echo "WARNING: Database health check failed"
        docker compose -f $COMPOSE_FILE logs db
    fi
else
    echo "INFO: Using external PostgreSQL database"
fi

echo ""
echo "Deployment completed!"
echo ""
echo "Useful commands:"
echo "  - View logs:       docker compose logs -f"
echo "  - Restart:         docker compose restart"
echo "  - Stop:            docker compose down"
echo "  - Rebuild:         docker compose up -d --build"
echo ""