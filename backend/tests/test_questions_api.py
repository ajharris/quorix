import pytest
from backend.app import app, questions
from datetime import datetime, timezone

def client():
    app.config['TESTING'] = True
    with app.test_client() as c:
        yield c

# 2. API Endpoint Tests

def test_submit_question_success():
    questions.clear()
    payload = {'user_id': 'u1', 'session_id': 's1', 'text': 'What is the agenda?'}
    with app.test_client() as c:
        resp = c.post('/questions', json=payload)
        assert resp.status_code == 201
        assert questions[-1]['text'] == 'What is the agenda?'
        assert questions[-1]['status'] == 'pending'

def test_submit_question_missing_fields():
    with app.test_client() as c:
        resp = c.post('/questions', json={'user_id': 'u1', 'session_id': 's1'})
        assert resp.status_code == 400
        assert b'text is required' in resp.data
        resp2 = c.post('/questions', json={'session_id': 's1', 'text': 'Q'})
        assert resp2.status_code == 400
        assert b'user_id is required' in resp2.data

def test_submit_question_with_invalid_status():
    with app.test_client() as c:
        resp = c.post('/questions', json={'user_id': 'u1', 'session_id': 's1', 'text': 'Q', 'status': 'invalid_status'})
        assert resp.status_code == 400
        assert b'invalid status' in resp.data

def test_submit_question_sets_pending_status():
    questions.clear()
    with app.test_client() as c:
        resp = c.post('/questions', json={'user_id': 'u1', 'session_id': 's1', 'text': 'Q'})
        assert resp.status_code == 201
        assert questions[-1]['status'] == 'pending'

def test_question_text_length_limit_api():
    long_text = 'a' * 501
    with app.test_client() as c:
        resp = c.post('/questions', json={'user_id': 'u1', 'session_id': 's1', 'text': long_text})
        assert resp.status_code == 400
        assert b'max length' in resp.data

def test_timestamp_format_and_timezone_api():
    questions.clear()
    with app.test_client() as c:
        resp = c.post('/questions', json={'user_id': 'u1', 'session_id': 's1', 'text': 'Q'})
        assert resp.status_code == 201
        ts = questions[-1]['timestamp']
        assert ts.endswith('+00:00') or ts.endswith('Z')
