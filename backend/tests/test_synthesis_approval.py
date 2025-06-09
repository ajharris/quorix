import pytest
from backend.utils.synthesis import (
    approve_synthesized_question,
    reject_synthesized_question,
    edit_synthesized_question,
    get_approved_synthesized_questions,
    _synth_approved
)

def test_approve_reject_synthesized_question():
    # Clear any existing data
    session_id = 'test-session'
    question_id = 'test-question'
    
    # Set up test data
    if session_id not in _synth_approved:
        _synth_approved[session_id] = {}
    
    _synth_approved[session_id][question_id] = {
        'text': 'Test question',
        'approved': False
    }
    
    # Test approval
    assert approve_synthesized_question(session_id, question_id) == True
    assert _synth_approved[session_id][question_id]['approved'] == True
    
    # Test rejection
    assert reject_synthesized_question(session_id, question_id) == True
    assert _synth_approved[session_id][question_id]['approved'] == False
    
    # Test non-existent question
    assert approve_synthesized_question(session_id, 'nonexistent') == False
    assert reject_synthesized_question(session_id, 'nonexistent') == False

def test_edit_synthesized_question():
    session_id = 'test-session'
    question_id = 'test-question'
    
    # Set up test data
    if session_id not in _synth_approved:
        _synth_approved[session_id] = {}
    
    _synth_approved[session_id][question_id] = {
        'text': 'Original text',
        'approved': False
    }
    
    # Test editing
    assert edit_synthesized_question(session_id, question_id, 'New text') == True
    assert _synth_approved[session_id][question_id]['text'] == 'New text'
    
    # Test non-existent question
    assert edit_synthesized_question(session_id, 'nonexistent', 'Text') == False

def test_get_approved_synthesized_questions():
    session_id = 'test-session'
    
    # Set up test data
    if session_id not in _synth_approved:
        _synth_approved[session_id] = {}
    
    _synth_approved[session_id] = {
        'q1': {'text': 'Question 1', 'approved': True},
        'q2': {'text': 'Question 2', 'approved': False},
        'q3': {'text': 'Question 3', 'approved': True}
    }
    
    # Test getting approved questions
    approved = get_approved_synthesized_questions(session_id)
    assert len(approved) == 2
    assert all(q['approved'] for q in approved)
    assert set(q['id'] for q in approved) == {'q1', 'q3'}
    
    # Test empty session
    assert get_approved_synthesized_questions('nonexistent') == []
