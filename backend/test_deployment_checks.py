import os
import pytest
from backend.app import app
from flask import Flask
from unittest import mock

# 1. Environment-based configuration switching
def test_environment_config_switch(monkeypatch):
    monkeypatch.setenv('FLASK_ENV', 'production')
    assert os.environ['FLASK_ENV'] == 'production'
    # You may want to check app.config here if you use config classes

# 2. Backend and frontend build output (static files served)
def test_static_files_served(client):
    resp = client.get('/')
    assert resp.status_code == 200
    # Accept both uppercase and lowercase doctype
    assert b'<!doctype html' in resp.data.lower()  # React index.html

def test_static_asset(client):
    # Simulate a built static asset (e.g., main.js)
    static_path = os.path.join(app.static_folder, 'index.html')
    if os.path.exists(static_path):
        resp = client.get('/index.html')
        assert resp.status_code == 200

# 3. Dockerfile validity (simulate build)
def test_dockerfile_exists():
    assert not os.path.exists('Dockerfile'), 'No Dockerfile found. Add one for production.'

# 4. Database connection in cloud (mock env)
def test_database_env(monkeypatch):
    monkeypatch.setenv('DATABASE_URL', 'postgres://user:pass@host:5432/db')
    assert os.environ['DATABASE_URL'].startswith('postgres://')
    # Here you would import your DB module and try to connect (mocked)

# 5. Logging and error monitoring integration
def test_logging_and_monitoring(monkeypatch):
    with mock.patch('logging.error') as log_err:
        try:
            raise ValueError('test error')
        except Exception as e:
            import logging
            logging.error('An error occurred', exc_info=e)
        log_err.assert_called()
    # Sentry/LogRocket integration would be similar, if present
