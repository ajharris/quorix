from datetime import datetime
from backend.models.db import db  # Use the same db instance

# --- Event Model ---
# Represents an event/session in the system. Used by SQLAlchemy ORM.
class Event(db.Model):
    __tablename__ = 'events'
    # --- Columns ---
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(256), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    description = db.Column(db.Text, default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def __init__(self, title, start_time, description='', created_at=None):
        """
        Initialize a new Event instance.
        - title: Event title
        - start_time: Event start datetime
        - description: Optional event description
        - created_at: Optional creation timestamp
        """
        self.title = title
        self.start_time = start_time
        self.description = description
        self.created_at = created_at or datetime.utcnow()

    def to_dict(self):
        """
        Return a dictionary representation of the event for API responses.
        Includes ISO-formatted timestamps.
        """
        return {
            'id': self.id,
            'title': self.title,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
