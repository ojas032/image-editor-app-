#!/usr/bin/env python3
"""
Simple Static Server for ImageNerd - Direct file serving with clean URLs
"""
import http.server
import socketserver
import os
import sys
import mimetypes
from urllib.parse import urlparse, unquote

class SimpleStaticServer(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Get the requested path
        parsed_url = urlparse(self.path)
        path = unquote(parsed_url.path)

        # Remove leading slash
        if path.startswith('/'):
            path = path[1:]

        # Handle root path
        if not path:
            path = 'index.html'

        # Static mapping: clean URLs to files
        static_routes = {
            'crop': 'crop',
            'convert': 'convert',
            'privacy': 'privacy',
            'terms': 'terms',
            'about': 'about.html',  # Keep as .html since it's inline route
            'contact': 'contact.html',  # Keep as .html since it's inline route
            'compress': 'index.html',  # SPA routes serve index.html
            'resize': 'index.html',   # SPA routes serve index.html
        }

        # Check if we have a static route mapping
        if path in static_routes:
            file_path = static_routes[path]
        else:
            # Try to find the file directly
            file_path = path

        # If no extension, try adding .html
        if '.' not in file_path:
            if os.path.exists(file_path + '.html'):
                file_path += '.html'

        # Check if file exists
        full_path = os.path.join(os.getcwd(), file_path)
        if os.path.isfile(full_path):
            self.serve_file(full_path)
        else:
            # For SPA fallback, serve index.html for unknown routes
            index_path = os.path.join(os.getcwd(), 'index.html')
            if os.path.exists(index_path):
                self.serve_file(index_path)
            else:
                self.send_error(404, f"File not found: {file_path}")

    def serve_file(self, file_path):
        """Serve a static file with proper content type"""
        try:
            if not os.path.exists(file_path):
                self.send_error(404, f"File not found: {file_path}")
                return

            # Open file in binary mode
            with open(file_path, 'rb') as f:
                content = f.read()

            # Send response
            self.send_response(200)

            # Set content type based on file extension
            content_type, _ = mimetypes.guess_type(file_path)
            if content_type:
                self.send_header('Content-type', content_type)
            else:
                self.send_header('Content-type', 'text/html')

            self.send_header('Content-length', len(content))
            self.end_headers()

            # Send file content
            self.wfile.write(content)

        except Exception as e:
            print(f"Error serving {file_path}: {e}")
            self.send_error(500, f"Server error: {e}")

    def log_message(self, format, *args):
        # Suppress default logging to keep output clean
        return

def main():
    port = 3000

    # Change to frontend directory
    frontend_dir = '/Users/ojasgupta/Desktop/image-editor-app/frontend'
    if not os.path.exists(frontend_dir):
        print(f"Error: Frontend directory not found: {frontend_dir}")
        sys.exit(1)

    os.chdir(frontend_dir)

    try:
        with socketserver.TCPServer(("", port), SimpleStaticServer) as httpd:
            print(f"🚀 Simple Static Server running at: http://localhost:{port}/")
            print(f"📁 Serving directory: {os.getcwd()}")
            print()
            print("✨ Clean URL mappings:")
            print("  / → index.html")
            print("  /crop → crop")
            print("  /convert → convert")
            print("  /privacy → privacy")
            print("  /terms → terms")
            print("  /compress → index.html (SPA)")
            print("  /resize → index.html (SPA)")
            print("  /about → about.html")
            print("  /contact → contact.html")
            print()
            print("🌐 Test URLs:")
            print(f"  http://localhost:{port}/ (home)")
            print(f"  http://localhost:{port}/crop (static file)")
            print(f"  http://localhost:{port}/compress (SPA route)")
            print()
            print("Press Ctrl+C to stop")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Server stopped")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
