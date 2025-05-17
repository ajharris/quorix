from flask import Blueprint, request, jsonify
from backend.models import db, Message, User, Event
from flask import session as flask_session
from datetime import datetime, timezone

chat_routes = Blueprint('chat_routes', __name__)

# --- Get all messages for an event (real-time polling) ---
@chat_routes.route('/api/chat/<int:event_id>', methods=['GET'])
def get_chat_messages(event_id):
    messages = Message.query.filter_by(event_id=event_id).order_by(Message.timestamp.asc()).all()
    return jsonify([m.to_dict() for m in messages])

# --- Post a new message ---
@chat_routes.route('/api/chat/<int:event_id>', methods=['POST'])
def post_chat_message(event_id):
    user_id = flask_session.get('user_id') or request.json.get('user_id')
    text = request.json.get('text', '').strip()
    if not user_id or not text:
        return jsonify({'error': 'Missing user or text'}), 400
    user = User.query.get(user_id)
    event = Event.query.get(event_id)
    if not user or not event:
        return jsonify({'error': 'Invalid user or event'}), 404
    msg = Message(user_id=user_id, event_id=event_id, text=text)
    db.session.add(msg)
    db.session.commit()
    return jsonify(msg.to_dict()), 201
