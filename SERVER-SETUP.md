# Server Setup Guide - Step by Step

This guide will help you set up your production server (46.249.101.76) with Docker for the Bird Identifier Backend.

## Step 1: Connect to Your Server

```bash
# From your local machine
ssh your-username@46.249.101.76
```

## Step 2: Install Docker and Docker Compose

### For Ubuntu/Debian Server:

```bash
# Update package index
sudo apt update

# Install prerequisites
sudo apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Set up Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Verify Docker installation
sudo docker --version
docker compose version  # Note: using 'docker compose' not 'docker-compose'
```

### For CentOS/RHEL/Rocky Linux:

```bash
# Install required packages
sudo yum install -y yum-utils

# Add Docker repository
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Install Docker
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Verify
sudo docker --version
docker compose version
```

## Step 3: Add Your User to Docker Group

```bash
# Add your user to docker group (avoid using sudo for every docker command)
sudo usermod -aG docker $USER

# Log out and log back in for changes to take effect
exit
# SSH back in
ssh your-username@46.249.101.76

# Test Docker without sudo
docker ps
```

## Step 4: Navigate to Application Directory

```bash
# Go to your existing application directory
cd /var/www/bird-identifier/BirdIdentifier-Backend

# Check current status
git status
```

## Step 5: Create Production Environment File

```bash
# Create .env file for production
nano .env
```

**Add this content (update with your actual values):**

```env
# Database
DATABASE_URL=postgresql://postgres:CHANGE_THIS_PASSWORD@db:5432/bird-idf-x1
DB_HOST=db
DB_PORT=5432
DB_USER=postgres
DB_USERNAME=postgres
DB_PASSWORD=CHANGE_THIS_PASSWORD
DB_NAME=bird-idf-x1
DB_SYNCHRONIZE=false

# Application
NODE_ENV=production
PORT=3000

# OpenAI
OPENAI_API_KEY=your-actual-openai-key-here
OPENAI_MODEL=gpt-4o-mini

# CDN URL (use your server IP or domain)
CDN_URL=http://46.249.101.76:3000

# Local Storage
LOCAL_STORAGE_URL=http://46.249.101.76:3000/uploads

# BirdNET Service (Docker network name)
BIRDNET_URL=http://birdnet:8080
```

**Save and exit:** Press `Ctrl+X`, then `Y`, then `Enter`

## Step 6: Pull Latest Code

```bash
# Make sure you're on main branch
git checkout main

# Pull latest changes
git pull origin main

# Verify docker-compose.yml exists
ls -la docker-compose.yml
```

## Step 7: Build and Start Docker Containers

```bash
# Build all containers (first time takes 5-10 minutes)
docker compose build

# Start all services in background
docker compose up -d

# This will start:
# - PostgreSQL database (port 5432)
# - BirdNET service (port 8080)
# - NestJS API (port 3000)
```

## Step 8: Verify Services Are Running

```bash
# Check container status
docker compose ps

# You should see 3 containers running:
# - bird-db (PostgreSQL)
# - birdnet-service (BirdNET)
# - bird-api (NestJS)

# Check logs
docker compose logs -f

# Press Ctrl+C to stop viewing logs
```

## Step 9: Test the Services

```bash
# Test BirdNET health
curl http://localhost:8080/health

# Expected output:
# {"status":"healthy","model_loaded":true,"version":"1.0-standalone"}

# Test NestJS API health
curl http://localhost:3000/health

# Test from external (from your local machine)
curl http://46.249.101.76:3000/health
curl http://46.249.101.76:8080/health
```

## Step 10: Test Audio Upload

```bash
# From your local machine
curl -X POST http://46.249.101.76:3000/test/observations/upload-audio \
  -F "audio=@/path/to/bird.mp3" \
  -F "latitude=40.7128" \
  -F "longitude=-74.0060" \
  -F "deviceId=test-device"
```

## Step 11: Configure Firewall (If Needed)

```bash
# On your server
# Allow Docker ports
sudo ufw allow 3000/tcp  # NestJS API
sudo ufw allow 8080/tcp  # BirdNET
sudo ufw allow 5432/tcp  # PostgreSQL (only if external access needed)

# Check firewall status
sudo ufw status
```

## Step 12: Set Up Auto-Restart on Server Reboot

```bash
# Docker containers will auto-restart due to "restart: unless-stopped" in docker-compose.yml

# Verify restart policy
docker inspect bird-api | grep -A 3 RestartPolicy
docker inspect birdnet-service | grep -A 3 RestartPolicy
docker inspect bird-db | grep -A 3 RestartPolicy
```

---

## Common Docker Commands for Maintenance

### View Container Status
```bash
docker compose ps
```

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f app
docker compose logs -f birdnet
docker compose logs -f db
```

### Restart Services
```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart app
docker compose restart birdnet
```

### Stop Services
```bash
docker compose down
```

### Start Services
```bash
docker compose up -d
```

### Rebuild After Code Changes
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker compose up -d --build
```

### Access Container Shell
```bash
# Access NestJS container
docker compose exec app sh

# Access BirdNET container
docker compose exec birdnet sh

# Access database
docker compose exec db psql -U postgres -d bird-idf-x1
```

### View Database Data
```bash
# Connect to PostgreSQL
docker compose exec db psql -U postgres -d bird-idf-x1

# Inside PostgreSQL shell:
\dt                    # List tables
SELECT * FROM uploads; # View uploads
SELECT * FROM observations; # View observations
\q                     # Quit
```

### Clean Up Docker (Free Space)
```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove stopped containers
docker container prune

# Remove everything unused
docker system prune -a
```

---

## Troubleshooting

### Port Already in Use
```bash
# Check what's using port 3000
sudo lsof -i :3000

# Stop old PM2 process if running
pm2 delete all
pm2 save
```

### Container Won't Start
```bash
# Check logs
docker compose logs app
docker compose logs birdnet

# Rebuild from scratch
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Database Connection Error
```bash
# Check if database is running
docker compose ps db

# Check database logs
docker compose logs db

# Verify credentials in .env match docker-compose.yml
```

### Out of Disk Space
```bash
# Check disk usage
df -h

# Clean Docker images/containers
docker system prune -a
```

---

## Next Steps

After completing this setup:

1. **Update GitHub Secrets** (see CI/CD-SETUP.md)
2. **Test CI/CD Pipeline** - Push a small change to trigger auto-deployment
3. **Monitor Logs** - Check `docker compose logs -f` regularly
4. **Set Up Monitoring** - Consider adding tools like Portainer for visual Docker management

---

## Rollback to Old Setup (If Needed)

If you need to go back to PM2:

```bash
# Stop Docker
docker compose down

# Start PM2 (old way)
pm2 start ecosystem.config.js
pm2 save
```
