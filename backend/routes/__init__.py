# All API and web routes for the Flask app are defined here.
# Import this file in app.py and register the routes with the Flask app instance.

from .auth_routes import auth_routes
from .session_routes import session_routes
from .question_routes import question_routes
from .synthesis_routes import synthesis_routes
from .admin_routes import admin_routes
from .chat_routes import chat_routes

# Optionally, you can create a function to register all blueprints to the app

def register_all_routes(app):
    app.register_blueprint(auth_routes)
    app.register_blueprint(session_routes)
    app.register_blueprint(question_routes)
    app.register_blueprint(synthesis_routes)
    app.register_blueprint(admin_routes)
    app.register_blueprint(chat_routes)
