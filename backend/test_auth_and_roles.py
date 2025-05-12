import pytest
from flask import Flask, jsonify, request, session

# --- LOGIN AND ROLE MANAGEMENT MOCK IMPLEMENTATION ---
# For demo/testing only. Replace with real DB/auth logic in production.
USERS = {
    ('user@example.com', 'valid123'): {'role': 'attendee'},
    ('mod@example.com', 'validmod'): {'role': 'moderator'},
    ('org@example.com', 'validorg'): {'role': 'organizer'},
}
SSO_TOKENS = {
    'valid-sso-token': {'role': 'moderator'},
}
EXPIRED_CODES = {'expiredcode'}

app = Flask(__name__)
app.secret_key = 'test'

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    code = data.get('session_code')
    if (email, code) in USERS:
        role = USERS[(email, code)]['role']
        session['role'] = role
        return jsonify({'role': role}), 200
    if code in EXPIRED_CODES:
        return jsonify({'error': 'session expired'}), 403
    return jsonify({'error': 'invalid credentials'}), 401

@app.route('/login/sso', methods=['POST'])
def login_sso():
    data = request.get_json()
    token = data.get('token')
    if token in SSO_TOKENS:
        role = SSO_TOKENS[token]['role']
        session['role'] = role
        return jsonify({'role': role}), 200
    return jsonify({'error': 'sso authentication failed'}), 401

# --- ROUTE PROTECTION DECORATORS ---
def require_role(*roles):
    def decorator(fn):
        def wrapper(*args, **kwargs):
            user_role = session.get('role')
            if not user_role:
                return ('', 401)
            if user_role not in roles:
                return (b'access denied', 403)
            return fn(*args, **kwargs)
        wrapper.__name__ = fn.__name__
        return wrapper
    return decorator

@app.route('/moderator/dashboard')
@require_role('moderator', 'organizer')
def moderator_dashboard():
    return jsonify({'dashboard': 'moderator'}), 200

@app.route('/organizer/only')
@require_role('organizer')
def organizer_only():
    return jsonify({'organizer': 'secret'}), 200

# --- TESTS ---
@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_email_session_login_success(client):
    # Simulate valid email + session code login
    resp = client.post('/login', json={
        'email': 'user@example.com',
        'session_code': 'valid123'
    })
    assert resp.status_code == 200
    assert b'role' in resp.data  # Should return user role

def test_email_session_login_invalid_credentials(client):
    resp = client.post('/login', json={
        'email': 'user@example.com',
        'session_code': 'wrongcode'
    })
    assert resp.status_code == 401
    assert b'invalid credentials' in resp.data

def test_email_session_login_expired_session(client):
    resp = client.post('/login', json={
        'email': 'user@example.com',
        'session_code': 'expiredcode'
    })
    assert resp.status_code == 403
    assert b'session expired' in resp.data

def test_sso_login_success(client):
    # Simulate SSO login (mocked)
    resp = client.post('/login/sso', json={
        'provider': 'google',
        'token': 'valid-sso-token'
    })
    assert resp.status_code == 200
    assert b'role' in resp.data

def test_sso_login_failure(client):
    resp = client.post('/login/sso', json={
        'provider': 'google',
        'token': 'invalid-token'
    })
    assert resp.status_code == 401
    assert b'sso authentication failed' in resp.data

def test_role_assignment_after_login(client):
    # Simulate login and check role in response
    resp = client.post('/login', json={
        'email': 'mod@example.com',
        'session_code': 'validmod'
    })
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['role'] in ['attendee', 'moderator', 'organizer']

def test_dashboard_access_moderator(client):
    # Simulate login as moderator
    with client.session_transaction() as sess:
        sess['role'] = 'moderator'
    resp = client.get('/moderator/dashboard')
    assert resp.status_code == 200

def test_dashboard_access_organizer(client):
    with client.session_transaction() as sess:
        sess['role'] = 'organizer'
    resp = client.get('/moderator/dashboard')
    assert resp.status_code == 200

def test_dashboard_access_attendee_forbidden(client):
    with client.session_transaction() as sess:
        sess['role'] = 'attendee'
    resp = client.get('/moderator/dashboard')
    assert resp.status_code == 403
    assert b'access denied' in resp.data

def test_dashboard_access_unauthenticated_redirect(client):
    resp = client.get('/moderator/dashboard', follow_redirects=False)
    assert resp.status_code in (302, 401, 403)

def test_attendee_forbidden_from_organizer_views(client):
    with client.session_transaction() as sess:
        sess['role'] = 'attendee'
    resp = client.get('/organizer/only')
    assert resp.status_code == 403
    assert b'access denied' in resp.data
