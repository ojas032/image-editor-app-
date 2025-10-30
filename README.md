# Image Editor App

A full-stack image editing application with Go backend and web frontend.

## Features

- **Compress Images**: Reduce file size while maintaining quality (supports JPEG, PNG, WebP, GIF)
- **Resize Images**: Change dimensions with aspect ratio preservation
- **Crop Images**: Select and extract specific regions
- **Convert Formats**: Transform between different image formats
- **Upscale Images**: Enlarge images using advanced algorithms
- **Blur Images**: Apply blur effects to specific regions
- **Remove Background**: AI-powered background removal
- **Change Background**: Replace backgrounds with images or solid colors

## Architecture

- **Backend**: Go (Gin framework)
  - Pure Go for most operations (compress, resize, crop, convert, upscale, blur)
  - Python HTTP server for AI-powered background removal
  - Fast communication via HTTP between Go and Python services
- **Frontend**: HTML, CSS, JavaScript
- **AI Processing**: Python with `rembg` library

## Prerequisites

- Go 1.25.3 or higher
- Python 3.8 or higher
- pip3

## Setup

1. **Clone the repository** (if applicable):
   ```bash
   git clone <repository-url>
   cd image-editor-app
   ```

2. **Install all dependencies**:
   ```bash
   make setup
   ```
   
   This will:
   - Create a Python virtual environment (venv)
   - Install all Python dependencies in the venv
   - Install all Go dependencies
   
   Or install separately:
   ```bash
   make install-python  # Install Python dependencies (creates venv)
   make deps            # Install Go dependencies
   ```

3. **If Pillow build fails** (common on macOS):
   ```bash
   make setup-alt       # Uses pre-built binaries instead
   ```
   
   Alternatively, install system dependencies first:
   ```bash
   # macOS
   brew install python-tk@3.11 jpeg
   
   # Ubuntu/Debian
   sudo apt-get install python3-dev python3-tk libjpeg-dev zlib1g-dev
   ```

## Running the Application

### Start Both Servers (Recommended)

```bash
make run
```

This starts:
- Python image processing server on port 5001
- Go backend server on port 8080

### Stop All Services

```bash
make stop
```

Or press `Ctrl+C` in the terminal running `make run`

## API Endpoints

The Go backend exposes the following endpoints on `http://localhost:8080`:

- `POST /compress` - Compress images
- `POST /resize` - Resize images
- `POST /crop` - Crop images
- `POST /convert` - Convert image formats
- `POST /upscale` - Upscale images
- `POST /blur` - Blur image regions
- `POST /remove-background` - Remove background
- `POST /change-background` - Replace background
- `GET /health` - Health check

## Frontend

Open `frontend/index.html` in your browser to access the web interface.

## Project Structure

```
image-editor-app/
├── backend/
│   ├── handlers/          # HTTP handlers
│   ├── services/          # Business logic
│   ├── utils/             # Utility functions
│   ├── models/            # Data models
│   ├── server/            # Server setup
│   ├── python_scripts/    # Python image processing
│   └── main.go            # Entry point
├── frontend/              # Web UI
├── Makefile               # Build automation
└── README.md              # This file
```

## Development

### Build Go Backend
```bash
make build
```

### Run Tests
```bash
make test
```

### Clean Build Artifacts
```bash
make clean
```

### Help
```bash
make help
```

## Make Targets

| Target | Description |
|--------|-------------|
| `setup` | Install all dependencies (creates venv) |
| `setup-alt` | Install with pre-built binaries (recommended on macOS if compilation fails) |
| `install-python` | Install Python dependencies (creates venv) |
| `install-python-alt` | Install Python with pre-built binaries |
| `deps` | Install Go dependencies |
| `run` | Start both servers |
| `stop` | Stop all services |
| `build` | Build Go backend |
| `test` | Run tests |
| `clean` | Clean build artifacts |
| `clean-venv` | Remove Python virtual environment |
| `help` | Show help message |

## Ports

- **8080**: Go backend server
- **5001**: Python image processing server

## Technology Stack

- **Backend**: Go, Gin, Disintegration Imaging
- **Frontend**: HTML5, CSS3, JavaScript
- **AI/ML**: Python, Flask, rembg, PIL/Pillow
- **Communication**: HTTP REST API

## Troubleshooting

### Pillow Build Errors
If you see `ERROR: Failed to build 'pillow'`, use pre-built binaries:
```bash
make setup-alt
```

Or install Pillow separately with pre-built binaries:
```bash
. venv/bin/activate
pip install --only-binary :all: Pillow
pip install -r backend/python_scripts/requirements.txt
```

### Virtual Environment Not Found
```bash
make clean-venv
make setup
```

### Port Already in Use
Change ports in the Makefile or stop conflicting services:
```bash
# Change GO_BACKEND_PORT or PYTHON_SERVER_PORT in Makefile
# Or stop conflicting services
lsof -i :8080
lsof -i :5001
```

## Notes

- The Python server must be running for background removal/change features
- Compression, resize, crop, convert, upscale, and blur work entirely in Go
- All operations accept base64-encoded images and return base64-encoded results

