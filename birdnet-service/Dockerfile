FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libsndfile1 \
    ffmpeg \
    wget \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY birdnet-server.py .

RUN mkdir -p /app/models

EXPOSE 8080

CMD ["gunicorn", "--workers", "2", "--bind", "0.0.0.0:8080", "--timeout", "120", "birdnet-server:app"]