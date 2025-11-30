# Bird Identifier Backend

A NestJS backend API for bird identification using image and audio analysis.

## Features

- **Image Identification**: Uses OpenAI Vision API to identify birds from images
- **Audio Identification**: Uses BirdNET-Analyzer to identify birds from audio recordings
- **Bird Information**: Comprehensive database of bird species information

## Quick Start (Development)

### Prerequisites
- Node.js 18+
- Python 3.8+ with Flask (`pip install flask`)
- PostgreSQL 15+ running on port 5432

### 1. Setup Environment

Copy and configure the environment file:
```bash
cp .env.example .env
```

Update `.env` with:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/bird-idf-x1
DB_USER=postgres
BIRDNET_URL=http://localhost:8080
OPENAI_API_KEY=your-openai-api-key
```

### 2. Start BirdNET Server

**Option A: Standalone Python Server (Recommended for Development)**

This uses a lightweight mock server for quick testing:

```bash
cd birdnet-service
python birdnet-server.py
```

Server starts on `http://localhost:8080` with mock bird data.

**Option B: Docker with Full BirdNET Model (Production)**

For real bird identification using the ML model:

```bash
docker-compose up birdnet
```

See the [TESTING.md](TESTING.md) file for detailed Docker setup instructions.

### 3. Start NestJS Application

```bash
# Install dependencies
npm install

# Run in development mode
npm run start:dev
```

API runs on `http://localhost:3000`

### 4. Test the System

Check if services are running:

```bash
# BirdNET health check
curl http://localhost:8080/health

# NestJS health check
curl http://localhost:3000/health
```

Test audio identification:

```bash
curl -X POST http://localhost:3000/test/observations/upload-audio \
  -F "file=@path/to/your/audio.wav" \
  -F "latitude=37.7749" \
  -F "longitude=-122.4194" \
  -F "userId=1"
```

See [TEST-UPLOAD.md](TEST-UPLOAD.md) for complete testing guide.

## Deployment Options

### Production Server Deployment

**Using Docker Compose (Recommended):**

```bash
# On your server
git clone https://github.com/The-Aura-apps/BirdIdentifier-Backend.git
cd BirdIdentifier-Backend

# Copy and configure environment
cp .env.production .env
nano .env  # Update OPENAI_API_KEY, DB_PASSWORD, etc.

# Start all services (Database + BirdNET + NestJS)
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Test endpoints
curl http://your-server-ip:3000/health
curl http://your-server-ip:8080/health
```

**Using Standalone (No Docker):**

```bash
# 1. Install dependencies
npm install
pip install flask

# 2. Configure environment
cp .env.production .env
nano .env  # Update with: BIRDNET_URL=http://localhost:8080

# 3. Setup PostgreSQL database
createdb bird-idf-x1

# 4. Start BirdNET server
cd birdnet-service
nohup python birdnet-server.py > birdnet.log 2>&1 &
cd ..

# 5. Build and start NestJS
npm run build
npm run start:prod

# Or use PM2 for process management
pm2 start npm --name "bird-api" -- run start:prod
```

### Docker Compose (All Services)

Start the full stack (NestJS, BirdNET with ML model, PostgreSQL):

```bash
docker-compose up --build -d
```

**Note**: First startup downloads the BirdNET model (~100MB), which takes a few minutes.

### Local Development (Recommended)

1. Run PostgreSQL locally or via Docker
2. Use standalone Python server (`birdnet-service/birdnet-server.py`)
3. Run NestJS with `npm run start:dev`

This is faster for development and doesn't require Docker Desktop.


## API Endpoints

### Test Endpoints (Development)
- `POST /test/observations/upload-audio` - Upload audio file for analysis
- `GET /test/observations/birdnet-health` - Check BirdNET service status
- `GET /test/observations` - List all observations
- `GET /test/observations/:id` - Get specific observation

### Health Check
- `GET /health` - Application health status

### Bird Identification
- `POST /api/identify/image` - Identify bird from image
- `POST /api/identify/audio` - Identify bird from audio recording

## Testing

### Quick Test
```bash
# Test audio upload
curl -X POST http://localhost:3000/test/observations/upload-audio \
  -F "file=@audio.wav" \
  -F "latitude=37.7749" \
  -F "longitude=-122.4194" \
  -F "userId=1"
```

### Full Test Suite
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

See [TESTING.md](TESTING.md) for comprehensive testing documentation.

## Troubleshooting

### BirdNET Connection Error (ECONNREFUSED)

**Check if BirdNET is running:**
```bash
curl http://localhost:8080/health
```

**If not running:**
- Standalone mode: `cd birdnet-service && python birdnet-server.py`
- Docker mode: `docker-compose up birdnet`

**Check BIRDNET_URL in .env:**
- Local development: `BIRDNET_URL=http://localhost:8080`
- Docker: `BIRDNET_URL=http://birdnet:8080`

### Database Connection Error

**Verify PostgreSQL is running:**
```bash
# Check if PostgreSQL is running on port 5432
netstat -an | grep 5432
```

**Verify credentials in .env:**
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/bird-idf-x1
DB_USER=postgres
```

### Python Flask Module Not Found

Install Flask:
```bash
pip install flask
```

### Audio Upload 400 Bad Request

**Ensure all required fields are provided:**
- `file`: Audio file (required)
- `userId`: User ID (required)
- `latitude` and `longitude`: Location coordinates (required)

**Check file format:**
Supported formats: `.wav`, `.mp3`, `.flac`, `.ogg`

## Documentation

- **[QUICK-REFERENCE.md](QUICK-REFERENCE.md)** - Quick commands for deployment and maintenance
- **[SERVER-SETUP.md](SERVER-SETUP.md)** - Complete step-by-step server setup with Docker
- **[CI-CD-SETUP.md](CI-CD-SETUP.md)** - GitHub Actions automatic deployment guide
- **[TESTING.md](TESTING.md)** - Complete testing guide with both standalone and Docker setups
- **[TEST-UPLOAD.md](TEST-UPLOAD.md)** - Quick guide for testing audio uploads

## License

MIT

