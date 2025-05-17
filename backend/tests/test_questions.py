import pytest
from datetime import datetime, timezone
from backend.models.question import Question

# 1. Database Schema Tests

def test_question_model_fields():
    q = Question(user_id='u1', session_id='s1', text='What is this?')
    assert hasattr(q, 'id')
    assert hasattr(q, 'user_id')
    assert hasattr(q, 'session_id')
    assert hasattr(q, 'timestamp')
    assert hasattr(q, 'text')
    assert hasattr(q, 'status')
    assert set(Question.STATUS_VALUES) == {'pending', 'approved', 'merged', 'deleted'}

def test_question_default_status():
    q = Question(user_id='u1', session_id='s1', text='Test')
    assert q.status == 'pending'

def test_question_created_with_valid_data():
    now = datetime.now(timezone.utc)
    q = Question(user_id='u1', session_id='s1', text='Test', status='approved')
    assert q.user_id == 'u1'
    assert q.session_id == 's1'
    assert q.text == 'Test'
    assert q.status == 'approved'
    assert isinstance(q.timestamp, datetime)
    assert q.timestamp.tzinfo is not None
    assert abs((q.timestamp - now).total_seconds()) < 5

# 3. Edge Case / Validation Tests

def test_question_text_length_limit():
    long_text = 'a' * (Question.MAX_TEXT_LENGTH + 1)
    errors = Question.validate({'user_id': 'u', 'session_id': 's', 'text': long_text})
    assert any('max length' in e for e in errors)

def test_question_invalid_status():
    errors = Question.validate({'user_id': 'u', 'session_id': 's', 'text': 'ok', 'status': 'bad'})
    assert any('invalid status' in e for e in errors)

def test_timestamp_format_and_timezone():
    q = Question(user_id='u', session_id='s', text='ok')
    iso = q.timestamp.isoformat()
    assert iso.endswith('+00:00') or iso.endswith('Z')
    assert q.timestamp.tzinfo is not None
