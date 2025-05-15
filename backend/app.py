from flask import Flask, send_from_directory
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
import os
import subprocess
from backend.routes.api_routes import routes, sessions, questions

# Load .env from project root
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

app = Flask(__name__, static_folder='../frontend/build', static_url_path='')
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key')  # Set a secret key for session support

# Use SQLALCHEMY_DATABASE_URI for Flask-SQLAlchemy compatibility
# Accept both QUORIX_DATABASE_URI and SQLALCHEMY_DATABASE_URI for flexibility

db_url = (
    os.environ.get('SQLALCHEMY_DATABASE_URI') or
    os.environ.get('QUORIX_DATABASE_URI') or
    os.environ.get('DATABASE_URL')
)
if db_url and db_url.startswith('postgres://'):
    db_url = db_url.replace('postgres://', 'postgresql://', 1)
if not db_url:
    raise RuntimeError("You must set SQLALCHEMY_DATABASE_URI or QUORIX_DATABASE_URI or DATABASE_URL in your environment or .env file.")
app.config['SQLALCHEMY_DATABASE_URI'] = db_url

print("Loaded SQLALCHEMY_DATABASE_URI:", app.config['SQLALCHEMY_DATABASE_URI'])

db = SQLAlchemy(app)
migrate = Migrate(app, db)

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
    FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend'))
    print("Building React frontend...")
    subprocess.run(['npm', 'run', 'build'], cwd=FRONTEND_DIR)
    app.run(host='0.0.0.0', port=5000)
