package server

import (
	"image-editor-app/backend/handlers"

	"github.com/gin-contrib/cors" // Import the cors package
	"github.com/gin-gonic/gin"
)

// SetupRouter configures and returns the Gin router.
func SetupRouter() *gin.Engine {
	router := gin.Default()

	// Configure CORS middleware
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true // Allow requests from all origins
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	router.Use(cors.New(config))

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Image resizing endpoint
	router.POST("/resize", handlers.ResizeImage)

	// Image cropping endpoint
	router.POST("/crop", handlers.CropImage)

	// Image upscaling endpoint
	router.POST("/upscale", handlers.UpscaleImage)

	// Image conversion endpoint
	router.POST("/convert", handlers.ConvertImage)

	// Image blur endpoint
	router.POST("/blur", handlers.BlurImage)

	// Image background removal endpoint
	router.POST("/remove-background", handlers.RemoveBackground)

	// Image change background endpoint
	router.POST("/change-background", handlers.ChangeBackground)

	// Image compression endpoint
	router.POST("/compress", handlers.CompressImage)

	return router
}
