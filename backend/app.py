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
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

# Only build frontend if running as main app, not during import (e.g., for tests)
if __name__ == '__main__':
    FRONTEND_DIR = os.path.join(os.getcwd(), '..', 'frontend')  # adjust if needed
    print("Building React frontend...")
    subprocess.run(['npm', 'run', 'build'], cwd=FRONTEND_DIR)

    app.run(host='0.0.0.0', port=5000)
