# CI/CD Setup for Docker Deployment

This guide explains how to update your GitHub Actions workflows to automatically deploy Docker containers when you push code changes.

## What Changed?

**Before:** CI/CD used PM2 to run Node.js directly on the server  
**After:** CI/CD uses Docker Compose to run all services in containers

---

## Option 1: Docker Compose Deployment (Recommended)

### Workflow Overview
When you push to `main` branch:
1. GitHub Actions connects to your server via SSH
2. Pulls latest code from GitHub
3. Rebuilds Docker containers with new code
4. Restarts services automatically

### Update GitHub Secrets

Go to your repository: **Settings → Secrets and variables → Actions**

Verify these secrets exist (they should already be there):
- `SERVER_HOST` = `46.249.101.76`
- `SERVER_USER` = your SSH username
- `SSH_PRIVATE_KEY` = your SSH private key

### Updated deploy.yml

The new workflow is already created in `.github/workflows/deploy.yml` (see below).

---

## Option 2: Hybrid Deployment (Docker + PM2 Fallback)

If you want to keep PM2 as a backup option, you can deploy both ways.

---

## Updated Workflows

I'll update your CI/CD files now to support Docker deployment.

### Key Changes:

1. **deploy.yml** - Deploys using Docker Compose
2. **ci.yml** - Tests and builds before deployment
3. **deploay.sh** - Updated script for Docker deployment

The workflows will:
- ✅ Pull latest code
- ✅ Build Docker images
- ✅ Restart containers with zero downtime
- ✅ Run database migrations automatically
- ✅ Keep logs of deployment

---

## Testing CI/CD

After setup, test the pipeline:

```bash
# Make a small change
echo "# Test deployment" >> README.md

# Commit and push
git add .
git commit -m "test: CI/CD with Docker"
git push origin main
```

**Watch the deployment:**
1. Go to GitHub → Actions tab
2. You'll see the workflow running
3. Click on it to see detailed logs

**On your server:**
```bash
# SSH to server
ssh your-username@46.249.101.76

# Watch Docker logs
cd /var/www/bird-identifier/BirdIdentifier-Backend
docker compose logs -f
```

---

## Manual Deployment

If you want to deploy manually (without pushing to GitHub):

```bash
# SSH to server
ssh your-username@46.249.101.76

# Navigate to project
cd /var/www/bird-identifier/BirdIdentifier-Backend

# Run deployment script
chmod +x .github/bash-scripts/deploy.sh
./.github/bash-scripts/deploy.sh
```

---

## Environment Variables in CI/CD

### For Docker Deployment

The `.env` file on your server will be used by Docker Compose. Make sure it has:

```env
BIRDNET_URL=http://birdnet:8080
DATABASE_URL=postgresql://postgres:password@db:5432/bird-idf-x1
```

### For Local Development

Your local `.env` should have:

```env
BIRDNET_URL=http://localhost:8080
DATABASE_URL=postgresql://postgres:password@localhost:5432/bird-idf-x1
```

**Important:** Never commit `.env` to GitHub! It's in `.gitignore`.

---

## Monitoring Deployment

### View GitHub Actions Logs
1. Go to: https://github.com/The-Aura-apps/BirdIdentifier-Backend/actions
2. Click on latest workflow run
3. Click on "deploy" job
4. Expand each step to see details

### View Server Logs
```bash
# All services
docker compose logs -f

# Just API
docker compose logs -f app

# Just BirdNET
docker compose logs -f birdnet
```

### Check Container Status
```bash
docker compose ps
```

---

## Rollback Deployment

If a deployment fails:

```bash
# SSH to server
ssh your-username@46.249.101.76
cd /var/www/bird-identifier/BirdIdentifier-Backend

# Go back to previous commit
git log --oneline  # Find the previous commit hash
git reset --hard <previous-commit-hash>

# Rebuild and restart
docker compose up -d --build
```

---

## Advanced: Blue-Green Deployment

For zero-downtime deployments, you can use this strategy:

```bash
# Build new images without stopping old ones
docker compose build

# Start new containers
docker compose up -d --no-deps --build app

# Old container stops, new one starts seamlessly
```

This is already handled by `docker compose up -d --build` command.

---

## Cost and Performance

### Resource Usage
- **Database Container:** ~100-200MB RAM
- **BirdNET Container:** ~200-300MB RAM
- **NestJS Container:** ~150-250MB RAM
- **Total:** ~500-750MB RAM

### Build Time
- First build: ~5-10 minutes (downloads images)
- Subsequent builds: ~1-2 minutes (uses cache)

### Deployment Time
- Docker restart: ~10-30 seconds

---

## Troubleshooting CI/CD

### Deployment Fails: "Permission Denied"
```bash
# On server, fix permissions
sudo chown -R $USER:$USER /var/www/bird-identifier
```

### Deployment Fails: "Docker not found"
```bash
# On server, install Docker
# See SERVER-SETUP.md
```

### Containers Not Starting
```bash
# Check logs in GitHub Actions
# Then SSH to server and check:
docker compose logs
```

### Database Migration Fails
```bash
# SSH to server
cd /var/www/bird-identifier/BirdIdentifier-Backend

# Run migrations manually
docker compose exec app npm run migration:run
```

---

## Next Steps

1. ✅ Complete server setup (SERVER-SETUP.md)
2. ✅ Update CI/CD workflows (this file)
3. ✅ Test deployment by pushing a change
4. ✅ Monitor first automated deployment
5. ✅ Set up monitoring/alerting (optional)

---

## Questions?

Common questions:

**Q: Do I need to stop PM2?**  
A: Yes, if you're using Docker. Run `pm2 delete all && pm2 save`

**Q: Can I use both PM2 and Docker?**  
A: Not recommended. Choose one to avoid port conflicts.

**Q: What happens to existing data?**  
A: PostgreSQL data is stored in a Docker volume, so it persists across restarts.

**Q: How do I backup the database?**  
A: `docker compose exec db pg_dump -U postgres bird-idf-x1 > backup.sql`

**Q: How do I restore a backup?**  
A: `docker compose exec -T db psql -U postgres bird-idf-x1 < backup.sql`
