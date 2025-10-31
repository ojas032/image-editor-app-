#!/usr/bin/env python3
"""
On-demand background remover - runs once and exits.
No Flask, no continuous server. Called directly by Go backend.
"""

import sys
import json
import base64
from io import BytesIO
from PIL import Image
from rembg import remove


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
        
        # Limit size for free tier
        max_size = (2048, 2048)
        if img_input.size[0] > max_size[0] or img_input.size[1] > max_size[1]:
            img_input.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        return img_input
    except Exception as ex:
        raise Exception(f"Failed to decode image: {ex}")


def remove_background(image_base64: str):
    """Remove background from image."""
    img_input = get_image_object(image_base64)
    img_input = img_input.convert('RGBA')
    bg_removed_img = remove(img_input)
    
    buffered = BytesIO()
    bg_removed_img.save(buffered, format="PNG", optimize=True, compress_level=6)
    output_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
    
    return {
        "success": True,
        "image_base64": output_base64,
        "format": "png"
    }


def change_background(image_base64: str, new_bg_base64=None, solid_color=None):
    """Remove background and replace it with new background."""
    img_input = get_image_object(image_base64)
    file_format = img_input.format
    img_input = img_input.convert('RGBA')
    bg_removed_img = remove(img_input)
    
    if new_bg_base64:
        input_bg_img = get_image_object(new_bg_base64)
        input_bg_img = input_bg_img.convert('RGBA')
        input_bg_img = input_bg_img.resize(bg_removed_img.size, Image.Resampling.LANCZOS)
    elif solid_color:
        r, g, b = map(int, solid_color.split(','))
        solid_color_img = Image.new('RGBA', bg_removed_img.size, (r, g, b, 255))
        input_bg_img = solid_color_img
    else:
        raise Exception("Either new_background or solid_color must be provided")
    
    combined = Image.alpha_composite(input_bg_img, bg_removed_img).convert("RGB")
    
    buffered = BytesIO()
    output_format = "JPEG"
    if file_format and file_format.upper() in ['JPEG', 'JPG']:
        output_format = "JPEG"
    
    combined.save(buffered, format=output_format, quality=85, optimize=True)
    
    output_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
    return {
        "success": True,
        "image_base64": output_base64,
        "format": output_format.lower()
    }


if __name__ == "__main__":
    try:
        # Read JSON input from stdin
        input_data = json.loads(sys.stdin.read())
        
        operation = input_data.get("operation")
        
        if operation == "remove_background":
            result = remove_background(input_data["image_base64"])
        elif operation == "change_background":
            result = change_background(
                input_data["image_base64"],
                input_data.get("new_background_image_base64"),
                input_data.get("solid_color")
            )
        else:
            result = {"success": False, "error": "Unknown operation"}
        
        # Write JSON result to stdout
        print(json.dumps(result))
        sys.exit(0)
        
    except Exception as e:
        error_result = {"success": False, "error": str(e)}
        print(json.dumps(error_result))
        sys.exit(1)

