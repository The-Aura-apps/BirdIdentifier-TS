# Bird Identifier Backend - Testing Guide

## Prerequisites

1. **Docker Desktop** must be running
2. **Environment variables** configured in `.env` file
3. **Test audio files** (sample bird recordings)

---

## 1. Setup Environment

### Create `.env` file:

```bash
# Database
DATABASE_URL=postgresql://postgres:birdpass123@db:5432/bird-identifier
DB_NAME=bird-identifier
DB_USER=postgres
DB_PASSWORD=birdpass123

# OpenAI API
OPENAI_API_KEY=sk-your-openai-api-key-here

# BirdNET Service
BIRDNET_URL=http://birdnet:8080

# Application
NODE_ENV=development
PORT=3000
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
