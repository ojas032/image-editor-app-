package main

import (
	"log"

	"image-editor-app/backend/server"
)

func main() {
	router := server.SetupRouter()
	port := ":8080"
	log.Printf("Server starting on port %s", port)
	if err := router.Run(port); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}