from flask import Blueprint, jsonify, request, session as flask_session
from backend.utils.synthesis import (
    get_synthesized_questions, 
    background_summarization,
    approve_synthesized_question,
    reject_synthesized_question,
    edit_synthesized_question,
    get_approved_synthesized_questions
)
from backend.routes.question_routes import is_event_moderator

# --- In-memory questions list for demo/testing ---
# This should be shared with question_routes in a real app.
questions = []

synthesis_routes = Blueprint('synthesis_routes', __name__)

# --- Get Synthesized Questions Route ---
@synthesis_routes.route('/synthesized_questions')
def synthesized_questions():
    """
    Return synthesized (AI-generated/clustered) questions for a session.
    - Uses get_synthesized_questions utility to generate or fetch cached summary.
    - Expects session_id as a query parameter.
    """
    session_id = request.args.get('session_id')
    if not session_id:
        return jsonify({'error': 'Missing session_id'}), 400
    summary = get_synthesized_questions(session_id, questions)
    return jsonify(summary), 200

# --- Trigger Background Summarization Route ---
@synthesis_routes.route('/trigger_summarization')
def trigger_summarization():
    """
    Trigger background summarization for all sessions.
    - Calls background_summarization utility on the in-memory questions list.
    """
    background_summarization(questions)
    return jsonify({'status': 'ok'})

# --- Moderator Routes for Synthesized Questions ---
@synthesis_routes.route('/api/mod/questions/synthesized/<session_id>')
def get_mod_synthesized_questions(session_id):
    """
    Get all synthesized questions for moderator review
    """
    user_id = flask_session.get('user_id')
    if user_id and not is_event_moderator(user_id, session_id):
        return jsonify({'error': 'forbidden'}), 403
    
    synthesized = get_synthesized_questions(session_id, questions)
    return jsonify(synthesized)

@synthesis_routes.route('/api/mod/questions/synthesized/<session_id>/approve/<question_id>', methods=['POST'])
def approve_synth_question(session_id, question_id):
    """
    Approve a synthesized question for audience view
    """
    user_id = flask_session.get('user_id')
    if not user_id or not is_event_moderator(user_id, session_id):
        return jsonify({'error': 'forbidden'}), 403
    
    success = approve_synthesized_question(session_id, question_id)
    if not success:
        return jsonify({'error': 'Question not found'}), 404
    
    return jsonify({'success': True})

@synthesis_routes.route('/api/mod/questions/synthesized/<session_id>/reject/<question_id>', methods=['POST'])
def reject_synth_question(session_id, question_id):
    """
    Reject a synthesized question
    """
    user_id = flask_session.get('user_id')
    if not user_id or not is_event_moderator(user_id, session_id):
        return jsonify({'error': 'forbidden'}), 403
    
    success = reject_synthesized_question(session_id, question_id)
    if not success:
        return jsonify({'error': 'Question not found'}), 404
    
    return jsonify({'success': True})

@synthesis_routes.route('/api/mod/questions/synthesized/<session_id>/edit/<question_id>', methods=['POST'])
def edit_synth_question(session_id, question_id):
    """
    Edit a synthesized question text
    """
    user_id = flask_session.get('user_id')
    if not user_id or not is_event_moderator(user_id, session_id):
        return jsonify({'error': 'forbidden'}), 403
    
    data = request.get_json() or {}
    new_text = data.get('text')
    if not new_text:
        return jsonify({'error': 'Text is required'}), 400
    
    success = edit_synthesized_question(session_id, question_id, new_text)
    if not success:
        return jsonify({'error': 'Question not found'}), 404
    
    return jsonify({'success': True})

# --- Public Routes for Approved Synthesized Questions ---
@synthesis_routes.route('/api/audience/questions/synthesized/<session_id>')
def get_audience_synthesized_questions(session_id):
    """
    Get only the approved synthesized questions for audience view
    No authentication required - this is a public endpoint for display
    """
    approved_questions = get_approved_synthesized_questions(session_id)
    return jsonify(approved_questions)
