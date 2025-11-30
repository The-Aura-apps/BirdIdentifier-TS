# Bird Identifier Backend - Testing Guide

## Two Ways to Run BirdNET

### Option 1: Standalone Python Server (Recommended for Development)
- No Docker required
- Fast startup
- Easy debugging
- Uses mock data (returns same bird for all audio)

### Option 2: Docker with Full BirdNET Model
- Production-ready
- Full ML model
- Requires Docker Desktop
- Slower startup

---

## Quick Start (Standalone - No Docker)

### 1. Start BirdNET Python Server

**Terminal 1:**
```bash
cd E:/aura-apps/Bird-Identifier/BirdIdentifier-Backend/birdnet-service
pip install flask  # First time only
python birdnet-server.py
```

You should see:
```
==================================================
BirdNET Standalone Server
==================================================
Server running on http://localhost:8080
Health check: http://localhost:8080/health
==================================================
```

**Keep this terminal running!**

### 2. Start NestJS Application

**Terminal 2:**
```bash
cd E:/aura-apps/Bird-Identifier/BirdIdentifier-Backend
npm run start:dev
```

**Keep this terminal running too!**

### 3. Test the System

**Terminal 3 (or use Postman):**

#### A. Check BirdNET Health
```bash
curl http://localhost:8080/health
```

Expected response:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "version": "1.0-standalone"
}
```

#### B. Check NestJS API Health
```bash
curl http://localhost:3000/test/observations/birdnet-health
```

Expected response:
```json
{
  "success": true,
  "birdnet": {
    "status": "healthy",
    "url": "http://localhost:8080"
  }
}
```

#### C. Upload Audio File

**Windows PowerShell:**
```powershell
# Replace with your actual audio file path
curl.exe -X POST http://localhost:3000/test/observations/upload-audio `
  -F "audio=@C:\path\to\your\audio.mp3" `
  -F "latitude=40.7128" `
  -F "longitude=-74.0060"
```

**Git Bash / Linux / Mac:**
```bash
curl -X POST http://localhost:3000/test/observations/upload-audio \
  -F "audio=@/path/to/your/audio.mp3" \
  -F "latitude=40.7128" \
  -F "longitude=-74.0060"
```

Expected response:
```json
{
  "success": true,
  "message": "Audio analyzed successfully",
  "identification": {
    "scientificName": "Turdus migratorius",
    "confidence": 0.85
  },
  "file": {
    "name": "audio.mp3",
    "size": 123456,
    "mimeType": "audio/mpeg"
  }
}
```

#### D. Get All Observations
```bash
curl http://localhost:3000/test/observations
```

---

## Using Postman or Insomnia

### Test Audio Upload:

1. **Create new request**
   - Method: `POST`
   - URL: `http://localhost:3000/test/observations/upload-audio`

2. **Set Body to form-data:**
   - `audio` (File): Select your audio file
   - `latitude` (Text): `40.7128`
   - `longitude` (Text): `-74.0060`

3. **Send request**

4. **Check Terminal 2** for detailed logs showing the analysis process

---

## Test Endpoints Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `http://localhost:8080/health` | GET | BirdNET service health |
| `http://localhost:3000/test/observations/birdnet-health` | GET | Check BirdNET from NestJS |
| `http://localhost:3000/test/observations/upload-audio` | POST | Upload audio & analyze |
| `http://localhost:3000/test/observations` | GET | Get all observations |
| `http://localhost:3000/test/observations/:id` | GET | Get single observation |

---

## Troubleshooting

### Server Error: "getaddrinfo EAI_AGAIN birdnet"

**Problem:** Your server can't resolve the hostname `birdnet`  
**Root Cause:** `.env` has `BIRDNET_URL=http://birdnet:8080` but BirdNET container isn't running

**Solution 1 - Use Docker Compose on Server (Recommended):**
```bash
# On your server
cd /path/to/BirdIdentifier-Backend

# Copy production environment file
cp .env.production .env

# Update with your values (OpenAI key, DB password, etc.)
nano .env

# Start all services
docker-compose up -d --build

# Verify all containers running
docker-compose ps

# Check logs
docker-compose logs -f

# Test BirdNET health
curl http://localhost:8080/health
```

