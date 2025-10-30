package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

const (
	// ImageServerURL is the URL of the Python image processing server
	ImageServerURL = "http://localhost:5001"
	// HTTPTimeout is the timeout for HTTP requests
	HTTPTimeout = 60 * time.Second
)

// ImageHTTPClient handles communication with the Python image processing server
type ImageHTTPClient struct {
	client  *http.Client
	baseURL string
}

// RemoveBackgroundRequestPayload for HTTP communication
type RemoveBackgroundRequestPayload struct {
	ImageBase64 string `json:"image_base64"`
}

// ChangeBackgroundRequestPayload for HTTP communication
type ChangeBackgroundRequestPayload struct {
	ImageBase64              string `json:"image_base64"`
	NewBackgroundImageBase64 string `json:"new_background_image_base64,omitempty"`
	SolidColor               string `json:"solid_color,omitempty"`
}

// ImageHTTPResponse from the server
type ImageHTTPResponse struct {
	Success     bool   `json:"success"`
	ImageBase64 string `json:"image_base64,omitempty"`
	Format      string `json:"format,omitempty"`
	Error       string `json:"error,omitempty"`
}

// NewImageHTTPClient creates a new HTTP client
func NewImageHTTPClient() *ImageHTTPClient {
	return &ImageHTTPClient{
		client: &http.Client{
			Timeout: HTTPTimeout,
		},
		baseURL: ImageServerURL,
	}
}

// makeRequest makes an HTTP POST request to the image server
func (c *ImageHTTPClient) makeRequest(endpoint string, payload interface{}) (*ImageHTTPResponse, error) {
	// Marshal payload to JSON
	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	// Create HTTP request
	url := fmt.Sprintf("%s%s", c.baseURL, endpoint)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(payloadJSON))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	// Send request
	resp, err := c.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	// Unmarshal response
	var response ImageHTTPResponse
	err = json.Unmarshal(body, &response)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	if !response.Success {
		return nil, fmt.Errorf("image processing failed: %s", response.Error)
	}

	return &response, nil
}

// RemoveBackground requests background removal
func (c *ImageHTTPClient) RemoveBackground(imageBase64 string) (string, string, error) {
	payload := RemoveBackgroundRequestPayload{
		ImageBase64: imageBase64,
	}

	response, err := c.makeRequest("/remove_background", payload)
	if err != nil {
		return "", "", err
	}

	return response.ImageBase64, response.Format, nil
}

// ChangeBackground requests background replacement
func (c *ImageHTTPClient) ChangeBackground(imageBase64, newBgImage, solidColor string) (string, string, error) {
	payload := ChangeBackgroundRequestPayload{
		ImageBase64: imageBase64,
	}

	if newBgImage != "" {
		payload.NewBackgroundImageBase64 = newBgImage
	} else if solidColor != "" {
		payload.SolidColor = solidColor
	}

	response, err := c.makeRequest("/change_background", payload)
	if err != nil {
		return "", "", err
	}

	return response.ImageBase64, response.Format, nil
}

// singleton instance
var httpClient = NewImageHTTPClient()

// GetHTTPClient returns the singleton HTTP client
func GetHTTPClient() *ImageHTTPClient {
	return httpClient
}
