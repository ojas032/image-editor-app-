#!/usr/bin/env python3
"""
Optimized image processing HTTP server for low-resource environments.
Uses lazy loading and process priority adjustments for Oracle free tier.
"""

import sys
import os
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
from io import BytesIO
from PIL import Image, ImageFile

# Set lower process priority to avoid starving Go backend
try:
    os.nice(10)  # Lower priority (higher nice value)
except:
    pass

ImageFile.LOAD_TRUNCATED_IMAGES = True

app = Flask(__name__)
CORS(app)

# Max content length (50MB - reduced for free tier)
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024

# Lazy load rembg only when needed (saves memory and startup time)
_rembg_loaded = False
_remove_func = None

def load_rembg():
    """Lazy load rembg library only when actually needed."""
    global _rembg_loaded, _remove_func
    if not _rembg_loaded:
        print("Loading rembg library (first use)...", file=sys.stderr)
        from rembg import remove
        _remove_func = remove
        _rembg_loaded = True
    return _remove_func


def get_image_object(image_base64: str):
    """Decode base64 image string and return PIL Image object."""
    try:
        image_base64 = image_base64.replace('-', '+').replace('_', '/')
        image_base64 = image_base64.strip()
        padding_needed = len(image_base64) % 4
        if padding_needed != 0:
            image_base64 += '=' * (4 - padding_needed)
        img_bytes = base64.b64decode(image_base64)
        img_input = Image.open(BytesIO(img_bytes))
        
        # Limit max size to reduce CPU usage
        max_size = (2048, 2048)
        if img_input.size[0] > max_size[0] or img_input.size[1] > max_size[1]:
            img_input.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        return img_input
    except Exception as ex:
        raise Exception(f"Failed to decode image: {ex}")


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({"status": "ok", "rembg_loaded": _rembg_loaded}), 200


@app.route('/remove_background', methods=['POST'])
def remove_background():
    """Remove background from image."""
    try:
        remove_func = load_rembg()  # Load on first use
        
        data = request.json
        if not data or 'image_base64' not in data:
            return jsonify({"success": False, "error": "image_base64 is required"}), 400
        
        img_input = get_image_object(data['image_base64'])
        img_input = img_input.convert('RGBA')
        
        # Use lower quality for faster processing on free tier
        bg_removed_img = remove_func(img_input)
        
        buffered = BytesIO()
        # Optimize PNG compression for smaller output
        bg_removed_img.save(buffered, format="PNG", optimize=True, compress_level=6)
        output_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
        
        return jsonify({
            "success": True,
            "image_base64": output_base64,
            "format": "png"
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/change_background', methods=['POST'])
def change_background():
    """Remove background and replace it with new background."""
    try:
        remove_func = load_rembg()  # Load on first use
        
        data = request.json
        if not data or 'image_base64' not in data:
            return jsonify({"success": False, "error": "image_base64 is required"}), 400
        
        if 'new_background_image_base64' not in data and 'solid_color' not in data:
            return jsonify({
                "success": False, 
                "error": "Either new_background_image_base64 or solid_color must be provided"
            }), 400
        
        img_input = get_image_object(data['image_base64'])
        file_format = img_input.format
        img_input = img_input.convert('RGBA')
        bg_removed_img = remove_func(img_input)
        
        if 'new_background_image_base64' in data and data['new_background_image_base64']:
            input_bg_img = get_image_object(data['new_background_image_base64'])
            input_bg_img = input_bg_img.convert('RGBA')
            input_bg_img = input_bg_img.resize(bg_removed_img.size, Image.Resampling.LANCZOS)
        elif 'solid_color' in data and data['solid_color']:
            r, g, b = map(int, data['solid_color'].split(','))
            solid_color_img = Image.new('RGBA', bg_removed_img.size, (r, g, b, 255))
            input_bg_img = solid_color_img
        else:
            raise Exception("Either new_background_image_base64 or solid_color must be provided")
        
        combined = Image.alpha_composite(input_bg_img, bg_removed_img).convert("RGB")
        
        buffered = BytesIO()
        output_format = "JPEG"
        if file_format and file_format.upper() in ['JPEG', 'JPG']:
            output_format = "JPEG"
        
        # Use lower quality for smaller files and faster processing
        combined.save(buffered, format=output_format, quality=85, optimize=True)
        
        output_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
        return jsonify({
            "success": True,
            "image_base64": output_base64,
            "format": output_format.lower()
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5001
    
    print(f"Starting optimized image server on port {port} (low CPU mode)", file=sys.stderr)
    print(f"Process priority adjusted for free tier usage", file=sys.stderr)
    
    # Use threading mode with single thread for low resource usage
    app.run(
        host='0.0.0.0',
        port=port,
        debug=False,
        threaded=True,  # Use threading instead of processes
        processes=1      # Single process only
    )

