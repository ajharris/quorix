from datetime import datetime, timezone
from backend.models.db import db  # Use the same db instance

# --- Question Model ---
# Represents a question submitted by a user for a session/event. Used by SQLAlchemy ORM.
class Question(db.Model):
    __tablename__ = 'questions'
    __table_args__ = {'extend_existing': True}
    # --- Columns ---
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(128), nullable=False)
    session_id = db.Column(db.String(128), nullable=False)
    text = db.Column(db.String(500), nullable=False)
    status = db.Column(db.String(32), default='pending', nullable=False)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    exclude_from_ai = db.Column(db.Boolean, default=False, nullable=False)

    # --- Status and validation constants ---
    STATUS_VALUES = {'pending', 'approved', 'merged', 'deleted'}
    MAX_TEXT_LENGTH = 500

    def __init__(self, user_id, session_id, text, status='pending', timestamp=None):
        """
        Initialize a new Question instance.
        - user_id: ID of the user who submitted the question
        - session_id: ID of the session/event
        - text: The question text
        - status: Question status (default: pending)
        - timestamp: Optional timestamp (default: now)
        """
        self.user_id = user_id
        self.session_id = session_id
        self.text = text
        self.status = status if status in self.STATUS_VALUES else 'pending'
        self.timestamp = timestamp or datetime.now(timezone.utc)

    def to_dict(self):
        """
        Return a dictionary representation of the question for API responses.
        Includes ISO-formatted timestamps.
        """
        return {
            'id': getattr(self, 'id', None),
            'user_id': self.user_id,
            'session_id': self.session_id,
            'text': self.text,
            'status': self.status,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'exclude_from_ai': getattr(self, 'exclude_from_ai', False)
        }

    @classmethod
    def validate(cls, data):
        """
        Validate question data for creation or update.
        Returns a list of error messages (empty if valid).
        """
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
