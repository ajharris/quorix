from datetime import datetime, timezone
from backend.models.db import db

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False)
    email = db.Column(db.String(128), unique=True, nullable=False)
    role = db.Column(db.String(32), default='attendee', nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    banned = db.Column(db.Boolean, default=False)
    ban_type = db.Column(db.String(16), nullable=True)  # 'permanent' or 'temporary'
    ban_until = db.Column(db.DateTime, nullable=True)  # for temporary bans

    ROLES = {'attendee', 'moderator', 'admin', 'organizer'}

    def __init__(self, name, email, role='attendee', created_at=None):
        self.name = name
        self.email = email
        self.role = role if role in self.ROLES else 'attendee'
        self.created_at = created_at or datetime.utcnow()

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'banned': self.banned,
            'banType': self.ban_type,
            'banUntil': self.ban_until.isoformat() if self.ban_until else None
        }

    @classmethod
    def validate(cls, data):
        errors = []
        if not data.get('name'):
            errors.append('name is required')
        if not data.get('email'):
            errors.append('email is required')
        role = data.get('role', 'attendee')
        if role not in cls.ROLES:
            errors.append(f'invalid role: {role}')
        return errors
