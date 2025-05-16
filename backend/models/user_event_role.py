from backend.models.db import db

# --- UserEventRole Model ---
# Associates a user with an event and a role (attendee, moderator, organizer, speaker)
class UserEventRole(db.Model):
    __tablename__ = 'user_event_roles'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'), nullable=False)
    role = db.Column(db.String(32), nullable=False)

    __table_args__ = (
        db.UniqueConstraint('user_id', 'event_id', 'role', name='uq_user_event_role'),
    )

    def __init__(self, user_id, event_id, role):
        self.user_id = user_id
        self.event_id = event_id
        self.role = role

    def to_dict(self):
        return {
            'user_id': self.user_id,
            'event_id': self.event_id,
            'role': self.role
        }
