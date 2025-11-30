FROM python:3.10-slim

WORKDIR /app

# Install dependencies
RUN pip install --no-cache-dir flask

# Copy the server script
COPY birdnet-server.py .

# Expose port
EXPOSE 8080

# Run the server
CMD ["python", "birdnet-server.py"]
