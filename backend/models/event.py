# Event model for storing event/session metadata
from datetime import datetime, timezone

class Event:
    def __init__(self, event_id, title, start_time, description='', created_at=None):
        self.event_id = event_id
        self.title = title
        self.start_time = start_time  # ISO string or datetime
        self.description = description
        self.created_at = created_at or datetime.now(timezone.utc)

    def to_dict(self):
        return {
            'event_id': self.event_id,
            'title': self.title,
            'start_time': self.start_time if isinstance(self.start_time, str) else self.start_time.isoformat(),
            'description': self.description,
            'created_at': self.created_at.isoformat()
        }

    @classmethod
    def validate(cls, data):
        errors = []
        if not data.get('event_id'):
            errors.append('event_id is required')
        if not data.get('title'):
            errors.append('title is required')
        if not data.get('start_time'):
            errors.append('start_time is required')
        return errors
