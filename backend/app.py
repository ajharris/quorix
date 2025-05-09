from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import os

import subprocess
import os

# Run this only once at backend startup
FRONTEND_DIR = os.path.join(os.getcwd(), '..', 'frontend')  # adjust if needed
print("Building React frontend...")
subprocess.run(['npm', 'run', 'build'], cwd=FRONTEND_DIR)


app = Flask(__name__, static_folder='../frontend/build', static_url_path='')
CORS(app)

@app.route('/api/ping')
def ping():
    return jsonify({"message": "Pong!"})

# Serve React's static files
@app.route('/')
@app.route('/<path:path>')
def serve_react(path=''):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
