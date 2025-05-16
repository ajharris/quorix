# This file is deprecated. All routes have been split into separate modules:
# - auth_routes.py
# - session_routes.py
# - question_routes.py
# - synthesis_routes.py
# - admin_routes.py
# See routes/__init__.py for blueprint registration.

from flask import Blueprint

from .auth_routes import oauth, register_oauth  # Re-export for test compatibility

routes = Blueprint('routes', __name__)

# Define your routes here, or leave empty if all routes are moved to separate files.