**Solution 2 - Use Standalone Server:**
```bash
# On your server
cd /path/to/BirdIdentifier-Backend/birdnet-service

# Install Flask
pip install flask

# Start BirdNET server in background
nohup python birdnet-server.py > birdnet.log 2>&1 &

# Update .env
BIRDNET_URL=http://localhost:8080

# Restart NestJS
pm2 restart bird-api  # or your process manager
```

### Error: "Failed to connect to localhost port 8080"
**Problem:** BirdNET server not running  
**Solution:** Start it in Terminal 1:
```bash
cd E:/aura-apps/Bird-Identifier/BirdIdentifier-Backend/birdnet-service
python birdnet-server.py
```

### Error: "ModuleNotFoundError: No module named 'flask'"
**Problem:** Flask not installed  
**Solution:**
```bash
pip install flask
```

### Error: "Failed to open/read local data from file/application"
**Problem:** Invalid file path  
**Solution:** Use absolute path to an actual audio file:
```bash
# Windows
curl -X POST http://localhost:3000/test/observations/upload-audio \
  -F "audio=@C:/Users/YourName/Downloads/bird.mp3"

# Linux/Mac
curl -X POST http://localhost:3000/test/observations/upload-audio \
  -F "audio=@/home/user/Downloads/bird.mp3"
```

### BirdNET returns same bird for all audio
**This is normal!** The standalone server uses mock data. To get real analysis, use Docker option below.

---

## Docker Setup (Full BirdNET Model)

### Prerequisites
1. Docker Desktop installed and running
2. At least 4GB RAM available for Docker

### 1. Configure Environment

Make sure `.env` has:
```bash
BIRDNET_URL=http://birdnet:8080
DATABASE_URL=postgresql://postgres:yourpassword@db:5432/bird-identifier
DB_NAME=bird-identifier
DB_USER=postgres
DB_PASSWORD=yourpassword
```

### 2. Build and Start

```bash
# Build containers
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps
```

### 3. Test Docker Services

```bash
# BirdNET health
curl http://localhost:8080/health

# NestJS API
curl http://localhost:3000/test/observations/birdnet-health

# Upload audio (same as standalone)
curl -X POST http://localhost:3000/test/observations/upload-audio \
  -F "audio=@bird.mp3" \
  -F "latitude=40.7128" \
  -F "longitude=-74.0060"
```

### 4. View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f birdnet
docker-compose logs -f app
```

### 5. Stop Services

```bash
docker-compose down
```

---

## Supported Audio Formats

- ✅ `.mp3` - MPEG Audio
- ✅ `.wav` - Waveform Audio
- ✅ `.flac` - Free Lossless Audio Codec
- ✅ `.ogg` - Ogg Vorbis
- ✅ `.m4a` - MPEG-4 Audio
- ✅ `.aac` - Advanced Audio Coding

---

## Sample Audio Files

### Where to get test audio:

1. **Xeno-canto** (Free bird recordings): https://www.xeno-canto.org/
2. **Macaulay Library**: https://www.macaulaylibrary.org/
3. **Use any short audio/music file** for testing (standalone mode returns mock data anyway)

---

## Console Output Example

When you upload audio, **Terminal 2** (NestJS) shows:

```
==================================================
TEST: Audio Upload
==================================================
File: bird-recording.mp3
Size: 245678 bytes
MIME: audio/mpeg
Latitude: 40.7128
Longitude: -74.006
--------------------------------------------------
Step 1: Analyzing audio with BirdNET...
Identification Result:
  Scientific Name: Turdus migratorius
  Confidence: 0.85
--------------------------------------------------
Step 2: Creating observation...
Observation Data: { ... }
==================================================
```

---

## Quick Test Checklist

### Standalone Mode:
- [ ] BirdNET server running on port 8080
- [ ] NestJS app running on port 3000
- [ ] Health check passes
- [ ] Audio upload works
- [ ] Console shows analysis logs

### Docker Mode:
- [ ] Docker Desktop running
- [ ] `.env` configured
- [ ] `docker-compose ps` shows all containers up
- [ ] BirdNET health check passes
- [ ] Audio analysis works

---

## Next Steps

1. ✅ Test audio upload - **DONE**
2. 📝 Save observations to database
3. 🔒 Add authentication
4. 💾 Implement file storage (S3/local)
5. 🧪 Write unit tests
6. 🚀 Deploy to production

See **TEST-UPLOAD.md** for more detailed testing instructions!

---

## Common Commands Reference

```bash
# Standalone Mode
cd birdnet-service && python birdnet-server.py
npm run start:dev

