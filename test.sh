#!/bin/bash

echo "============================================"
echo "BirdIdentifier Backend - Quick Test"
echo "============================================"
echo ""

# Check if Docker is running
echo "1. Checking Docker status..."
if docker info > /dev/null 2>&1; then
    echo "   ✓ Docker is running"
else
    echo "   ✗ Docker is NOT running!"
    echo "   → Please start Docker Desktop first"
    exit 1
fi

echo ""
echo "2. Checking Docker Compose services..."
docker-compose ps

echo ""
echo "3. Testing BirdNET health endpoint..."
curl -s http://localhost:8080/health || echo "✗ BirdNET service not responding"

echo ""
echo "4. Testing NestJS API health endpoint..."
curl -s http://localhost:3000/health || echo "✗ NestJS API not responding"

echo ""
echo "============================================"
echo "Test complete!"
echo "============================================"
