from flask import Flask, send_from_directory
from flask_migrate import Migrate
from dotenv import load_dotenv
import os
import subprocess
from backend.routes import register_all_routes
from backend.routes.oauth import register_oauth
from backend.models.db import db

# Load .env from project root
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Set static_folder to React build output for correct static file serving
frontend_build_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'build')
app = Flask(__name__, static_folder=frontend_build_dir, static_url_path='')

app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key')  # Set a secret key for session support

register_oauth(app)

# Use SQLALCHEMY_DATABASE_URI for Flask-SQLAlchemy compatibility
# Accept both QUORIX_DATABASE_URI and SQLALCHEMY_DATABASE_URI for flexibility

def get_demo_mode():
    # Accepts DEMO_MODE=1, true, True, TRUE
    return os.environ.get('DEMO_MODE', '').lower() in ('1', 'true')

if get_demo_mode():
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///demo.db'
    print('DEMO_MODE enabled: Using SQLite database at demo.db')
else:
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

db.init_app(app)
migrate = Migrate(app, db)

register_all_routes(app)

@app.route('/')
def index():
    return send_from_directory(frontend_build_dir, 'index.html')

# Serve React's static files
@app.route('/<path:path>')
def serve_react(path=''):
    index_path = os.path.join(frontend_build_dir, 'index.html')
    full_path = os.path.normpath(os.path.join(frontend_build_dir, path))
    if not os.path.exists(index_path):
        return ("Frontend not built. Please run 'npm run build' in the frontend directory.", 404)
    if full_path.startswith(frontend_build_dir) and os.path.exists(full_path):
        return send_from_directory(frontend_build_dir, os.path.relpath(full_path, frontend_build_dir))
    else:
        return send_from_directory(frontend_build_dir, 'index.html')

# Re-export in-memory demo data for test compatibility
from backend.routes.question_routes import questions

# Only build frontend if running as main app, not during import (e.g., for tests)
if __name__ == '__main__':
    FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend'))
    print("Building React frontend...")
    subprocess.run(['npm', 'run', 'build'], cwd=FRONTEND_DIR)
    app.run(host='0.0.0.0', port=5000)
