import sys
import base64
from io import BytesIO
from PIL import Image, ImageFile, ImageDraw
from rembg import remove
import argparse

ImageFile.LOAD_TRUNCATED_IMAGES = True


def get_image_object(image_base_64: str):
    # Decode base64 image
    try:
        # Clean and pad the base64 string
        image_base_64 = image_base_64.replace('-', '+').replace('_', '/') # Handle URL-safe base64
        image_base_64 = image_base_64.strip() # Remove any whitespace
        padding_needed = len(image_base_64) % 4
        if padding_needed != 0:
            image_base_64 += '=' * (4 - padding_needed)
        img_bytes = base64.b64decode(image_base_64)
        img_input = Image.open(BytesIO(img_bytes))
        return img_input
    except base64.binascii.Error as ex:
        print(f"Base64 decoding error in get_image_object: {ex}", file=sys.stderr)
        sys.exit(1)
    except Exception as ex:
        print(f"General error in get_image_object: {ex}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Change image background.")
    parser.add_argument("input_base64", help="Base64 encoded input image.")
    parser.add_argument("--background-image", help="Base64 encoded new background image.")
    parser.add_argument("--solid-color", help="Solid background color in R,G,B format (e.g., '255,0,0').")
    parser.add_argument("--remove-only", action="store_true", help="Only remove background without replacing it.")

    args = parser.parse_args()

    # Validate arguments
    if not args.remove_only and not args.background_image and not args.solid_color:
        print("Error: Either --remove-only, --background-image, or --solid-color must be provided.", file=sys.stderr)
        sys.exit(1)

    try:
        img_input = get_image_object(args.input_base64)
        file_format = img_input.format
        img_input = img_input.convert('RGBA')
        bg_removed_img = remove(img_input)

        # If only removing background, output transparent PNG
        if args.remove_only:
            buffered = BytesIO()
            bg_removed_img.save(buffered, format="PNG")
            output_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
            print(output_base64)
        else:
            # Change background
            if args.background_image:
                input_bg_img = get_image_object(args.background_image)
                input_bg_img = input_bg_img.convert('RGBA')
                input_bg_img = input_bg_img.resize(bg_removed_img.size)
            elif args.solid_color:
                r, g, b = map(int, args.solid_color.split(','))
                solid_color_img = Image.new('RGBA', bg_removed_img.size, (r, g, b, 255))
                input_bg_img = solid_color_img

            combined = Image.alpha_composite(input_bg_img, bg_removed_img).convert("RGB")

            buffered = BytesIO()
            if file_format and file_format.upper() == 'JPEG':
                combined.save(buffered, format="JPEG", quality=95)
            else:
                combined.save(buffered, format="PNG") # Default to PNG for better quality with transparency

            output_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
            print(output_base64)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


