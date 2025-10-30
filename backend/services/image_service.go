package services

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"image"
	"image/color"
	"image/draw"

	"image-editor-app/backend/models"
	"image-editor-app/backend/utils" // Import the new utils package

	"github.com/disintegration/imaging"
)

// Predefined social media image sizes
var presets = map[string]struct{ Width, Height int }{
	"youtube_thumbnail":    {Width: 1280, Height: 720},
	"instagram_story":      {Width: 1080, Height: 1920},
	"instagram_post_cover": {Width: 1080, Height: 1080},
	"twitter_post":         {Width: 1200, Height: 675},
	"facebook_story":       {Width: 1080, Height: 1920},
	"facebook_post":        {Width: 1200, Height: 630},
}

// ResizeImage processes an image resize request.
func ResizeImage(req models.ResizeRequest) (string, error) {
	// Decode the base64 image
	imgBytes, err := base64.StdEncoding.DecodeString(req.ImageBase64)
	if err != nil {
		return "", fmt.Errorf("failed to decode base64 image: %w", err)
	}

	// Decode the image
	img, format, err := image.Decode(bytes.NewReader(imgBytes))
	if err != nil {
		return "", fmt.Errorf("failed to decode image: %w", err)
	}

	targetWidth := req.Width
	targetHeight := req.Height

	// Apply preset if provided
	if req.Preset != "" {
		if p, ok := presets[req.Preset]; ok {
			targetWidth = p.Width
			targetHeight = p.Height
		} else {
			return "", fmt.Errorf("invalid preset: %s", req.Preset)
		}
	}

	if targetWidth == 0 && targetHeight == 0 {
		return "", fmt.Errorf("either width/height or a valid preset must be provided")
	}

	// Resize the image
	resizedImg := imaging.Resize(img, targetWidth, targetHeight, imaging.Lanczos)

	// Encode the resized image back to base64
	var buf bytes.Buffer
	err = utils.EncodeImage(resizedImg, format, &buf)

	if err != nil {
		return "", fmt.Errorf("failed to encode resized image: %w", err)
	}

	return base64.StdEncoding.EncodeToString(buf.Bytes()), nil
}

// UpscaleImage processes an image upscale request.
func UpscaleImage(req models.UpscaleRequest) (string, error) {
	// Decode the base64 image
	imgBytes, err := base64.StdEncoding.DecodeString(req.ImageBase64)
	if err != nil {
		return "", fmt.Errorf("failed to decode base64 image: %w", err)
	}

	// Decode the image
	img, format, err := image.Decode(bytes.NewReader(imgBytes))
	if err != nil {
		return "", fmt.Errorf("failed to decode image: %w", err)
	}

	// Calculate new dimensions
	originalWidth := img.Bounds().Dx()
	originalHeight := img.Bounds().Dy()
	targetWidth := int(float64(originalWidth) * req.ScaleFactor)
	targetHeight := int(float64(originalHeight) * req.ScaleFactor)

	// Upscale the image
	upscaledImg := imaging.Resize(img, targetWidth, targetHeight, imaging.Lanczos)

	// Encode the upscaled image back to base64
	var buf bytes.Buffer
	err = utils.EncodeImage(upscaledImg, format, &buf)
	if err != nil {
		return "", fmt.Errorf("failed to encode upscaled image: %w", err)
	}

	return base64.StdEncoding.EncodeToString(buf.Bytes()), nil
}

// ConvertImage processes an image conversion request.
func ConvertImage(req models.ConvertRequest) (string, error) {
	// Decode the base64 image
	imgBytes, err := base64.StdEncoding.DecodeString(req.ImageBase64)
	if err != nil {
		return "", fmt.Errorf("failed to decode base64 image: %w", err)
	}

	// Decode the image to get the image.Image. The original format is not needed here
	// as we are converting to a new format.
	img, _, err := image.Decode(bytes.NewReader(imgBytes))
	if err != nil {
		return "", fmt.Errorf("failed to decode image: %w", err)
	}

	// Encode the image to the target format
	var buf bytes.Buffer
	err = utils.EncodeImage(img, req.Format, &buf)
	if err != nil {
		return "", fmt.Errorf("failed to encode converted image: %w", err)
	}

	return base64.StdEncoding.EncodeToString(buf.Bytes()), nil
}

