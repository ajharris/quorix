from datetime import datetime, timezone
from backend.models.db import db

# --- Message Model ---
# Represents a chat message tied to a user and event (session).
class Message(db.Model):
    __tablename__ = 'messages'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'), nullable=False)
    text = db.Column(db.String(1000), nullable=False)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    def __init__(self, user_id, event_id, text, timestamp=None):
        self.user_id = user_id
        self.event_id = event_id
        self.text = text
        self.timestamp = timestamp or datetime.now(timezone.utc)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'event_id': self.event_id,
            'text': self.text,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }
