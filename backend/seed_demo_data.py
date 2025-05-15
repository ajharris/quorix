import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from datetime import datetime, timedelta
from backend.models.db import db
from backend.models.user import User
from backend.models.event import Event
from backend.models.question import Question
from flask import Flask

# Use the same config logic as app.py for demo mode
app = Flask(__name__)
db_url = 'sqlite:///demo.db'
app.config['SQLALCHEMY_DATABASE_URI'] = db_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

with app.app_context():
    db.drop_all()
    db.create_all()

    # Seed users
    users = [
        User(name='Alice', email='alice@example.com', role='attendee'),
        User(name='Bob', email='bob@example.com', role='moderator'),
        User(name='Carol', email='carol@example.com', role='admin'),
    ]
    db.session.add_all(users)
    db.session.commit()

    # Seed events
    now = datetime.utcnow()
    events = [
        Event(title='Demo Event 1', start_time=now + timedelta(days=1), description='First demo event'),
        Event(title='Demo Event 2', start_time=now + timedelta(days=2), description='Second demo event'),
    ]
    db.session.add_all(events)
    db.session.commit()

    # Seed questions
    questions = [
        Question(user_id=users[0].id, event_id=events[0].id, text='What is the schedule?', status='pending'),
        Question(user_id=users[1].id, event_id=events[0].id, text='How do I join?', status='approved'),
        Question(user_id=users[2].id, event_id=events[1].id, text='Is there a recording?', status='pending'),
    ]
    db.session.add_all(questions)
    db.session.commit()

    print('Demo database seeded with users, events, and questions.')