// BlurImage processes an image blur request for a specific path.
func BlurImage(req models.BlurRequest) (string, error) {
	// Decode the base64 image
	imgBytes, err := base64.StdEncoding.DecodeString(req.ImageBase64)
	if err != nil {
		return "", fmt.Errorf("failed to decode base64 image: %w", err)
	}

	// Decode the image
	img, format, err := image.Decode(bytes.NewReader(imgBytes))
	if err != nil {
		return "", fmt.Errorf("failed to decode image: %w", err)
	}

	// Create a mask image
	bounds := img.Bounds()
	mask := image.NewAlpha(bounds)

	// Draw the path onto the mask
	// For simplicity, we'll draw filled circles around each point in the path.
	// A more sophisticated implementation might draw lines or polygons.
	maskColor := color.Alpha{A: 255} // Fully opaque
	for _, p := range req.Path {
		// Draw a circle around each point. The radius of this circle can be adjusted.
		// For now, let's use a fixed small radius, or potentially link it to blur radius.
		// Using a small square for simplicity.
		size := 10 // Size of the square to draw around each point
		for y := max(0, p.Y-size/2); y < min(bounds.Max.Y, p.Y+size/2); y++ {
			for x := max(0, p.X-size/2); x < min(bounds.Max.X, p.X+size/2); x++ {
				mask.Set(x, y, maskColor)
			}
		}
	}

	// Blur the entire image
	fullBlurredImg := imaging.Blur(img, req.Radius)

	// Create a new image to draw the result
	resultImg := image.NewRGBA(bounds)
	draw.Draw(resultImg, bounds, img, bounds.Min, draw.Src) // Draw original image first

	// Overlay the blurred image using the mask
	draw.DrawMask(resultImg, bounds, fullBlurredImg, bounds.Min, mask, bounds.Min, draw.Over)

	// Encode the blurred image back to base64
	var buf bytes.Buffer
	err = utils.EncodeImage(resultImg, format, &buf)
	if err != nil {
		return "", fmt.Errorf("failed to encode blurred image: %w", err)
	}

	return base64.StdEncoding.EncodeToString(buf.Bytes()), nil
}

// Helper functions for min/max (Go 1.21+ has built-in, but for broader compatibility)
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

// CropImage processes an image crop request.
func CropImage(req models.CropRequest) (string, error) {
	// Decode the base64 image
	imgBytes, err := base64.StdEncoding.DecodeString(req.ImageBase64)
	if err != nil {
		return "", fmt.Errorf("failed to decode base64 image: %w", err)
	}

	// Decode the image
	img, format, err := image.Decode(bytes.NewReader(imgBytes))
	if err != nil {
		return "", fmt.Errorf("failed to decode image: %w", err)
	}

	// Define the crop rectangle
	rect := image.Rect(req.X, req.Y, req.X+req.Width, req.Y+req.Height)

	// Crop the image
	croppedImg := imaging.Crop(img, rect)

	// Encode the cropped image back to base64
	var buf bytes.Buffer
	err = utils.EncodeImage(croppedImg, format, &buf)

	if err != nil {
		return "", fmt.Errorf("failed to encode cropped image: %w", err)
	}

	return base64.StdEncoding.EncodeToString(buf.Bytes()), nil
}

// ChangeBackground processes an image background change request using HTTP.
func ChangeBackground(req models.ChangeBackgroundRequest) (string, string, error) {
	client := GetHTTPClient()
	// If transparent flag is set or no replacement provided, just remove background
	if req.Transparent || (req.NewBackgroundImage == "" && req.SolidColor == "") {
		return client.RemoveBackground(req.ImageBase64)
	}
	return client.ChangeBackground(req.ImageBase64, req.NewBackgroundImage, req.SolidColor)
}

// RemoveBackground processes an image background removal request using HTTP.
func RemoveBackground(req models.RemoveBackgroundRequest) (string, string, error) {
	client := GetHTTPClient()
	return client.RemoveBackground(req.ImageBase64)
}

// CompressImage processes an image compression request.
func CompressImage(req models.CompressRequest) (string, error) {
	// Decode the base64 image
	imgBytes, err := base64.StdEncoding.DecodeString(req.ImageBase64)
	if err != nil {
		return "", fmt.Errorf("failed to decode base64 image: %w", err)
	}

	// Decode the image
	img, format, err := image.Decode(bytes.NewReader(imgBytes))
	if err != nil {
		return "", fmt.Errorf("failed to decode image: %w", err)
	}

	// Determine output format
	outputFormat := format
	if req.Format != nil {
		outputFormat = *req.Format
	}

	// Resize if needed
	if req.MaxWidth != nil || req.MaxHeight != nil {
		bounds := img.Bounds()
		originalWidth := bounds.Dx()
		originalHeight := bounds.Dy()
		newWidth := originalWidth
		newHeight := originalHeight

		// Calculate new dimensions maintaining aspect ratio
		if req.MaxWidth != nil && originalWidth > *req.MaxWidth {
			ratio := float64(*req.MaxWidth) / float64(originalWidth)
			newWidth = *req.MaxWidth
			newHeight = int(float64(originalHeight) * ratio)
		}

		if req.MaxHeight != nil && newHeight > *req.MaxHeight {
			ratio := float64(*req.MaxHeight) / float64(newHeight)
			newHeight = *req.MaxHeight
			newWidth = int(float64(newWidth) * ratio)
		}

		// Resize only if dimensions changed
		if newWidth != originalWidth || newHeight != originalHeight {
			img = imaging.Resize(img, newWidth, newHeight, imaging.Lanczos)
		}
	}

	// Encode the compressed image back to base64 with quality options
	var buf bytes.Buffer
	err = utils.EncodeImageWithQuality(img, outputFormat, &buf, req.Quality)
	if err != nil {
		return "", fmt.Errorf("failed to encode compressed image: %w", err)
	}

	return base64.StdEncoding.EncodeToString(buf.Bytes()), nil
}
