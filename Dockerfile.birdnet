FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
  git \
  ffmpeg \
  libsndfile1 \
  && rm -rf /var/lib/apt/lists/*

# Clone BirdNET-Analyzer
RUN git clone https://github.com/birdnet-team/BirdNET-Analyzer.git .

# Install Python dependencies from BirdNET
RUN pip install --no-cache-dir \
    librosa>=0.9.1 \
    numpy \
    resampy \
    Flask \
    tensorflow>=2.5.0 \
    tensorflow-hub

# Create upload directory for audio files
RUN mkdir -p /app/uploads

# Copy custom server script
COPY birdnet-server.py /app/server.py

# Expose port for the server
EXPOSE 8080

# Run the custom server
CMD ["python", "server.py"]