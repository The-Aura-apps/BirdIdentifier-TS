FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for audio processing
RUN apt-get update && apt-get install -y \
    libsndfile1 \
    ffmpeg \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --no-cache-dir \
    flask \
    numpy \
    librosa \
    tensorflow-cpu \
    birdnetlib

# Copy the server script
COPY birdnet-server.py .

# Download BirdNET model (will be cached in the image)
RUN mkdir -p /app/models

# Expose port
EXPOSE 8080

# Run the server
CMD ["python", "birdnet-server.py"]
