import sys
import os
# Add the backend directory to sys.path so 'app' can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from flask import Flask
from app import app as flask_app
from backend.models import db

@pytest.fixture
def client():
    flask_app.config['TESTING'] = True
    with flask_app.test_client() as client:
        yield client

@pytest.fixture
def session():
    ctx = flask_app.app_context()
    ctx.push()
    db.create_all()
    yield db.session
    db.session.rollback()
    db.drop_all()
    ctx.pop()
