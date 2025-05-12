from flask import Flask, jsonify, send_from_directory, request, send_file
from flask_cors import CORS
import os
import subprocess
import uuid
from datetime import datetime, timezone
import qrcode
import io

app = Flask(__name__, static_folder='../frontend/build', static_url_path='')
CORS(app, resources={r"/*": {"origins": "http://your-production-domain.com"}})

# In-memory session storage for demo/testing
sessions = {}

# In-memory question storage
questions = []

@app.route('/create_session', methods=['POST'])
def create_session():
    data = request.get_json()
    # Validate required fields
    title = data.get('title')
    start_time = data.get('start_time')
    description = data.get('description', '')
    if not title or not start_time:
        return jsonify({"error": "Missing required field: title and start_time are required."}), 400
    # Generate unique session ID
    while True:
        session_id = str(uuid.uuid4())
        if session_id not in sessions:
            break
    # Store session metadata
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

@app.route('/session_qr/<session_id>')
def session_qr(session_id):
    # Generate QR code for the event/session URL
    url = f"https://quorix.ai/session/{session_id}"
    img = qrcode.make(url)
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    return send_file(buf, mimetype='image/png')

@app.route('/api/session/<session_id>')
def get_session(session_id):
    session = sessions.get(session_id)
    if not session:
        return jsonify({'error': 'Session not found'}), 404
    return jsonify(session)

@app.route('/questions', methods=['POST'])
def submit_question():
    data = request.get_json()
    user_id = data.get('user_id')
    session_id = data.get('session_id')
    question_text = data.get('question')
    if not user_id or not session_id or not question_text or not question_text.strip():
        return jsonify({'error': 'Missing user, session, or question'}), 400
    # Optionally: check if session exists
    question_obj = {
        'user_id': user_id,
        'session_id': session_id,
        'question': question_text.strip(),
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'status': 'pending'
    }
    questions.append(question_obj)
    return jsonify({'success': True}), 200

@app.route('/api/ping')
def ping():
    return jsonify({"message": "Pong!"})

# Serve React's static files
@app.route('/')
@app.route('/<path:path>')
def serve_react(path=''):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

# Only build frontend if running as main app, not during import (e.g., for tests)
if __name__ == '__main__':
    FRONTEND_DIR = os.path.join(os.getcwd(), '..', 'frontend')  # adjust if needed
    print("Building React frontend...")
    subprocess.run(['npm', 'run', 'build'], cwd=FRONTEND_DIR)

    app.run(host='0.0.0.0', port=5000)
