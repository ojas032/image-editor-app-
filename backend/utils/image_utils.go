package utils

import (
	"bytes"
	"fmt"
	"image"
	"image/gif"
	"image/jpeg"
	"image/png"
	"log"

	"golang.org/x/image/bmp"  // Import for BMP support
	"golang.org/x/image/tiff" // Import for TIFF support

	_ "golang.org/x/image/webp" // Import for WebP support
)

// EncodeImage encodes an image into the specified format and writes it to a bytes.Buffer.
// It returns an error if encoding fails.
func EncodeImage(img image.Image, format string, buf *bytes.Buffer) error {
	return EncodeImageWithQuality(img, format, buf, nil)
}

// EncodeImageWithQuality encodes an image into the specified format with quality settings.
// quality parameter is used for JPEG (1-100, higher is better quality).
func EncodeImageWithQuality(img image.Image, format string, buf *bytes.Buffer, quality *int) error {
	var err error

	// Default quality for JPEG
	jpegQuality := 85
	if quality != nil && *quality >= 1 && *quality <= 100 {
		jpegQuality = *quality
	}

	switch format {
	case "jpeg":
		options := &jpeg.Options{Quality: jpegQuality}
		err = jpeg.Encode(buf, img, options)
	case "png":
		err = png.Encode(buf, img)
	case "gif":
		err = gif.Encode(buf, img, nil)
	case "bmp":
		err = bmp.Encode(buf, img)
	case "tiff":
		err = tiff.Encode(buf, img, nil)
	case "webp":
		// WebP encoding is not directly supported by the standard library.
		// For simplicity, we'll default to JPEG for now if WebP is the input format
		// and no specific WebP encoder is integrated.
		log.Printf("Warning: WebP format detected, encoding as JPEG. Consider adding a WebP encoder for full support.")
		options := &jpeg.Options{Quality: jpegQuality}
		err = jpeg.Encode(buf, img, options)
	case "heic", "heif":
		// HEIC/HEIF encoding is not commonly supported in Go libraries for writing.
		// Convert to JPEG as a high-quality alternative
		log.Printf("Info: Converting HEIC to JPEG format for output (HEIC encoding not supported)")
		options := &jpeg.Options{Quality: jpegQuality}
		err = jpeg.Encode(buf, img, options)
	default:
		log.Printf("Warning: Unknown image format '%s', encoding as JPEG.", format)
		options := &jpeg.Options{Quality: jpegQuality}
		err = jpeg.Encode(buf, img, options)
	}
	if err != nil {
		return fmt.Errorf("failed to encode image to %s: %w", format, err)
	}
	return nil
}
