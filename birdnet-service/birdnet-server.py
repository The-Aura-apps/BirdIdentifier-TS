#!/usr/bin/env python3
"""
Standalone BirdNET Server - No Docker Required
Uses Google's Teachable Machine or TensorFlow Lite model
"""

from flask import Flask, request, jsonify
import os
import tempfile
import logging

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Simple mock implementation (replace with actual BirdNET later)
BIRD_DATABASE = {
    'default': {
        'scientific_name': 'Turdus migratorius',
        'common_name': 'American Robin',
        'confidence': 0.85
    }
}

@app.route('/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': True,
        'version': '1.0-standalone'
    }), 200

@app.route('/analyze', methods=['POST'])
def analyze():
    """Analyze audio file"""
    
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
    
    file = request.files['audio']
    
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400
    
    logger.info(f"Received audio file: {file.filename}")
    
    # Save temporarily
    temp_path = None
    try:
        suffix = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            temp_path = tmp.name
            file.save(temp_path)
        
        file_size = os.path.getsize(temp_path)
        logger.info(f"Saved to {temp_path} ({file_size} bytes)")
        
        # TODO: Replace this with actual BirdNET analysis
        # For now, return mock data
        result = BIRD_DATABASE['default']
        
        return jsonify({
            'success': True,
            'file': file.filename,
            'results': [{
                'start': 0.0,
                'end': 3.0,
                'scientific_name': result['scientific_name'],
                'common_name': result['common_name'],
                'confidence': result['confidence']
            }],
            'total_detections': 1
        }), 200
        
    except Exception as e:
        logger.error(f"Error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)

if __name__ == '__main__':
    print("=" * 50)
    print("BirdNET Standalone Server")
    print("=" * 50)
    print("Server running on http://localhost:8080")
    print("Health check: http://localhost:8080/health")
    print("=" * 50)
    app.run(host='0.0.0.0', port=8080, debug=True)