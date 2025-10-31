.PHONY: help setup deps run stop restart clean clean-venv build test

# Variables
GO_BACKEND_PORT = 8080
BACKEND_DIR = backend

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-15s %s\n", $$1, $$2}'

deps: ## Install Go dependencies
	@echo "Installing Go dependencies..."
	@cd $(BACKEND_DIR) && go mod download
	@echo "✓ Go dependencies installed"

setup: ## Install all dependencies (Python and Go)
	@echo "Installing system dependencies (if needed)..."
	@if command -v apt-get >/dev/null 2>&1; then \
		echo "Ubuntu/Debian detected - install with: sudo apt-get install -y python3-dev libjpeg-dev zlib1g-dev"; \
	elif command -v yum >/dev/null 2>&1; then \
		echo "RHEL/CentOS detected - install with: sudo yum install -y python3-devel libjpeg-devel zlib-devel"; \
	fi
	@echo ""
	@echo "Setting up Python virtual environment..."
	@python3 -m venv venv
	@echo "Installing Python dependencies (using pre-built binaries)..."
	@. venv/bin/activate && \
	 pip install --upgrade pip setuptools wheel && \
	 pip install --only-binary :all: pillow && \
	 pip install rembg
	@echo "✓ Python virtual environment created"
	@echo ""
	@$(MAKE) deps
	@echo ""
	@echo "✅ Setup complete! Run 'make run' to start the app."

run: ## Start the application (Python runs on-demand)
	@echo "Starting Go backend on port $(GO_BACKEND_PORT)..."
	@echo "✓ Python runs on-demand (no Flask server)"
	@echo ""
	@if [ ! -d "venv" ]; then \
		echo "❌ Virtual environment not found. Run 'make setup' first."; \
		exit 1; \
	fi
	@cd $(BACKEND_DIR) && go run main.go

build: ## Build Go backend binary
	@echo "Building Go backend..."
	@cd $(BACKEND_DIR) && go build -o image-editor-backend main.go
	@echo "✓ Binary created: backend/image-editor-backend"

test: ## Run Go tests
	@echo "Running tests..."
	@cd $(BACKEND_DIR) && go test ./...

stop: ## Stop all running services
	@echo "Stopping services..."
	@pkill -9 -f "go run main.go" 2>/dev/null || true
	@lsof -ti:$(GO_BACKEND_PORT) | xargs kill -9 2>/dev/null || true
	@echo "✓ All services stopped"

restart: stop run ## Restart all services

clean: ## Clean build artifacts
	@echo "Cleaning build artifacts..."
	@rm -rf $(BACKEND_DIR)/*.exe $(BACKEND_DIR)/*.test $(BACKEND_DIR)/image-editor-backend || true
	@rm -rf $(BACKEND_DIR)/test_client/*.exe $(BACKEND_DIR)/test_client/test_image_ops || true
	@echo "✓ Build artifacts cleaned"

clean-venv: ## Remove Python virtual environment
	@echo "Removing Python virtual environment..."
	@rm -rf venv
	@echo "✓ Virtual environment removed"

.DEFAULT_GOAL := help