# Docker Mode
docker-compose up -d
docker-compose logs -f
docker-compose down

# Test
curl http://localhost:8080/health
curl http://localhost:3000/test/observations/birdnet-health
curl -X POST http://localhost:3000/test/observations/upload-audio -F "audio=@bird.mp3"
```

---

## 2. Start Services with Docker Compose

### Build all containers:
```bash
docker-compose build
```

### Start services in detached mode:
```bash
docker-compose up -d
```

### Check service status:
```bash
docker-compose ps
```

Expected output:
```
NAME                IMAGE                            STATUS
bird-api            birdidentifier-backend-app       Up
birdnet-analyzer    birdidentifier-backend-birdnet   Up (healthy)
bird-db             postgres:15-alpine               Up
```

### View logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f birdnet
docker-compose logs -f app
```

---

## 3. Test BirdNET Service

### A. Health Check
```bash
curl http://localhost:8080/health
```

Expected response:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "version": "2.4"
}
```

### B. Get Species List
```bash
curl http://localhost:8080/species | jq '.total_species'
```

### C. Test Audio Analysis

First, get a sample bird audio file:
```bash
# Download a sample bird audio (American Robin)
wget https://www.xeno-canto.org/sounds/uploaded/XXYYZZAA/XC123456-American-Robin.mp3 -O test-bird.mp3
```

Or use this curl command with any `.wav`, `.mp3`, or `.flac` file:

```bash
curl -X POST http://localhost:8080/analyze \
  -F "audio=@test-bird.mp3" \
  -F "min_conf=0.1" \
  | jq
```

Expected response:
```json
{
  "success": true,
  "file": "test-bird.mp3",
  "results": [
    {
      "start": 0.0,
      "end": 3.0,
      "scientific_name": "Turdus migratorius",
      "common_name": "American Robin",
      "confidence": 0.8542
    }
  ],
  "total_detections": 1
}
```

---

## 4. Test NestJS API

### A. Health Check
```bash
curl http://localhost:3000/health
```

### B. Test Audio Upload Endpoint

Assuming you have an endpoint at `/api/observations/upload-audio`:

```bash
curl -X POST http://localhost:3000/api/observations/upload-audio \
  -F "audio=@test-bird.mp3" \
  -F "latitude=40.7128" \
  -F "longitude=-74.0060" \
  | jq
```

---

## 5. Manual Testing with Postman/Insomnia

### Setup:
1. Import environment variables
2. Create requests for each endpoint

### BirdNET Service Test:

**Request:**
- Method: `POST`
- URL: `http://localhost:8080/analyze`
- Body: `form-data`
  - Key: `audio` (File)
  - Value: Upload audio file
  - Key: `min_conf` (Text)
  - Value: `0.1`

**Expected Response:** JSON with bird detections

---

## 6. Integration Testing

### Create a test script:

```bash
# test-integration.sh
#!/bin/bash

echo "=== Testing BirdNET Service ==="

# 1. Health check
echo "1. Health Check..."
curl -s http://localhost:8080/health | jq .status

# 2. Analyze audio
echo "2. Analyzing test audio..."
curl -s -X POST http://localhost:8080/analyze \
  -F "audio=@test-bird.mp3" \
  -F "min_conf=0.1" \
  | jq '.results[0] | {scientific_name, confidence}'

echo "=== Testing Complete ==="
```

Make it executable and run:
```bash
chmod +x test-integration.sh
./test-integration.sh
```

---

## 7. Testing Audio AI Wrapper Directly

### Create a test endpoint in your NestJS app:

**File:** `src/modules/ai/ai.controller.ts`

