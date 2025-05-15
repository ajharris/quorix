from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

from backend.models.user import db  # Use the same db instance

class Question(db.Model):
    __tablename__ = 'questions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'), nullable=False)
    text = db.Column(db.String(500), nullable=False)
    status = db.Column(db.String(32), default='pending', nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    STATUS_VALUES = {'pending', 'approved', 'merged', 'deleted'}
    MAX_TEXT_LENGTH = 500

    def __init__(self, user_id, event_id, text, status='pending', timestamp=None):
        self.user_id = user_id
        self.event_id = event_id
        self.text = text
        self.status = status if status in self.STATUS_VALUES else 'pending'
        self.timestamp = timestamp or datetime.utcnow()

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'event_id': self.event_id,
            'text': self.text,
            'status': self.status,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }

    @classmethod
    def validate(cls, data):
        errors = []
        if not data.get('user_id'):
            errors.append('user_id is required')
        if not data.get('event_id'):
            errors.append('event_id is required')
        text = data.get('text')
        if not text or not text.strip():
            errors.append('text is required')
        elif len(text) > cls.MAX_TEXT_LENGTH:
            errors.append(f'text exceeds max length {cls.MAX_TEXT_LENGTH}')
        status = data.get('status', 'pending')
        if status not in cls.STATUS_VALUES:
            errors.append(f'invalid status: {status}')
        return errors
