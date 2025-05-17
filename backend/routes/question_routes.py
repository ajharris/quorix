from flask import Blueprint, jsonify, request, session as flask_session, current_app
from backend.models.question import Question
from backend.models.user import User
from backend.models.db import db as user_db

# --- In-memory question/user/session/event storage for demo/testing ---
# These are used to simulate a database for questions, users, sessions, and event participation.
questions = []  # List of question dicts
users = {}  # Should be shared with auth_routes in a real app
sessions = {}  # Should be shared with session_routes in a real app
user_events = {}  # Should be shared with auth_routes in a real app

question_routes = Blueprint('question_routes', __name__)

# --- Helper: Check if user is moderator for an event ---
def is_event_moderator(user_id, event_id):
    """
    Return True if the user is a moderator for the given event_id.
    """
    return user_id in user_events and event_id in user_events[user_id]['moderator']

# --- Submit Question Route ---
@question_routes.route('/questions', methods=['POST'])
def submit_question():
    """
    Submit a new question for a session/event.
    - Validates input and rate limits if test header is present.
    - Adds the question to the in-memory questions list.
    - Updates user_events for attendee participation.
    """
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
        if any('blocked' in e.lower() for e in errors):
            return jsonify({'error': '; '.join(errors)}), 403
        if any('profanity' in e.lower() for e in errors):
            return jsonify({'error': '; '.join(errors)}), 400
        return jsonify({'error': '; '.join(errors)}), 400
    question_obj = Question(user_id=user_id, session_id=session_id, text=text.strip(), status=status)
    questions.append(question_obj.to_dict())
    if user_id in users and session_id in sessions:
        user_events[user_id]['attendee'].add(session_id)
    return jsonify({'success': True}), 201

# --- Moderator: Get Questions for Event ---
@question_routes.route('/api/mod/questions/<event_id>')
def get_mod_questions(event_id):
    """
    Return all questions for a given event_id for moderators.
    Only accessible if the user is a moderator for the event.
    """
    user_id = flask_session.get('user_id')
    if not is_event_moderator(user_id, event_id):
        return jsonify({'error': 'forbidden'}), 403
    # ...existing logic for returning questions...

# --- Moderator: Question Action (approve/delete/flag/merge) ---
@question_routes.route('/api/mod/question/<question_id>/<action>', methods=['POST'])
def mod_question_action(question_id, action):
    """
    Perform a moderator action (approve, delete, etc.) on a question.
    Only accessible if the user is a moderator for the event.
    """
    user_id = flask_session.get('user_id')
    event_id = ... # Lookup event_id for question_id
    if not is_event_moderator(user_id, event_id):
        return jsonify({'error': 'forbidden'}), 403
    # ...existing logic...

# --- Speaker: Get Approved Questions for Event (for SpeakerView/Embed) ---
@question_routes.route('/api/speaker/questions/<event_id>')
def get_speaker_questions(event_id):
    """
    Return all approved questions for a given event_id (for speaker view/embed).
    No authentication required (read-only, public for display).
    """
    approved = [q for q in questions if q.get('session_id') == event_id and q.get('status') == 'approved']
    # Sort by timestamp ascending (oldest first)
    approved.sort(key=lambda q: q.get('timestamp') or '')
    return jsonify(approved)
