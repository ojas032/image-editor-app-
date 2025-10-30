package handlers

import (
	"net/http"

	"image-editor-app/backend/models"
	"image-editor-app/backend/services"

	"github.com/gin-gonic/gin"
)

// Helper function for min (Go 1.21+ has built-in, but for broader compatibility)
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// ResizeImage handles image resizing requests.
func ResizeImage(c *gin.Context) {
	var req models.ResizeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resizedImageBase64, err := services.ResizeImage(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"resized_image_base64": resizedImageBase64})
}

// CropImage handles image cropping requests.
func CropImage(c *gin.Context) {
	var req models.CropRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	croppedImageBase64, err := services.CropImage(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"cropped_image_base64": croppedImageBase64})
}

// UpscaleImage handles image upscaling requests.
func UpscaleImage(c *gin.Context) {
	var req models.UpscaleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	upscaledImageBase64, err := services.UpscaleImage(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"upscaled_image_base64": upscaledImageBase64})
}

// ConvertImage handles image conversion requests.
func ConvertImage(c *gin.Context) {
	var req models.ConvertRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	convertedImageBase64, err := services.ConvertImage(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"converted_image_base64": convertedImageBase64})
}

// BlurImage handles image blurring requests for specific regions.
func BlurImage(c *gin.Context) {
	var req models.BlurRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	blurredImageBase64, err := services.BlurImage(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"blurred_image_base64": blurredImageBase64})
}

// RemoveBackground handles image background removal requests.
func RemoveBackground(c *gin.Context) {
	var req models.RemoveBackgroundRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	removedBgImageBase64, format, err := services.RemoveBackground(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"image_without_background_base64": removedBgImageBase64,
		"format":                          format,
	})
}

// ChangeBackground handles image background change requests.
func ChangeBackground(c *gin.Context) {
	var req models.ChangeBackgroundRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	changedBgImageBase64, format, err := services.ChangeBackground(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Return JSON with format information
	c.JSON(http.StatusOK, gin.H{
		"image_base64": changedBgImageBase64,
		"format":       format,
	})
}

// CompressImage handles image compression requests.
func CompressImage(c *gin.Context) {
	var req models.CompressRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	compressedImageBase64, err := services.CompressImage(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"compressed_image_base64": compressedImageBase64})
}
