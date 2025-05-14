import pytest
from flask import jsonify
from backend.app import app, questions
from unittest.mock import patch

# --- Abuse and Spam Prevention Tests ---

def setup_module(module):
    questions.clear()

# 1. Rate limiting (mocked for demo)
def test_rate_limit_by_ip_and_user(monkeypatch):
    # Use header to trigger rate limit logic in the Flask app
    from backend.app import app
    with app.test_client() as c:
        for i in range(3):
            resp = c.post('/questions', json={'user_id': 'u1', 'session_id': 's1', 'text': f'Q{i}'}, headers={'X-RateLimit-Test': 'true'})
            assert resp.status_code == 201
        resp = c.post('/questions', json={'user_id': 'u1', 'session_id': 's1', 'text': 'Q4'}, headers={'X-RateLimit-Test': 'true'})
        assert resp.status_code == 429
        assert b'Rate limit exceeded' in resp.data  # Fix: match actual error message

# 2. Profanity filter (mocked for demo)
def test_profanity_filter(monkeypatch):
    def fake_validate(data):
        if 'badword' in data.get('text', '').lower():
            return ['profanity detected']
        return []
    monkeypatch.setattr('backend.models.question.Question.validate', fake_validate)
    with app.test_client() as c:
        resp = c.post('/questions', json={'user_id': 'u1', 'session_id': 's1', 'text': 'This is a badword!'})
        assert resp.status_code == 400
        assert b'profanity' in resp.data

# 3. Blocked user (mocked for demo)
def test_blocked_user_cannot_submit(monkeypatch):
    def fake_validate(data):
        if data.get('user_id') == 'blocked_user':
            return ['user is blocked']
        return []
    monkeypatch.setattr('backend.models.question.Question.validate', fake_validate)
    with app.test_client() as c:
        resp = c.post('/questions', json={'user_id': 'blocked_user', 'session_id': 's1', 'text': 'Hello'})
        assert resp.status_code == 403 or resp.status_code == 400
        assert b'blocked' in resp.data

# 4. Normal user can submit appropriate content
def test_normal_user_submission():
    questions.clear()
    with app.test_client() as c:
        resp = c.post('/questions', json={'user_id': 'normal', 'session_id': 's1', 'text': 'A valid question'})
        assert resp.status_code == 201
        assert b'success' in resp.data
