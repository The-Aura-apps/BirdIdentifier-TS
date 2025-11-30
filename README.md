# Bird Identifier Backend

A NestJS backend API for bird identification using image and audio analysis.

## Features

- **Image Identification**: Uses OpenAI Vision API to identify birds from images
- **Audio Identification**: Uses BirdNET-Analyzer to identify birds from audio recordings
- **Bird Information**: Comprehensive database of bird species information

## Prerequisites

- Node.js 18+
- Docker and Docker Compose (for containerized deployment)
- PostgreSQL 15+ (or use Docker)

## Environment Setup

1. Copy the environment example file:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your configuration:
   - `DATABASE_URL`: PostgreSQL connection string
   - `OPENAI_API_KEY`: Your OpenAI API key for image identification
   - `BIRDNET_URL`: BirdNET service URL (see below)

## Running the Application

### Option 1: Docker Compose (Recommended)

This starts all services (NestJS app, BirdNET, and PostgreSQL):

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

**Note**: The BirdNET service may take a few minutes to start as it downloads the ML model.

### Option 2: Local Development

#### 1. Start BirdNET Service

Option A - Using Docker (recommended):
```bash
# Build and run only the BirdNET service
docker-compose up birdnet
```

Option B - Run BirdNET locally:
```bash
# Clone BirdNET-Analyzer
git clone https://github.com/birdnet-team/BirdNET-Analyzer.git
cd BirdNET-Analyzer

# Install dependencies
pip install librosa numpy resampy Flask tensorflow tensorflow-hub werkzeug

# Download model (optional, BirdNET may download automatically)
mkdir -p checkpoints/V2.4
cd checkpoints/V2.4
wget https://github.com/kahst/BirdNET-Analyzer/releases/download/v2.4/BirdNET_GLOBAL_6K_V2.4_Model.tflite -O BirdNET_GLOBAL_6K_V2.4_Model
wget https://github.com/kahst/BirdNET-Analyzer/releases/download/v2.4/BirdNET_GLOBAL_6K_V2.4_Labels.txt

# Copy server script and run
cp /path/to/this/repo/birdnet-server.py server.py
python server.py
```

#### 2. Configure Environment

For local development, set in `.env`:
```
BIRDNET_URL=http://localhost:8080
```

For Docker deployment:
```
BIRDNET_URL=http://birdnet:8080
```

#### 3. Start NestJS Application

```bash
# Install dependencies
npm install

# Run in development mode
npm run start:dev

# Or build and run in production mode
npm run build
npm run start:prod
```

## API Endpoints

### Health Check
- `GET /health` - Application health status

### Bird Identification
- `POST /api/identify/image` - Identify bird from image
- `POST /api/identify/audio` - Identify bird from audio recording

### BirdNET Service Health
```bash
curl http://localhost:8080/health
```

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Troubleshooting

### ENOTFOUND birdnet error
This error occurs when the NestJS app can't reach the BirdNET service:

1. **Check if BirdNET is running**:
   ```bash
   curl http://localhost:8080/health
   ```

2. **Check your BIRDNET_URL**:
   - Local development: `BIRDNET_URL=http://localhost:8080`
   - Docker: `BIRDNET_URL=http://birdnet:8080`

3. **Check Docker network**:
   ```bash
   docker network ls
   docker network inspect birdidentifier-backend_bird-network
   ```

### BirdNET model not loaded
If health check returns `model_loaded: false`:

1. Check if model files exist in the container:
   ```bash
   docker exec birdnet-analyzer ls -la checkpoints/V2.4/
   ```

2. Check BirdNET logs:
   ```bash
   docker logs birdnet-analyzer
   ```

## License

MIT
