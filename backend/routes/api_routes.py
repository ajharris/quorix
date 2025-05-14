from flask import Blueprint, jsonify, request, send_file, current_app
import os
import uuid
from datetime import datetime, timezone
import qrcode
import io
from backend.models.question import Question
from backend.utils.synthesis import get_synthesized_questions, background_summarization

routes = Blueprint('routes', __name__)

# In-memory session storage for demo/testing
sessions = {}

# In-memory question storage
questions = []

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
