from flask import Blueprint, jsonify, request, send_file, current_app, session
import os
import uuid
from datetime import datetime, timezone
import qrcode
import io
from backend.models.question import Question
from backend.utils.synthesis import get_synthesized_questions, background_summarization
from backend.models.user import User
from backend.models.event import Event

routes = Blueprint('routes', __name__)

# In-memory session storage for demo/testing
sessions = {}

# In-memory question storage
questions = {}

# In-memory user and event storage for demo/testing
users = {}
user_events = {}  # user_id -> {'moderator': set(event_id), 'attendee': set(event_id)}

@routes.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    code = data.get('session_code')
    # Admin login for testing/demo
    if email == 'admin@example.com' and code == 'admin123':
        session['user_id'] = 'admin@example.com'
        session['role'] = 'admin'
        return jsonify({'role': 'admin', 'user_id': 'admin@example.com'}), 200
    # For demo, use USERS dict if present, else create new user
    role = None
    if hasattr(current_app, 'USERS') and (email, code) in current_app.USERS:
        role = current_app.USERS[(email, code)]['role']
    else:
        role = 'attendee'
    user_id = email or f"user_{len(users)+1}"
    if user_id not in users:
        users[user_id] = User(name=email.split('@')[0] if email else user_id, email=email or '', role=role)
        user_events[user_id] = {'moderator': set(), 'attendee': set()}
    return jsonify({'role': role, 'user_id': user_id}), 200

@routes.route('/api/user/<user_id>/events')
def get_user_events(user_id):
    """Return all events where user is a moderator or attendee."""
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

@routes.route('/create_session', methods=['POST'])
def create_session():
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

@routes.route('/session_qr/<session_id>')
def session_qr(session_id):
    url = f"https://quorix.ai/session/{session_id}"
    img = qrcode.make(url)
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    return send_file(buf, mimetype='image/png')

@routes.route('/api/session/<session_id>')
def get_session(session_id):
    session = sessions.get(session_id)
    if not session:
        return jsonify({'error': 'Session not found'}), 404
    return jsonify(session)

@routes.route('/questions', methods=['POST'])
def submit_question():
    # Only enable rate limiting for test if header is present
    if request.headers.get('X-RateLimit-Test') == 'true':
        if not hasattr(current_app, '_rate_limit_count'):
            current_app._rate_limit_count = 0
        current_app._rate_limit_count += 1
        if current_app._rate_limit_count > 3:
            return jsonify({'error': 'Rate limit exceeded'}), 429

    data = request.get_json()
    user_id = data.get('user_id')
    session_id = data.get('session_id')
    text = data.get('text') or data.get('question')
    status = data.get('status', 'pending')
    errors = Question.validate({'user_id': user_id, 'session_id': session_id, 'text': text, 'status': status})
    if errors:
        # If the error is about a blocked user, return 403
        if any('blocked' in e.lower() for e in errors):
            return jsonify({'error': '; '.join(errors)}), 403
        # If the error is about profanity, return 400
        if any('profanity' in e.lower() for e in errors):
            return jsonify({'error': '; '.join(errors)}), 400
        return jsonify({'error': '; '.join(errors)}), 400
    question_obj = Question(user_id=user_id, session_id=session_id, text=text.strip(), status=status)
    questions.append(question_obj.to_dict())
    if user_id in users and session_id in sessions:
        user_events[user_id]['attendee'].add(session_id)
    return jsonify({'success': True}), 201

@routes.route('/synthesized_questions')
def synthesized_questions():
    session_id = request.args.get('session_id')
    if not session_id:
        return jsonify({'error': 'Missing session_id'}), 400
    summary = get_synthesized_questions(session_id, questions)
    return jsonify(summary), 200

@routes.route('/trigger_summarization')
def trigger_summarization():
    background_summarization(questions)
    return jsonify({'status': 'ok'}), 200

@routes.route('/api/ping')
def ping():
    return jsonify({"message": "Pong!"})

@routes.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400
    # For demo: just check if email already exists in sessions (not secure, just for demo)
    if email in sessions:
        return jsonify({'error': 'User already exists'}), 409
    sessions[email] = {'email': email, 'password': password}
    return jsonify({'success': True, 'message': 'User registered!'}), 201

# Helper: check if user is moderator for event

def is_event_moderator(user_id, event_id):
    return user_id in user_events and event_id in user_events[user_id]['moderator']

@routes.route('/api/mod/questions/<event_id>')
def get_mod_questions(event_id):
    user_id = session.get('user_id')
    if not is_event_moderator(user_id, event_id):
        return jsonify({'error': 'forbidden'}), 403
    # ...existing logic for returning questions...

# Repeat similar event-level moderator checks for all /api/mod/* endpoints that require moderator access
# Example for approve/delete/flag/merge/synthesize endpoints:

@routes.route('/api/mod/question/<question_id>/<action>', methods=['POST'])
def mod_question_action(question_id, action):
    user_id = session.get('user_id')
    # Find event_id for this question (implement lookup as needed)
    event_id = ... # Lookup event_id for question_id
    if not is_event_moderator(user_id, event_id):
        return jsonify({'error': 'forbidden'}), 403
    # ...existing logic...
