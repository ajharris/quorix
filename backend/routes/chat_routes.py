from flask import Blueprint, request, jsonify, current_app
from backend.models import db, Message, User, Event
from flask import session as flask_session
from datetime import datetime, timezone
from backend.routes.question_routes import is_event_moderator

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
    # Check mute/expel status
    mutes = current_app.config.get('mutes', {})
    expelled = current_app.config.get('expelled', {})
    now = datetime.utcnow().timestamp()
    if event_id in expelled and user_id in expelled[event_id]:
        return jsonify({'error': 'You have been expelled from this chat.'}), 403
    if event_id in mutes and user_id in mutes[event_id] and mutes[event_id][user_id] > now:
        return jsonify({'error': 'You are muted.'}), 403
    msg = Message(user_id=user_id, event_id=event_id, text=text)
    db.session.add(msg)
    db.session.commit()
    return jsonify(msg.to_dict()), 201

@chat_routes.route('/api/mod/chat/message/<int:message_id>/delete', methods=['POST'])
def mod_delete_message(message_id):
    """
    Moderator deletes a chat message by ID.
    """
    user_id = flask_session.get('user_id')
    # Lookup message and event
    msg = Message.query.get(message_id)
    if not msg:
        return jsonify({'error': 'not found'}), 404
    # Check moderator rights
    if not is_event_moderator(user_id, msg.event_id):
        return jsonify({'error': 'forbidden'}), 403
    db.session.delete(msg)
    db.session.commit()
    return jsonify({'success': True})

@chat_routes.route('/api/mod/chat/user/<int:event_id>/<int:user_id>/mute', methods=['POST'])
def mod_mute_user(event_id, user_id):
    """
    Moderator mutes a user for this event (duration in minutes).
    """
    mod_id = flask_session.get('user_id')
    if not is_event_moderator(mod_id, event_id):
        return jsonify({'error': 'forbidden'}), 403
    data = request.get_json() or {}
    duration = int(data.get('duration', 10))  # default 10 min
    # Store mute in a simple in-memory dict for demo; use DB in prod
    if 'mutes' not in current_app.config:
        current_app.config['mutes'] = {}
    mutes = current_app.config['mutes']
    mutes.setdefault(event_id, {})[user_id] = datetime.utcnow().timestamp() + duration * 60
    return jsonify({'success': True, 'muted_until': mutes[event_id][user_id]})

@chat_routes.route('/api/mod/chat/user/<int:event_id>/<int:user_id>/expel', methods=['POST'])
def mod_expel_user(event_id, user_id):
    """
    Moderator expels a user from the event chat.
    """
    mod_id = flask_session.get('user_id')
    if not is_event_moderator(mod_id, event_id):
        return jsonify({'error': 'forbidden'}), 403
    # Store expel in a simple in-memory dict for demo; use DB in prod
    if 'expelled' not in current_app.config:
        current_app.config['expelled'] = {}
    expelled = current_app.config['expelled']
    expelled.setdefault(event_id, set()).add(user_id)
    return jsonify({'success': True})
