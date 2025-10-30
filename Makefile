.PHONY: run stop clean clean-venv install-python install-python-alt deps setup setup-alt help

# Variables
GO_BACKEND_PORT = 8080
PYTHON_SERVER_PORT = 5001
BACKEND_DIR = backend
PYTHON_SCRIPT = backend/python_scripts/image_server_http.py

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-15s %s\n", $$1, $$2}'

install-python: ## Install Python dependencies (creates venv)
	@echo "Setting up Python virtual environment..."
	@python3 -m venv venv || python3 -m virtualenv venv || true
	@echo "Activating virtual environment and installing dependencies..."
	@. venv/bin/activate && pip install --upgrade pip setuptools wheel && pip install -r $(BACKEND_DIR)/python_scripts/requirements.txt || \
	 (source venv/bin/activate && pip install --upgrade pip setuptools wheel && pip install -r $(BACKEND_DIR)/python_scripts/requirements.txt) || \
	 (@echo ""; \
	 echo "If you see errors, try installing system dependencies first:"; \
	 echo "  macOS: brew install python-tk@3.11 jpeg"; \
	 echo "  Ubuntu/Debian: sudo apt-get install python3-dev python3-tk libjpeg-dev zlib1g-dev"; \
	 echo "  Or use pre-built binaries by installing Pillow separately:"; \
	 echo "    . venv/bin/activate && pip install --only-binary :all: Pillow"; \
	 echo ""; \
	 exit 1)
	@echo "Python virtual environment created at ./venv"

install-python-alt: ## Install Python dependencies with pre-built binaries (recommended on macOS)
	@echo "Setting up Python virtual environment with pre-built binaries..."
	@python3 -m venv venv || python3 -m virtualenv venv || true
	@echo "Activating virtual environment and installing dependencies..."
	@. venv/bin/activate && pip install --upgrade pip setuptools wheel && \
	 pip install --only-binary :all: Pillow && \
	 pip install -r $(BACKEND_DIR)/python_scripts/requirements.txt || \
	 (source venv/bin/activate && pip install --upgrade pip setuptools wheel && \
	 pip install --only-binary :all: Pillow && \
	 pip install -r $(BACKEND_DIR)/python_scripts/requirements.txt)
	@echo "Python virtual environment created at ./venv"

deps: ## Install Go dependencies
	@echo "Installing Go dependencies..."
	cd $(BACKEND_DIR) && go mod download

setup: install-python deps ## Install all dependencies (Python and Go)
	@echo ""
	@echo "Setup complete! Run 'make run' to start both servers."

setup-alt: install-python-alt deps ## Install with pre-built binaries (recommended on macOS if compilation fails)
	@echo ""
	@echo "Setup complete! Run 'make run' to start both servers."

run: ## Start both Go backend and Python server
	@echo "Starting services..."
	@echo "Go backend will run on port $(GO_BACKEND_PORT)"
	@echo "Python image server will run on port $(PYTHON_SERVER_PORT)"
	@echo ""
	@if [ ! -d "venv" ]; then \
		echo "Virtual environment not found. Run 'make setup' first."; \
		exit 1; \
	fi
	@trap 'kill 0' INT; \
	venv/bin/python $(PYTHON_SCRIPT) $(PYTHON_SERVER_PORT) & \
	PYTHON_PID=$$!; \
	echo "Python server started with PID: $$PYTHON_PID"; \
	sleep 2; \
	cd $(BACKEND_DIR) && go run main.go & \
	GO_PID=$$!; \
	echo "Go server started with PID: $$GO_PID"; \
	echo ""; \
	echo "Both servers are running. Press Ctrl+C to stop all services."; \
	wait

stop: ## Stop all running services
	@echo "Stopping services..."
	@pkill -9 -f "venv/bin/python.*$(PYTHON_SCRIPT)" 2>/dev/null || true
	@pkill -9 -f "python3.*$(PYTHON_SCRIPT)" 2>/dev/null || true
	@pkill -9 -f "Python.*image_server_http" 2>/dev/null || true
	@pkill -9 -f "go run main.go" 2>/dev/null || true
	@pkill -9 -f "image_server_http.py" 2>/dev/null || true
	@pkill -9 -f "image-editor-app/backend/main" 2>/dev/null || true
	@lsof -ti:$(GO_BACKEND_PORT) | xargs kill -9 2>/dev/null || true
	@lsof -ti:$(PYTHON_SERVER_PORT) | xargs kill -9 2>/dev/null || true
	@echo "All services stopped."

restart: stop run ## Stop and restart all services

clean: ## Clean build artifacts and venv
	@echo "Cleaning build artifacts..."
	@rm -rf $(BACKEND_DIR)/*.exe $(BACKEND_DIR)/*.test || true
	@rm -rf $(BACKEND_DIR)/test_client/*.exe $(BACKEND_DIR)/test_client/test_image_ops || true
	@echo "Run 'make clean-venv' to remove virtual environment"

clean-venv: ## Remove Python virtual environment
	@echo "Removing Python virtual environment..."
	@rm -rf venv
	@echo "Virtual environment removed."

test: ## Run tests
	@echo "Running tests..."
	cd $(BACKEND_DIR) && go test ./...

build: ## Build Go backend
	@echo "Building Go backend..."
	cd $(BACKEND_DIR) && go build -o image-editor-backend main.go

.DEFAULT_GOAL := help

