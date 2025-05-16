from datetime import datetime, timezone
from backend.models.db import db
from backend.models.user_event_role import UserEventRole

# --- User Model ---
# Represents a user in the system. Used by SQLAlchemy ORM.
class User(db.Model):
    __tablename__ = 'users'
    # --- Columns ---
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False)
    email = db.Column(db.String(128), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    banned = db.Column(db.Boolean, default=False)
    ban_type = db.Column(db.String(16), nullable=True)  # 'permanent' or 'temporary'
    ban_until = db.Column(db.DateTime, nullable=True)  # for temporary bans

    # --- Remove single role field, add relationship to UserEventRole ---
    event_roles = db.relationship('UserEventRole', backref='user', lazy='dynamic')

    # --- Role options ---
    ROLES = {'attendee', 'moderator', 'admin', 'organizer', 'speaker'}

    def __init__(self, name, email, created_at=None, role=None, **kwargs):
        """
        Initialize a new User instance.
        - name: User's display name
        - email: User's email (must be unique)
        - created_at: Optional creation timestamp
        - role: (ignored, for compatibility)
        - kwargs: ignored
        """
        self.name = name
        self.email = email
        self.created_at = created_at or datetime.utcnow()

    def get_roles_for_event(self, event_id):
        """
        Return a set of roles this user has for a given event.
        """
        return set([uer.role for uer in self.event_roles.filter_by(event_id=event_id)])

    def to_dict(self):
        """
        Return a dictionary representation of the user for API responses.
        Includes ban info and ISO-formatted timestamps.
        """
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'banned': self.banned,
            'banType': self.ban_type,
            'banUntil': self.ban_until.isoformat() if self.ban_until else None
        }

    @classmethod
    def validate(cls, data):
        """
        Validate user data for creation or update.
        Returns a list of error messages (empty if valid).
        """
        errors = []
        if not data.get('name'):
            errors.append('name is required')
        if not data.get('email'):
            errors.append('email is required')
        return errors
