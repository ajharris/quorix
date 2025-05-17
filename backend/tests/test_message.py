import pytest
from backend.models import db, Message, User, Event
from datetime import datetime, timezone

@pytest.fixture
def sample_user(session):
    user = User(name='Chat User', email='chatuser@example.com')
    db.session.add(user)
    db.session.commit()
    return user

@pytest.fixture
def sample_event(session):
    event = Event(title='Chat Event', start_time=datetime.now(timezone.utc))
    db.session.add(event)
    db.session.commit()
    return event

def test_message_creation_and_to_dict(session, sample_user, sample_event):
    msg = Message(user_id=sample_user.id, event_id=sample_event.id, text='Hello world!')
    db.session.add(msg)
    db.session.commit()
    assert msg.id is not None
    assert msg.text == 'Hello world!'
    assert msg.user_id == sample_user.id
    assert msg.event_id == sample_event.id
    assert isinstance(msg.timestamp, datetime)
    d = msg.to_dict()
    assert d['id'] == msg.id
    assert d['user_id'] == sample_user.id
    assert d['event_id'] == sample_event.id
    assert d['text'] == 'Hello world!'
    assert isinstance(d['timestamp'], str)

def test_message_requires_fields(session, sample_user, sample_event):
    with pytest.raises(TypeError):
        Message()
    with pytest.raises(TypeError):
        Message(user_id=sample_user.id)
    with pytest.raises(TypeError):
        Message(event_id=sample_event.id)
    # Text required
    with pytest.raises(TypeError):
        Message(user_id=sample_user.id, event_id=sample_event.id)
