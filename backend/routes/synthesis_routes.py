from flask import Blueprint, jsonify, request
from backend.utils.synthesis import get_synthesized_questions, background_summarization

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
