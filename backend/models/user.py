# User model for storing attendee/moderator/admin info
from datetime import datetime, timezone

class User:
    ROLES = {'attendee', 'moderator', 'admin', 'organizer'}

    def __init__(self, user_id, name, email, role='attendee', created_at=None):
        self.user_id = user_id
        self.name = name
        self.email = email
        self.role = role if role in self.ROLES else 'attendee'
        self.created_at = created_at or datetime.now(timezone.utc)

    def to_dict(self):
        return {
            'user_id': self.user_id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'created_at': self.created_at.isoformat()
        }

    @classmethod
    def validate(cls, data):
        errors = []
        if not data.get('user_id'):
            errors.append('user_id is required')
        if not data.get('name'):
            errors.append('name is required')
        if not data.get('email'):
            errors.append('email is required')
        role = data.get('role', 'attendee')
        if role not in cls.ROLES:
            errors.append(f'invalid role: {role}')
        return errors
