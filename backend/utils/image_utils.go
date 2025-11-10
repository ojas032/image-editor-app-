package utils

import (
	"bytes"
	"encoding/binary"
	"fmt"
	"image"
	"image/gif"
	"image/jpeg"
	"image/png"
	"log"

	"github.com/disintegration/imaging"
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

// GetExifOrientation extracts the EXIF orientation flag from a JPEG/HEIC image.
// Returns 1 (no rotation) when the orientation tag is missing or cannot be read.
func GetExifOrientation(data []byte) int {
	// Only JPEG (and some TIFF-derived formats) contain EXIF orientation metadata.
	if len(data) < 4 || data[0] != 0xFF || data[1] != 0xD8 {
		return 1
	}

	offset := 2
	for offset+4 <= len(data) {
		if data[offset] != 0xFF {
			offset++
			continue
		}

		marker := data[offset+1]
		offset += 2

		// APP1 contains EXIF
		if marker == 0xE1 && offset+2 <= len(data) {
			length := int(data[offset])<<8 | int(data[offset+1])
			if length < 8 || offset+length > len(data) {
				break
			}

			exifData := data[offset+2 : offset+length]
			if len(exifData) < 8 || string(exifData[:6]) != "Exif\x00\x00" {
				offset += length
				continue
			}

			tiff := exifData[6:]
			if len(tiff) < 8 {
				return 1
			}

			var order binary.ByteOrder
			switch string(tiff[:2]) {
			case "II":
				order = binary.LittleEndian
			case "MM":
				order = binary.BigEndian
			default:
				return 1
			}

			if order.Uint16(tiff[2:4]) != 0x002A {
				return 1
			}

			ifdOffset := int(order.Uint32(tiff[4:8]))
			if ifdOffset < 0 || ifdOffset+2 > len(tiff) {
				return 1
			}

			ifd := tiff[ifdOffset:]
			numEntries := int(order.Uint16(ifd[:2]))
			entryOffset := 2

			for i := 0; i < numEntries; i++ {
				if entryOffset+12 > len(ifd) {
					break
				}
				entry := ifd[entryOffset : entryOffset+12]
				tag := order.Uint16(entry[0:2])
				if tag == 0x0112 { // Orientation
					// Orientation tag is a SHORT with count 1; value stored in last 2 bytes.
					orientation := order.Uint16(entry[8:10])
					if orientation >= 1 && orientation <= 8 {
						return int(orientation)
					}
					return 1
				}
				entryOffset += 12
			}
			// Orientation tag not found
			return 1
		}

		if marker == 0xDA || marker == 0xD9 { // SOS or EOI
			break
		}

		if offset+2 > len(data) {
			break
		}

		length := int(data[offset])<<8 | int(data[offset+1])
		if length < 2 || offset+length > len(data) {
			break
		}
		offset += length
	}

	return 1
}

// FixOrientation rotates and/or flips an image according to the EXIF orientation flag.
// Pass in orientation values in the range [1,8]. Any other value returns the source image unchanged.
func FixOrientation(img image.Image, orientation int) image.Image {
	switch orientation {
	case 2:
		return imaging.FlipH(img)
	case 3:
		return imaging.Rotate180(img)
	case 4:
		return imaging.FlipV(img)
	case 5:
		return imaging.FlipH(imaging.Rotate270(img))
	case 6:
		return imaging.Rotate270(img)
	case 7:
		return imaging.FlipH(imaging.Rotate90(img))
	case 8:
		return imaging.Rotate90(img)
	default:
		return img
	}
}
