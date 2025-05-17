from flask import Blueprint, jsonify, request, session as flask_session
from backend.models.user import User
from backend.models.event import Event
from backend.models.question import Question
from backend.models.db import db as user_db
from datetime import datetime, timedelta

# --- Admin routes for user, question, and event management ---
# These routes are only accessible to users with the 'admin' role (checked via session).
admin_routes = Blueprint('admin_routes', __name__)

# --- List All Users (Admin Only) ---
@admin_routes.route('/api/admin/users', methods=['GET'])
def admin_list_users():
    """
    Return a list of all users in the database.
    Only accessible to admin users.
    """
    if flask_session.get('role') != 'admin':
        return jsonify({'error': 'forbidden'}), 403
    users_list = User.query.all()
    return jsonify([u.to_dict() for u in users_list])

# --- Update User Role (Admin Only) ---
@admin_routes.route('/api/admin/users/<int:user_id>/role', methods=['POST'])
def admin_update_user_role(user_id):
    """
    Update the role of a user (admin, moderator, etc.).
    Only accessible to admin users.
    """
    if flask_session.get('role') != 'admin':
        return jsonify({'error': 'forbidden'}), 403
    data = request.get_json()
    new_role = data.get('role')
    if new_role not in User.ROLES:
        return jsonify({'error': 'invalid role'}), 400
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'user not found'}), 404
    user.role = new_role
    user_db.session.commit()
    return jsonify({'success': True, 'user': user.to_dict()})

# --- List All Questions (Admin Only) ---
@admin_routes.route('/api/admin/questions')
def admin_list_questions():
    """
    Return a list of all questions, optionally filtered by event_id.
    Only accessible to admin users.
    """
    if flask_session.get('role') != 'admin':
        return jsonify({'error': 'forbidden'}), 403
    event_id = request.args.get('event_id')
    q = Question.query
    if event_id:
        q = q.filter_by(session_id=event_id)  # FIX: use session_id, not event_id
    questions = q.all()
    result = []
    for qu in questions:
        event = Event.query.get(qu.session_id)  # FIX: use session_id, not event_id
        user = User.query.get(qu.user_id)
        result.append({
            **qu.to_dict(),
            'event_title': event.title if event else qu.session_id,  # FIX: use session_id
            'user_name': user.name if user else qu.user_id
        })
    return jsonify(result)

# --- List All Events (Admin Only) ---
@admin_routes.route('/api/admin/events')
def admin_list_events():
    """
    Return a list of all events in the database.
    Only accessible to admin users.
    """
    if flask_session.get('role') != 'admin':
        return jsonify({'error': 'forbidden'}), 403
    events = Event.query.all()
    return jsonify([{'id': e.id, 'title': e.title, 'name': getattr(e, 'name', None)} for e in events])

# --- Ban/Unban Users (Admin and Moderator) ---
@admin_routes.route('/api/admin/users/<int:user_id>/ban', methods=['POST'])
def admin_ban_user(user_id):
    """
    Ban a user (permanent or temporary) as an admin.
    Only accessible to admin users.
    """
    if flask_session.get('role') != 'admin':
        return jsonify({'error': 'forbidden'}), 403
    data = request.get_json()
    ban_type = data.get('type', 'permanent')
    duration = data.get('duration')
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'user not found'}), 404
    user.banned = True
    user.ban_type = ban_type
    if ban_type == 'temporary' and duration:
        try:
            hours = int(duration)
            user.ban_until = datetime.utcnow() + timedelta(hours=hours)
        except Exception:
            return jsonify({'error': 'invalid duration'}), 400
    else:
        user.ban_until = None
    user_db.session.commit()
    return jsonify({'success': True, 'user': user.to_dict()})

@admin_routes.route('/api/admin/users/<int:user_id>/unban', methods=['POST'])
def admin_unban_user(user_id):
    """
    Unban a user as an admin.
    Only accessible to admin users.
    """
    if flask_session.get('role') != 'admin':
        return jsonify({'error': 'forbidden'}), 403
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'user not found'}), 404
    user.banned = False
    user.ban_type = None
    user.ban_until = None
    user_db.session.commit()
    return jsonify({'success': True, 'user': user.to_dict()})

@admin_routes.route('/api/mod/users/<int:user_id>/ban', methods=['POST'])
def mod_ban_user(user_id):
    """
    Ban a user as a moderator (permanent or temporary).
    Only accessible to moderator users.
    """
    if flask_session.get('role') != 'moderator':
        return jsonify({'error': 'forbidden'}), 403
    data = request.get_json()
    ban_type = data.get('type', 'permanent')
    duration = data.get('duration')
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'user not found'}), 404
    user.banned = True
    user.ban_type = ban_type
    if ban_type == 'temporary' and duration:
        try:
            hours = int(duration)
            user.ban_until = datetime.utcnow() + timedelta(hours=hours)
        except Exception:
            return jsonify({'error': 'invalid duration'}), 400
    else:
        user.ban_until = None
    user_db.session.commit()
    return jsonify({'success': True, 'user': user.to_dict()})

@admin_routes.route('/api/mod/users/<int:user_id>/unban', methods=['POST'])
def mod_unban_user(user_id):
    """
    Unban a user as a moderator.
    Only accessible to moderator users.
    """
    if flask_session.get('role') != 'moderator':
        return jsonify({'error': 'forbidden'}), 403
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'user not found'}), 404
    user.banned = False
    user.ban_type = None
    user.ban_until = None
    user_db.session.commit()
    return jsonify({'success': True, 'user': user.to_dict()})