```typescript
import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AudioAiWrapper } from './wrappers/audio-ai.wrapper';

@Controller('ai/test')
export class AiTestController {
    constructor(private audioAi: AudioAiWrapper) {}

    @Post('audio')
    @UseInterceptors(FileInterceptor('audio'))
    async testAudio(@UploadedFile() file: Express.Multer.File) {
        const result = await this.audioAi.identify(file.buffer);
        return {
            success: true,
            result,
            fileSize: file.size,
            mimeType: file.mimetype,
        };
    }

    @Get('health')
    async testHealth() {
        const isHealthy = await this.audioAi.healthCheck();
        return {
            birdnet_status: isHealthy ? 'healthy' : 'unhealthy',
        };
    }
}
```

### Test it:
```bash
curl -X POST http://localhost:3000/ai/test/audio \
  -F "audio=@test-bird.mp3" \
  | jq
```

---

## 8. Troubleshooting

### BirdNET container won't start:

```bash
# Check logs
docker-compose logs birdnet

# Rebuild
docker-compose down
docker-compose build --no-cache birdnet
docker-compose up -d
```

### Model not loading:

```bash
# Enter container
docker exec -it birdnet-analyzer bash

# Check if model exists
ls -la checkpoints/

# If missing, the BirdNET repo structure may have changed
# Check the actual repo structure
ls -la
```

### Connection refused errors:

```bash
# Check if services are on the same network
docker network inspect birdidentifier-backend_bird-network

# Verify service names resolve
docker exec -it bird-api ping birdnet
```

### Audio format issues:

Supported formats: `.wav`, `.mp3`, `.flac`, `.ogg`, `.m4a`, `.aac`

Convert unsupported formats:
```bash
# Using ffmpeg
ffmpeg -i input.opus -ar 48000 output.wav
```

---

## 9. Performance Testing

### Load test with Apache Bench:

```bash
# Test health endpoint
ab -n 100 -c 10 http://localhost:8080/health

# Test audio analysis (requires ab-multipart or similar)
```

### Monitor resource usage:

```bash
docker stats
```

---

## 10. Cleanup

### Stop all services:
```bash
docker-compose down
```

### Stop and remove volumes (clean slate):
```bash
docker-compose down -v
```

### Remove images:
```bash
docker-compose down --rmi all
```

---

## Sample Audio Files for Testing

### Where to find test audio:
1. **Xeno-canto**: https://www.xeno-canto.org/
   - Free bird sound recordings
   - Download in MP3 format

2. **Macaulay Library**: https://www.macaulaylibrary.org/
   - Cornell Lab of Ornithology recordings

3. **Create your own test file**:
   ```bash
   # Generate a 3-second test tone (for testing pipeline, not actual bird)
   ffmpeg -f lavfi -i "sine=frequency=1000:duration=3" -ar 48000 test-tone.wav
   ```

### Recommended test cases:
- ✅ American Robin (common, easy to identify)
- ✅ Northern Cardinal
- ✅ Black-capped Chickadee
- ✅ Multiple birds in one recording
- ✅ Noisy background
- ✅ Very short clip (< 1 second)
- ✅ Long recording (> 30 seconds)

---

## Quick Test Checklist

- [ ] Docker Desktop running
- [ ] `.env` file configured
- [ ] `docker-compose build` successful
- [ ] `docker-compose up -d` successful
- [ ] All containers healthy: `docker-compose ps`
- [ ] BirdNET health check: `curl localhost:8080/health`
- [ ] NestJS API responding: `curl localhost:3000/health`
- [ ] Audio analysis works: Test with sample file
- [ ] Logs show no errors: `docker-compose logs`

---

## Next Steps

1. **Write unit tests** for `AudioAiWrapper`
2. **Create e2e tests** for the full observation flow
3. **Set up CI/CD** with GitHub Actions
4. **Monitor performance** in production
5. **Add rate limiting** for API endpoints

---

## Common Test Commands (Quick Reference)

```bash
# Start everything
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f birdnet

# Test BirdNET
curl http://localhost:8080/health

# Test audio
curl -X POST http://localhost:8080/analyze -F "audio=@bird.mp3" | jq

# Stop everything
docker-compose down

# Full rebuild
docker-compose down && docker-compose build --no-cache && docker-compose up -d
```
