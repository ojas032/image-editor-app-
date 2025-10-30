#!/usr/bin/env python3
"""
Image processing HTTP server.
Handles background removal and background replacement requests.
"""

import sys
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
from io import BytesIO
from PIL import Image, ImageFile
from rembg import remove

ImageFile.LOAD_TRUNCATED_IMAGES = True

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Max content length (100MB)
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024


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
        return img_input
    except Exception as ex:
        raise Exception(f"Failed to decode image: {ex}")


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({"status": "ok"}), 200


@app.route('/remove_background', methods=['POST'])
def remove_background():
    """Remove background from image."""
    try:
        data = request.json
        if not data or 'image_base64' not in data:
            return jsonify({"success": False, "error": "image_base64 is required"}), 400
        
        img_input = get_image_object(data['image_base64'])
        img_input = img_input.convert('RGBA')
        bg_removed_img = remove(img_input)
        
        buffered = BytesIO()
        bg_removed_img.save(buffered, format="PNG")
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
        bg_removed_img = remove(img_input)
        
        if 'new_background_image_base64' in data and data['new_background_image_base64']:
            input_bg_img = get_image_object(data['new_background_image_base64'])
            input_bg_img = input_bg_img.convert('RGBA')
            input_bg_img = input_bg_img.resize(bg_removed_img.size)
        elif 'solid_color' in data and data['solid_color']:
            r, g, b = map(int, data['solid_color'].split(','))
            solid_color_img = Image.new('RGBA', bg_removed_img.size, (r, g, b, 255))
            input_bg_img = solid_color_img
        else:
            raise Exception("Either new_background_image_base64 or solid_color must be provided")
        
        combined = Image.alpha_composite(input_bg_img, bg_removed_img).convert("RGB")
        
        buffered = BytesIO()
        # For solid color or custom background, use JPEG for better file size
        # Use original format if it was JPEG, otherwise default to JPEG for non-transparent backgrounds
        output_format = "JPEG"
        if file_format and file_format.upper() in ['JPEG', 'JPG']:
            output_format = "JPEG"
        
        combined.save(buffered, format=output_format, quality=95)
        
        output_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
        return jsonify({
            "success": True,
            "image_base64": output_base64,
            "format": output_format.lower()
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    # Default port 5001 to avoid conflicts with Go server
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5001
    
    print(f"Starting image processing server on port {port}", file=sys.stderr)
    app.run(host='localhost', port=port, debug=False)

