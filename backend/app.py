from flask import Flask, send_from_directory
from flask_cors import CORS
import os
import subprocess
from routes.api_routes import routes, sessions, questions

app = Flask(__name__, static_folder='../frontend/build', static_url_path='')
CORS(app, resources={r"/*": {"origins": "http://your-production-domain.com"}})

# Register routes blueprint
app.register_blueprint(routes)

# Serve React's static files
@app.route('/')
@app.route('/<path:path>')
def serve_react(path=''):
    index_path = os.path.join(app.static_folder, 'index.html')
    full_path = os.path.normpath(os.path.join(app.static_folder, path))
    if not os.path.exists(index_path):
        # Frontend build does not exist; return 404 or a simple message
        return ("Frontend not built. Please run 'npm run build' in the frontend directory.", 404)
    if full_path.startswith(app.static_folder) and os.path.exists(full_path):
        return send_from_directory(app.static_folder, os.path.relpath(full_path, app.static_folder))
    else:
        return send_from_directory(app.static_folder, 'index.html')

# Only build frontend if running as main app, not during import (e.g., for tests)
if __name__ == '__main__':
    FRONTEND_DIR = os.path.join(os.getcwd(), 'frontend')  # fixed path
    print("Building React frontend...")
    subprocess.run(['npm', 'run', 'build'], cwd=FRONTEND_DIR)

    app.run(host='0.0.0.0', port=5000)
