import pytest
import re
from flask import json

def test_create_session_success(client):
    # 1. Test POST /create_session creates a session
    payload = {
        "title": "Test Event",
        "start_time": "2025-05-12T10:00:00Z",
        "description": "Integration test event."
    }
    response = client.post('/create_session', json=payload)
    assert response.status_code in (200, 201)
    data = response.get_json()
    assert "session_id" in data
    assert "qr_link" in data
    # Check QR link format
    assert re.match(r"^https://quorix.ai/session/[\w-]+$", data["qr_link"])
    # TODO: Check DB for session metadata (mock or in-memory DB)


def test_session_id_uniqueness(client):
    # 2. Test session ID uniqueness
    payload = {
        "title": "Event 1",
        "start_time": "2025-05-12T11:00:00Z",
        "description": "Event 1 desc."
    }
    ids = set()
    for _ in range(10):
        response = client.post('/create_session', json=payload)
        data = response.get_json()
        assert data["session_id"] not in ids
        ids.add(data["session_id"])


def test_session_metadata_stored(client):
    # 3. Test session metadata is stored correctly
    payload = {
        "title": "Meta Event",
        "start_time": "2025-05-12T12:00:00Z",
        "description": "Meta test."
    }
    response = client.post('/create_session', json=payload)
    data = response.get_json()
    session_id = data["session_id"]
    # TODO: Query DB for session_id and check metadata matches


def test_qr_link_format(client):
    # 4. Test QR-code-ready link is correctly formatted
    payload = {
        "title": "QR Event",
        "start_time": "2025-05-12T13:00:00Z",
        "description": "QR test."
    }
    response = client.post('/create_session', json=payload)
    data = response.get_json()
    qr_link = data["qr_link"]
    assert qr_link.startswith("https://quorix.ai/session/")
    assert len(qr_link.split("/")) == 5  # https: '' quorix.ai session {id}


def test_missing_required_fields(client):
    # 5. Test missing required fields
    payload = {"description": "No title or start_time"}
    response = client.post('/create_session', json=payload)
    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data
    assert "title" in data["error"] or "start_time" in data["error"]
