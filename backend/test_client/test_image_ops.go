package main

import (
	"encoding/base64"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"strings" // Import for strings.NewReader
)

const apiBaseURL = "http://localhost:8080" // Assuming your Go server runs on 8080

func main() {
	if len(os.Args) < 3 {
		fmt.Println("Usage: go run test_image_ops.go <image_url_for_removal> <image_url_for_new_background>")
		return
	}
	imageURLForRemoval := os.Args[1]
	// Using a more reliable placeholder image for the new background
	imageURLForNewBackground := "https://picsum.photos/1200/800"
	if len(os.Args) > 2 {
		imageURLForNewBackground = os.Args[2]
	}

	// --- Test Remove Background ---
	fmt.Println("--- Testing Remove Background ---")
	removedBgBase64, err := processImage(imageURLForRemoval, "/remove-background", `{"image_base64":"%s"}`, "")
	if err != nil {
		fmt.Printf("Error during background removal: %v\n", err)
		return
	}
	fmt.Println("Removed Background Image Base64 (first 100 chars):", removedBgBase64[:100])
	fmt.Println("Full Removed Background Base64 string length:", len(removedBgBase64))

	// --- Test Change Background ---
	fmt.Println("\n--- Testing Change Background ---")
	// Download the new background image
	newBgResp, err := http.Get(imageURLForNewBackground)
	if err != nil {
		fmt.Printf("Error downloading new background image: %v\n", err)
		return
	}
	defer newBgResp.Body.Close()

	if newBgResp.StatusCode != http.StatusOK {
		fmt.Printf("Error: Received non-200 status code %d from %s\n", newBgResp.StatusCode, imageURLForNewBackground)
		return
	}

	newBgImgBytes, err := ioutil.ReadAll(newBgResp.Body)
	if err != nil {
		fmt.Printf("Error reading new background image bytes: %v\n", err)
		return
	}
	newBgImageBase64 := base64.StdEncoding.EncodeToString(newBgImgBytes)

	changedBgBase64, err := processImage(imageURLForRemoval, "/change-background", `{"image_base64":"%s", "new_background_image_base64":"%s"}`, newBgImageBase64)
	if err != nil {
		fmt.Printf("Error during background change: %v\n", err)
		return
	}
	fmt.Println("Changed Background Image Base64 (first 100 chars):", changedBgBase64[:100])
	fmt.Println("Full Changed Background Base64 string length:", len(changedBgBase64))
}

// Helper function to download, encode, and send image to an endpoint
func processImage(imageURL, endpoint, payloadFormat string, extraBase64 string) (string, error) {
	// Download the image
	resp, err := http.Get(imageURL)
	if err != nil {
		return "", fmt.Errorf("error downloading image from %s: %w", imageURL, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("error: received non-200 status code %d from %s", resp.StatusCode, imageURL)
	}

	imgBytes, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("error reading image bytes from %s: %w", imageURL, err)
	}

	// Encode to base64
	imageBase64 := base64.StdEncoding.EncodeToString(imgBytes)

	// Prepare payload
	var payload string
	if extraBase64 != "" {
		payload = fmt.Sprintf(payloadFormat, imageBase64, extraBase64)
	} else {
		payload = fmt.Sprintf(payloadFormat, imageBase64)
	}

	// Send request to the API
	apiURL := apiBaseURL + endpoint
	req, err := http.NewRequest("POST", apiURL, strings.NewReader(payload))
	if err != nil {
		return "", fmt.Errorf("error creating request to %s: %w", apiURL, err)
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	apiResp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("error sending request to %s: %w", apiURL, err)
	}
	defer apiResp.Body.Close()

	if apiResp.StatusCode != http.StatusOK {
		bodyBytes, _ := ioutil.ReadAll(apiResp.Body)
		return "", fmt.Errorf("API call to %s failed with status %d: %s", apiURL, apiResp.StatusCode, string(bodyBytes))
	}

	// Read response
	apiResponseBody, err := ioutil.ReadAll(apiResp.Body)
	if err != nil {
		return "", fmt.Errorf("error reading API response body from %s: %w", apiURL, err)
	}

	// Parse JSON response to extract the base64 string
	// This is a simplified parsing, a real app would use a JSON unmarshaler
	responseString := string(apiResponseBody)
	// Find the key and extract its value
	key := ""
	if endpoint == "/remove-background" {
		key = `"image_without_background_base64":"`
	} else if endpoint == "/change-background" {
		key = `"image_with_new_background_base64":"`
	}

	startIndex := strings.Index(responseString, key)
	if startIndex == -1 {
		return "", fmt.Errorf("could not find key '%s' in API response", key)
	}
	startIndex += len(key)
	endIndex := strings.Index(responseString[startIndex:], `"`)
	if endIndex == -1 {
		return "", fmt.Errorf("could not find end quote for base64 string in API response")
	}

	return responseString[startIndex : startIndex+endIndex], nil
}