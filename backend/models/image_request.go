package models

// ResizeRequest defines the structure for an image resize request.
type ResizeRequest struct {
	ImageBase64 string `json:"image_base64" binding:"required"`
	Width       int    `json:"width"`
	Height      int    `json:"height"`
	Preset      string `json:"preset"` // e.g., "youtube_thumbnail", "instagram_story"
}

// CropRequest defines the structure for an image crop request.
type CropRequest struct {
	ImageBase64 string `json:"image_base64" binding:"required"`
	X           int    `json:"x"`
	Y           int    `json:"y"`
	Width       int    `json:"width"`
	Height      int    `json:"height"`
}

// UpscaleRequest defines the structure for an image upscale request.
type UpscaleRequest struct {
	ImageBase64 string  `json:"image_base64" binding:"required"`
	ScaleFactor float64 `json:"scale_factor" binding:"required"` // e.g., 2.0 for 2x upscale
}

// ConvertRequest defines the structure for an image conversion request.
type ConvertRequest struct {
	ImageBase64 string `json:"image_base64" binding:"required"`
	Format      string `json:"format" binding:"required"` // e.g., "jpeg", "png", "gif"
}

// Point defines a coordinate for drawing paths.
type Point struct {
	X int `json:"x"`
	Y int `json:"y"`
}

// BlurRequest defines the structure for an image blur request with a path.
type BlurRequest struct {
	ImageBase64 string  `json:"image_base64" binding:"required"`
	Path        []Point `json:"path" binding:"required"` // List of points defining the blur path
	Radius      float64 `json:"radius" binding:"required"`  // Blur radius
}

// RemoveBackgroundRequest defines the structure for a background removal request.
type RemoveBackgroundRequest struct {
	ImageBase64 string `json:"image_base64" binding:"required"`
}

// ChangeBackgroundRequest defines the structure for a background change request.
type ChangeBackgroundRequest struct {
	ImageBase64        string `json:"image_base64" binding:"required"`
	NewBackgroundImage string `json:"new_background_image_base64"` // Optional: base64 encoded image
	SolidColor         string `json:"solid_color"`                 // Optional: Solid color in "R,G,B" format (e.g., "255,0,0" for red)
    Transparent        bool   `json:"transparent"`                 // Optional: If true, return transparent PNG (no background)
}

// CompressRequest defines the structure for an image compression request.
type CompressRequest struct {
	ImageBase64 string  `json:"image_base64" binding:"required"`
	Quality     *int    `json:"quality"`     // Optional: JPEG/WebP quality (1-100), default varies by format
	Format      *string `json:"format"`      // Optional: Force output format (jpeg, png, webp, etc.)
	MaxWidth    *int    `json:"max_width"`   // Optional: Resize if width exceeds this
	MaxHeight   *int    `json:"max_height"`  // Optional: Resize if height exceeds this
}