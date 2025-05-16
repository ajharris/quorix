import pytest
from backend.app import app
from unittest.mock import patch

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_login_sso_invalid_provider(client):
    resp = client.get('/login/sso?provider=invalid')
    assert resp.status_code == 400
    assert b'Invalid provider' in resp.data

def test_missing_provider(client):
    resp = client.get('/login/sso')
    assert resp.status_code == 400
    assert b'Invalid provider' in resp.data

def test_login_sso_callback_invalid_provider(client):
    resp = client.get('/login/sso/callback/invalid')
    assert resp.status_code == 400
    assert b'Invalid provider' in resp.data

@patch('backend.routes.api_routes.oauth')
def test_login_sso_callback_google(mock_oauth, client):
    mock_client = mock_oauth.create_client.return_value
    mock_client.authorize_access_token.return_value = {'id_token': 'fake-token'}
    mock_oauth.google.parse_id_token.return_value = {'email': 'test@google.com', 'name': 'Test Google'}
    resp = client.get('/login/sso/callback/google')
    assert resp.status_code == 200
    assert b'test@google.com' in resp.data
    assert b'Test Google' in resp.data

@patch('backend.routes.api_routes.oauth')
def test_login_sso_callback_facebook(mock_oauth, client):
    mock_client = mock_oauth.create_client.return_value
    mock_client.authorize_access_token.return_value = {'access_token': 'fake-token'}
    mock_resp = mock_client.get.return_value
    mock_resp.json.return_value = {'email': 'test@fb.com', 'name': 'Test FB'}
    resp = client.get('/login/sso/callback/facebook')
    assert resp.status_code == 200
    assert b'test@fb.com' in resp.data
    assert b'Test FB' in resp.data

@patch('backend.routes.api_routes.oauth')
def test_login_sso_callback_apple(mock_oauth, client):
    mock_client = mock_oauth.create_client.return_value
    mock_client.authorize_access_token.return_value = {'id_token': 'apple-token'}
    resp = client.get('/login/sso/callback/apple')
    assert resp.status_code == 200
    assert b'apple-token' in resp.data
    assert b'Apple User' in resp.data
