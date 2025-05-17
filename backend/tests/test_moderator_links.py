import pytest
from backend.routes.session_routes import moderator_links
from backend.app import app

def setup_module(module):
    moderator_links.clear()

def test_get_moderator_links_empty(client):
    resp = client.get('/api/mod/links/testsession')
    assert resp.status_code == 200
    assert resp.get_json() == []

def test_post_moderator_link_success(client):
    payload = {'url': 'https://example.com', 'title': 'Example', 'published_by': 'Alice'}
    resp = client.post('/api/mod/links/testsession', json=payload)
    assert resp.status_code == 201
    data = resp.get_json()
    assert data['success'] is True
    assert data['link']['url'] == 'https://example.com'
    assert data['link']['title'] == 'Example'
    assert data['link']['published_by'] == 'Alice'
    # Now GET should return the link
    resp2 = client.get('/api/mod/links/testsession')
    links = resp2.get_json()
    assert len(links) == 1
    assert links[0]['url'] == 'https://example.com'

def test_post_moderator_link_missing_url(client):
    payload = {'title': 'No URL', 'published_by': 'Bob'}
    resp = client.post('/api/mod/links/testsession', json=payload)
    assert resp.status_code == 400
    data = resp.get_json()
    assert 'error' in data and 'url' in data['error']

def test_multiple_links(client):
    moderator_links.clear()
    payload1 = {'url': 'https://a.com', 'title': 'A', 'published_by': 'A'}
    payload2 = {'url': 'https://b.com', 'title': 'B', 'published_by': 'B'}
    client.post('/api/mod/links/testsession', json=payload1)
    client.post('/api/mod/links/testsession', json=payload2)
    resp = client.get('/api/mod/links/testsession')
    links = resp.get_json()
    assert len(links) == 2
    assert links[0]['url'] == 'https://a.com'
    assert links[1]['url'] == 'https://b.com'
