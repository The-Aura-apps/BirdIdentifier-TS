# Quick Reference - Server Deployment with Docker

## 🚀 First Time Setup (Do Once)

### 1. Install Docker on Server
```bash
# SSH to server
ssh your-username@46.249.101.76

# Install Docker (Ubuntu/Debian)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in
exit
ssh your-username@46.249.101.76

# Verify
docker --version
docker compose version
```

### 2. Stop Old PM2 Process
```bash
cd /var/www/bird-identifier/BirdIdentifier-Backend
pm2 delete all
pm2 save
```

### 3. Create Production Environment File
```bash
nano .env
```

**Paste this and update values:**
```env
DATABASE_URL=postgresql://postgres:CHANGE_PASSWORD@db:5432/bird-idf-x1
DB_USERNAME=postgres
DB_PASSWORD=CHANGE_PASSWORD
DB_NAME=bird-idf-x1
BIRDNET_URL=http://birdnet:8080
OPENAI_API_KEY=your-key-here
NODE_ENV=production
```

### 4. First Deployment
```bash
# Pull latest code
git pull origin main

# Start services
docker compose up -d --build

# Check status
docker compose ps

# View logs
docker compose logs -f
```

---

## 🔄 Every Time You Update Code

### Option A: Automatic (Recommended)
Just push to GitHub:
```bash
git add .
git commit -m "your message"
git push origin main
```

GitHub Actions will automatically:
1. Pull code on server
2. Rebuild Docker containers
3. Restart services
4. Run migrations

### Option B: Manual
SSH to server and run:
```bash
cd /var/www/bird-identifier/BirdIdentifier-Backend
./.github/bash-scripts/deploay.sh
```

---

## 📋 Common Commands

### View Status
```bash
docker compose ps
```

### View Logs
```bash
# All services
docker compose logs -f

# Just API
docker compose logs -f app

# Just BirdNET
docker compose logs -f birdnet

# Just Database
docker compose logs -f db
```

### Restart Service
```bash
# Restart all
docker compose restart

# Restart just API
docker compose restart app
```

### Stop Everything
```bash
docker compose down
```

### Start Everything
```bash
docker compose up -d
```

### Rebuild After Code Change
```bash
git pull origin main
docker compose up -d --build
```

### Access Database
```bash
docker compose exec db psql -U postgres -d bird-idf-x1
```

### View Database Tables
```bash
docker compose exec db psql -U postgres -d bird-idf-x1 -c "\dt"
```

---

## ✅ Health Checks

```bash
# BirdNET
curl http://localhost:8080/health

# API
curl http://localhost:3000/health

# From outside server
curl http://46.249.101.76:3000/health
curl http://46.249.101.76:8080/health
```

---

## 🔧 Troubleshooting

### Containers Not Starting
```bash
docker compose logs
docker compose down
docker compose up -d --build
```

### Port Already in Use
```bash
# Stop old PM2
pm2 delete all

# Or find what's using port
sudo lsof -i :3000
```

### Out of Disk Space
```bash
# Clean Docker
docker system prune -a

# Check disk
df -h
```

### Database Migration Failed
```bash
docker compose exec app npm run migration:run
```

---

## 📦 Backup & Restore

### Backup Database
```bash
docker compose exec db pg_dump -U postgres bird-idf-x1 > backup-$(date +%Y%m%d).sql
```

### Restore Database
```bash
docker compose exec -T db psql -U postgres bird-idf-x1 < backup-20251130.sql
```

---

## 🎯 Production Checklist

Before deploying to production, make sure:

- [ ] Docker installed on server
- [ ] `.env` file created with real credentials
- [ ] Firewall allows ports 3000, 8080
- [ ] GitHub secrets configured (SERVER_HOST, SERVER_USER, SSH_PRIVATE_KEY)
- [ ] Old PM2 processes stopped
- [ ] Database backed up
- [ ] Health checks passing
- [ ] Test audio upload working

---

## 📚 Full Documentation

- **SERVER-SETUP.md** - Complete step-by-step server setup
- **CI-CD-SETUP.md** - GitHub Actions configuration
- **TESTING.md** - Development and testing guide
- **README.md** - Project overview

---

## 🆘 Emergency Rollback

If deployment breaks:

```bash
# SSH to server
ssh your-username@46.249.101.76
cd /var/www/bird-identifier/BirdIdentifier-Backend

# Find previous working commit
git log --oneline

# Rollback
git reset --hard <commit-hash>

# Rebuild
docker compose up -d --build
```

Or use PM2 as fallback:
```bash
docker compose down
pm2 start ecosystem.config.js
```
