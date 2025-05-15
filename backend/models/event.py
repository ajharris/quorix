from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

from backend.models.user import db  # Use the same db instance

class Event(db.Model):
    __tablename__ = 'events'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(256), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    description = db.Column(db.Text, default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def __init__(self, title, start_time, description='', created_at=None):
        self.title = title
        self.start_time = start_time
        self.description = description
        self.created_at = created_at or datetime.utcnow()

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
