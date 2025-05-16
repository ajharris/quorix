from authlib.integrations.flask_client import OAuth
import os

# --- OAuth setup for SSO providers (Google, Facebook, Apple) ---
# This module provides a function to register OAuth clients with Flask.
# It is imported and used by the main app and auth_routes.

oauth = OAuth()

def register_oauth(app):
    """
    Register OAuth clients for Google, Facebook, and Apple with the Flask app.
    - Reads client IDs and secrets from environment variables.
    - Sets up endpoints and scopes for each provider.
    """
    oauth.init_app(app)
    # --- Google OAuth ---
    oauth.register(
        name='google',
        client_id=os.environ.get('GOOGLE_CLIENT_ID'),
        client_secret=os.environ.get('GOOGLE_CLIENT_SECRET'),
        access_token_url='https://oauth2.googleapis.com/token',
        access_token_params=None,
        authorize_url='https://accounts.google.com/o/oauth2/auth',
        authorize_params=None,
        api_base_url='https://www.googleapis.com/oauth2/v1/',
        userinfo_endpoint='https://openidconnect.googleapis.com/v1/userinfo',
        client_kwargs={'scope': 'openid email profile'},
    )
    # --- Facebook OAuth ---
    oauth.register(
        name='facebook',
        client_id=os.environ.get('FACEBOOK_CLIENT_ID'),
        client_secret=os.environ.get('FACEBOOK_CLIENT_SECRET'),
        access_token_url='https://graph.facebook.com/v10.0/oauth/access_token',
        access_token_params=None,
        authorize_url='https://www.facebook.com/v10.0/dialog/oauth',
        authorize_params=None,
        api_base_url='https://graph.facebook.com/v10.0/',
        client_kwargs={'scope': 'email public_profile'},
    )
    # --- Apple OAuth (placeholder, demo only) ---
    oauth.register(
        name='apple',
        client_id=os.environ.get('APPLE_CLIENT_ID'),
        client_secret=os.environ.get('APPLE_CLIENT_SECRET'),
        access_token_url='https://appleid.apple.com/auth/token',
        authorize_url='https://appleid.apple.com/auth/authorize',
        client_kwargs={'scope': 'name email', 'response_type': 'code'},
    )
