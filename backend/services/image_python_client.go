package services

import (
	"encoding/json"
	"fmt"
	"os/exec"
	"strings"
)

// PythonClient handles direct Python subprocess calls (no Flask server)
type PythonClient struct {
	pythonPath string
	scriptPath string
}

// PythonRequest represents input to Python script
type PythonRequest struct {
	Operation                string `json:"operation"`
	ImageBase64              string `json:"image_base64"`
	NewBackgroundImageBase64 string `json:"new_background_image_base64,omitempty"`
	SolidColor               string `json:"solid_color,omitempty"`
}

// PythonResponse represents output from Python script
type PythonResponse struct {
	Success     bool   `json:"success"`
	ImageBase64 string `json:"image_base64,omitempty"`
	Format      string `json:"format,omitempty"`
	Error       string `json:"error,omitempty"`
}

// NewPythonClient creates a new Python client
func NewPythonClient() *PythonClient {
	// Get the venv python path - on the VM it's at /home/ubuntu/image-editor-app-/venv/bin/python
	pythonPath := "/home/ubuntu/image-editor-app-/venv/bin/python"
	scriptPath := "/home/ubuntu/image-editor-app-/backend/python_scripts/background_remover.py"

	return &PythonClient{
		pythonPath: pythonPath,
		scriptPath: scriptPath,
	}
}

// callPython executes Python script and returns response
func (c *PythonClient) callPython(request PythonRequest) (*PythonResponse, error) {
	// Marshal request to JSON
	requestJSON, err := json.Marshal(request)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	// Execute Python script with JSON input via stdin
	cmd := exec.Command(c.pythonPath, c.scriptPath)
	cmd.Stdin = strings.NewReader(string(requestJSON))

	// Capture output
	output, err := cmd.CombinedOutput()
	if err != nil {
		return nil, fmt.Errorf("python execution failed: %w, output: %s", err, string(output))
	}

	// Parse Python response
	var response PythonResponse
	err = json.Unmarshal(output, &response)
	if err != nil {
		return nil, fmt.Errorf("failed to parse python response: %w, output: %s", err, string(output))
	}

	if !response.Success {
		return nil, fmt.Errorf("python processing failed: %s", response.Error)
	}

	return &response, nil
}

// RemoveBackground removes background using Python script
func (c *PythonClient) RemoveBackground(imageBase64 string) (string, string, error) {
	request := PythonRequest{
		Operation:   "remove_background",
		ImageBase64: imageBase64,
	}

	response, err := c.callPython(request)
	if err != nil {
		return "", "", err
	}

	return response.ImageBase64, response.Format, nil
}

// ChangeBackground changes background using Python script
func (c *PythonClient) ChangeBackground(imageBase64, newBgImage, solidColor string) (string, string, error) {
	request := PythonRequest{
		Operation:                "change_background",
		ImageBase64:              imageBase64,
		NewBackgroundImageBase64: newBgImage,
		SolidColor:               solidColor,
	}

	response, err := c.callPython(request)
	if err != nil {
		return "", "", err
	}

	return response.ImageBase64, response.Format, nil
}

// singleton instance
var pythonClient = NewPythonClient()

// GetPythonClient returns the singleton Python client
func GetPythonClient() *PythonClient {
	return pythonClient
}
