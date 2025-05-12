# Question model for storing attendee questions
from datetime import datetime, timezone

class Question:
    STATUS_VALUES = {'pending', 'approved', 'merged', 'deleted'}
    MAX_TEXT_LENGTH = 500

    def __init__(self, user_id, session_id, text, status='pending', timestamp=None):
        self.id = None  # to be set by DB or storage
        self.user_id = user_id
        self.session_id = session_id
        self.text = text
        self.status = status if status in self.STATUS_VALUES else 'pending'
        self.timestamp = timestamp or datetime.now(timezone.utc)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'session_id': self.session_id,
            'text': self.text,
            'status': self.status,
            'timestamp': self.timestamp.isoformat()
        }

    @classmethod
    def validate(cls, data):
        errors = []
        if not data.get('user_id'):
            errors.append('user_id is required')
        if not data.get('session_id'):
            errors.append('session_id is required')
        text = data.get('text')
        if not text or not text.strip():
            errors.append('text is required')
        elif len(text) > cls.MAX_TEXT_LENGTH:
            errors.append(f'text exceeds max length {cls.MAX_TEXT_LENGTH}')
        status = data.get('status', 'pending')
        if status not in cls.STATUS_VALUES:
            errors.append(f'invalid status: {status}')
        return errors
