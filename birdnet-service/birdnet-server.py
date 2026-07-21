#!/usr/bin/env python3
"""
BirdNET-Analyzer Server
Real bird identification from audio using BirdNET deep learning model
"""

from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import os
import tempfile
import logging
from birdnetlib import Recording
from birdnetlib.analyzer import Analyzer
from datetime import datetime

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize BirdNET Analyzer
analyzer = None

def initialize_analyzer():
    """Initialize BirdNET analyzer with model"""
    global analyzer
    try:
        logger.info("Initializing BirdNET Analyzer...")
        analyzer = Analyzer()
        logger.info("BirdNET Analyzer initialized successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to initialize BirdNET: {e}")
        return False

@app.route('/health', methods=['GET'])
def health():
    """Health check"""
    model_loaded = analyzer is not None
    return jsonify({
        'status': 'healthy' if model_loaded else 'initializing',
        'model_loaded': model_loaded,
        'version': '2.0-birdnet-analyzer'
    }), 200

@app.route('/analyze', methods=['POST'])
def analyze():
    """Analyze audio file with BirdNET"""
    
    if analyzer is None:
        return jsonify({'error': 'BirdNET model not loaded'}), 503
    
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
    
    file = request.files['audio']
    
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400
    
    # Get minimum confidence threshold (default 0.1)
    try:
        min_conf = float(request.form.get('min_conf', 0.1))
    except (TypeError, ValueError):
        return jsonify({'error': 'Invalid min_conf value, must be a number'}), 400

    logger.info(f"Received audio file: {file.filename} (min_conf: {min_conf})")
    
    temp_path = None
    try:
        # Save audio file temporarily (sanitize client-supplied filename to prevent path traversal)
        safe_filename = secure_filename(file.filename)
        suffix = os.path.splitext(safe_filename)[1] or '.wav'
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            temp_path = tmp.name
            file.save(temp_path)
        
        file_size = os.path.getsize(temp_path)
        logger.info(f"Saved to {temp_path} ({file_size} bytes)")
        
        # Analyze with BirdNET
        recording = Recording(
            analyzer,
            temp_path,
            min_conf=min_conf,
        )
        recording.analyze()
        
        # Get detections
        detections = recording.detections
        
        if not detections:
            logger.info("No birds detected in audio")
            return jsonify({
                'success': True,
                'file': file.filename,
                'results': [],
                'total_detections': 0
            }), 200
        
        # Format results
        results = []
        for detection in detections:
            results.append({
                'start': detection['start_time'],
                'end': detection['end_time'],
                'scientific_name': detection['scientific_name'],
                'common_name': detection['common_name'],
                'confidence': detection['confidence']
            })
        
        # Sort by confidence (highest first)
        results.sort(key=lambda x: x['confidence'], reverse=True)
        
        logger.info(f"Detected {len(results)} bird(s). Top result: {results[0]['scientific_name']} ({results[0]['confidence']:.2f})")
        
        return jsonify({
            'success': True,
            'file': file.filename,
            'results': results,
            'total_detections': len(results)
        }), 200
        
    except Exception as e:
        logger.error(f"Analysis error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500
    finally:
        # Clean up temp file
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except Exception as e:
                logger.warning(f"Failed to delete temp file: {e}")

print("=" * 50)
print("BirdNET-Analyzer Server")
print("=" * 50)
print("Initializing BirdNET model...")

if not initialize_analyzer():
    print("ERROR: Failed to initialize BirdNET!")
    print("Server will start but /analyze endpoint will not work")
else:
    print("✓ BirdNET model loaded successfully")

print("=" * 50)
print("Server running on http://0.0.0.0:8080")
print("Health check: http://localhost:8080/health")
print("Analyze endpoint: POST http://localhost:8080/analyze")
print("=" * 50)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=False)