#!/usr/bin/env python3
"""
Custom BirdNET-Analyzer API Server
Provides a REST API for bird audio identification
"""

import os
import sys
import tempfile
import logging
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import numpy as np

# Add current directory to path to find BirdNET modules
sys.path.append(os.path.dirname(__file__))

# Import BirdNET modules (these are from the cloned repository)
try:
    import config as cfg
    import audio
    import model
except ImportError as e:
    print(f"ERROR: Could not import BirdNET modules: {e}")
    print(f"Current directory: {os.getcwd()}")
    print(f"Files in directory: {os.listdir('.')}")
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Supported audio formats
ALLOWED_EXTENSIONS = {'wav', 'mp3', 'flac', 'ogg', 'm4a', 'aac', 'mp4'}

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def load_model():
    """Load the BirdNET model"""
    logger.info("Loading BirdNET model...")
    try:
        # Use default BirdNET configuration
        cfg.MODEL_PATH = 'checkpoints/V2.4/BirdNET_GLOBAL_6K_V2.4_Model'
        cfg.LABELS_FILE = 'checkpoints/V2.4/BirdNET_GLOBAL_6K_V2.4_Labels.txt'
        cfg.LATITUDE = -1
        cfg.LONGITUDE = -1
        cfg.WEEK = -1
        cfg.SIG_LENGTH = 3.0
        cfg.SIG_OVERLAP = 0.0
        cfg.SIG_MINLEN = 1.0
        cfg.SAMPLE_RATE = 48000
        cfg.SIG_FMIN = 0
        cfg.SIG_FMAX = 15000
        cfg.BANDPASS_FMIN = 0
        cfg.BANDPASS_FMAX = 15000
        
        # Load the model
        model.loadModel()
        
        logger.info(f"Model loaded successfully. Total species: {len(cfg.LABELS)}")
        return True
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}", exc_info=True)
        return False

# Load model on startup
MODEL_LOADED = load_model()

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy' if MODEL_LOADED else 'unhealthy',
        'model_loaded': MODEL_LOADED,
        'version': '2.4',
        'total_species': len(cfg.LABELS) if MODEL_LOADED else 0
    }), 200 if MODEL_LOADED else 503

@app.route('/analyze', methods=['POST'])
def analyze():
    """Analyze audio file for bird species"""
    
    if not MODEL_LOADED:
        return jsonify({'error': 'Model not loaded'}), 503
    
    # Check if audio file is in request
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
    
    file = request.files['audio']
    
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': f'Invalid file format. Allowed: {ALLOWED_EXTENSIONS}'}), 400
    
    # Get optional parameters
    try:
        min_conf = float(request.form.get('min_conf', 0.1))
        lat = float(request.form.get('lat', -1))
        lon = float(request.form.get('lon', -1))
        week = int(request.form.get('week', -1))
    except ValueError as e:
        return jsonify({'error': f'Invalid parameter value: {str(e)}'}), 400
    
    # Save uploaded file temporarily
    temp_path = None
    try:
        # Create temp file with proper extension
        suffix = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
            temp_path = tmp_file.name
            file.save(temp_path)
        
        logger.info(f"Processing audio file: {file.filename} (size: {os.path.getsize(temp_path)} bytes, min_conf={min_conf})")
        
        # Update config with location if provided
        if lat != -1 and lon != -1:
            cfg.LATITUDE = lat
            cfg.LONGITUDE = lon
            cfg.WEEK = week
            logger.info(f"Using location: lat={lat}, lon={lon}, week={week}")
        
        # Analyze audio file
        detections = analyze_audio_file(temp_path, min_conf)
        
        logger.info(f"Analysis complete. Found {len(detections)} detections")
        
        return jsonify({
            'success': True,
            'file': file.filename,
            'results': detections,
            'total_detections': len(detections)
        }), 200
        
    except Exception as e:
        logger.error(f"Error analyzing audio: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500
        
    finally:
        # Clean up temp file
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except Exception as e:
                logger.warning(f"Could not delete temp file {temp_path}: {e}")

def analyze_audio_file(file_path, min_conf=0.1):
    """
    Analyze audio file and return bird detections
    
    Args:
        file_path: Path to audio file
        min_conf: Minimum confidence threshold
        
    Returns:
        List of detections with scientific names and confidence scores
    """
    detections = []
    
    try:
        # Open audio file
        logger.info(f"Opening audio file: {file_path}")
        sig, rate = audio.openAudioFile(file_path, cfg.SAMPLE_RATE)
        
        # Split audio into chunks
        chunks = audio.splitSignal(sig, rate, cfg.SIG_LENGTH, cfg.SIG_OVERLAP, cfg.SIG_MINLEN)
        
        logger.info(f"Split audio into {len(chunks)} chunks")
        
        # Process each chunk
        for chunk_index, chunk in enumerate(chunks):
            
            # Get prediction
            p = model.predict(chunk)
            
            # Get top predictions above threshold
            p_filtered = [(i, p[i]) for i in range(len(p)) if p[i] >= min_conf]
            p_sorted = sorted(p_filtered, key=lambda x: x[1], reverse=True)
            
            # Add detections from this chunk
            for label_index, confidence in p_sorted[:5]:  # Top 5 per chunk
                
                # Get label (scientific name)
                label = cfg.LABELS[label_index]
                
                # Parse label (format: "Scientific Name_Common Name")
                if '_' in label:
                    scientific_name, common_name = label.split('_', 1)
                else:
                    scientific_name = label
                    common_name = label
                
                # Calculate time window
                start_time = chunk_index * (cfg.SIG_LENGTH - cfg.SIG_OVERLAP)
                end_time = start_time + cfg.SIG_LENGTH
                
                detections.append({
                    'start': round(start_time, 2),
                    'end': round(end_time, 2),
                    'scientific_name': scientific_name,
                    'common_name': common_name,
                    'confidence': round(float(confidence), 4)
                })
        
        # Sort by confidence
        detections.sort(key=lambda x: x['confidence'], reverse=True)
        
        # Remove duplicates (keep highest confidence)
        seen = set()
        unique_detections = []
        for d in detections:
            if d['scientific_name'] not in seen:
                seen.add(d['scientific_name'])
                unique_detections.append(d)
        
        return unique_detections
        
    except Exception as e:
        logger.error(f"Error in analyze_audio_file: {str(e)}", exc_info=True)
        raise

@app.route('/species', methods=['GET'])
def get_species_list():
    """Get list of all bird species the model can identify"""
    if not MODEL_LOADED:
        return jsonify({'error': 'Model not loaded'}), 503
    
    species_list = []
    for label in cfg.LABELS:
        if '_' in label:
            scientific_name, common_name = label.split('_', 1)
            species_list.append({
                'scientific_name': scientific_name,
                'common_name': common_name
            })
    
    return jsonify({
        'total_species': len(species_list),
        'species': species_list
    }), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    host = os.environ.get('HOST', '0.0.0.0')
    
    logger.info(f"Starting BirdNET API server on {host}:{port}")
    logger.info(f"Working directory: {os.getcwd()}")
    app.run(host=host, port=port, debug=False, threaded=True)