from flask import Blueprint, jsonify, request, send_file, session as flask_session, current_app
from datetime import datetime, timezone
import uuid
import qrcode
import io

# --- In-memory session/event/user storage for demo/testing ---
# These are used to simulate a database for sessions, users, and their event participation.
sessions = {}  # Maps session_id to session info
test_users = {}  # Not used here, but for reference
test_user_events = {}  # Not used here, but for reference
users = {}  # Should be shared with auth_routes in a real app
user_events = {}  # Should be shared with auth_routes in a real app

session_routes = Blueprint('session_routes', __name__)

# --- User Events Route ---
@session_routes.route('/api/user/<user_id>/events')
def get_user_events(user_id):
    """
    Return all events where the user is a moderator or attendee.
    Looks up the user's moderator and attendee event sets in user_events.
    """
    if user_id not in users:
        return jsonify({'error': 'User not found'}), 404
    mod_ids = list(user_events[user_id]['moderator'])
    att_ids = list(user_events[user_id]['attendee'])
    mod_events = [sessions[eid] for eid in mod_ids if eid in sessions]
    att_events = [sessions[eid] for eid in att_ids if eid in sessions]
    return jsonify({
        'moderator_for': mod_events,
        'attendee_in': att_events
    })

# --- Create Session Route ---
@session_routes.route('/create_session', methods=['POST'])
def create_session():
    """
    Create a new session/event.
    - Expects title, start_time, and optional description in the request body.
    - Generates a unique session_id and stores the session in the in-memory sessions dict.
    - Optionally assigns a moderator if moderator_id is provided and valid.
    - Returns the session_id and a QR code link for the event.
    """
    data = request.get_json()
    title = data.get('title')
    start_time = data.get('start_time')
    description = data.get('description', '')
    if not title or not start_time:
        return jsonify({"error": "Missing required field: title and start_time are required."}), 400
    while True:
        session_id = str(uuid.uuid4())
        if session_id not in sessions:
            break
    sessions[session_id] = {
        "title": title,
        "start_time": start_time,
        "description": description,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    moderator_id = data.get('moderator_id')
    if moderator_id and moderator_id in users:
        user_events[moderator_id]['moderator'].add(session_id)
    qr_link = f"https://quorix.ai/session/{session_id}"
    return jsonify({
        "session_id": session_id,
        "qr_link": qr_link
    }), 201

# --- Session QR Code Route ---
@session_routes.route('/session_qr/<session_id>')
def session_qr(session_id):
    """
    Generate and return a QR code image for the given session_id.
    The QR code links to the event's join page.
    """
    url = f"https://quorix.ai/session/{session_id}"
    img = qrcode.make(url)
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    return send_file(buf, mimetype='image/png')

# --- Get Session Info Route ---
@session_routes.route('/api/session/<session_id>')
def get_session(session_id):
    """
    Return the session/event info for the given session_id.
    """
    session_obj = sessions.get(session_id)
    if not session_obj:
        return jsonify({'error': 'Session not found'}), 404
    return jsonify(session_obj)
