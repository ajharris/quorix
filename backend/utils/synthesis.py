# Synthesis and clustering logic for questions
# This module provides utilities for grouping similar questions and generating synthesized questions using OpenAI or a mock.
import os
import openai
from collections import defaultdict
from difflib import SequenceMatcher

# --- OpenAI API Key Setup ---
# Set your OpenAI API key (for demo, use env var or a default demo key)
openai.api_key = os.getenv('OPENAI_API_KEY', 'sk-demo')

# --- In-memory cache for synthesized questions ---
# session_id -> {'questions': [...], 'summary': [...], 'last_update': timestamp}
_synth_cache = {}

# --- In-memory storage for approved/rejected synthesized questions ---
# This would be a database table in a production app
# Structure: {session_id: {question_id: {'text': '...', 'approved': True/False}}}
_synth_approved = {}

# --- Utility: Get Approved Questions ---
def get_approved_questions(session_id, all_questions):
    """
    Return only approved questions for a given session_id from all_questions.
    """
    return [q for q in all_questions if q.get('session_id') == session_id and q.get('status') == 'approved']

# --- Utility: Cluster Similar Questions ---
def cluster_similar_questions(questions, threshold=0.7):
    """
    Group similar questions using simple string similarity (SequenceMatcher).
    Returns a list of clusters (each cluster is a list of questions).
    """
    clusters = []
    for q in questions:
        placed = False
        for cluster in clusters:
            if SequenceMatcher(None, q['text'], cluster[0]['text']).ratio() > threshold:
                cluster.append(q)
                placed = True
                break
        if not placed:
            clusters.append([q])
    return clusters

# --- Utility: Generate Synthesized Questions (OpenAI or Mock) ---
def generate_synthesized_questions(clusters):
    """
    Call OpenAI to generate 3–5 synthesized questions from clusters.
    If no API key is set, returns mock output for demo/testing.
    """
    prompts = [f"Cluster {i+1}: " + '; '.join(q['text'] for q in cluster) for i, cluster in enumerate(clusters)]
    prompt = ("Given these clusters of similar audience questions, write 3 to 5 clean, concise, non-redundant questions that best represent the main topics. Only output the questions as a numbered list.\n" + '\n'.join(prompts))
    # For demo, return mock output if no API key
    if openai.api_key == 'sk-demo':
        return [f"Synthesized Q{i+1}" for i in range(min(5, max(3, len(clusters))))]
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=256,
        temperature=0.3,
    )
    lines = response['choices'][0]['message']['content'].split('\n')
    questions = [line.lstrip('12345. ').strip() for line in lines if line.strip()]
    return [q for q in questions if q]

# --- Main API: Get Synthesized Questions (with Caching) ---
def get_synthesized_questions(session_id, all_questions):
    """
    Return cached or newly synthesized questions for a session.
    Uses get_approved_questions, clustering, and generate_synthesized_questions.
    Adds randomness to mock output for test/demo.
    """
    approved = get_approved_questions(session_id, all_questions)
    cache = _synth_cache.get(session_id)
    approved_ids = [q['id'] for q in approved]
    if cache and cache['questions'] == approved_ids:
        return cache['summary']
    clusters = cluster_similar_questions(approved)
    # Add randomness to mock output for test
    import random
    summary = generate_synthesized_questions(clusters)
    if openai.api_key == 'sk-demo':
        summary = [f"Synthesized Q{i+1} ({random.randint(0,9999)})" for i in range(min(5, max(3, len(clusters))))]
    
    # Format questions as objects with IDs
    formatted_summary = []
    for i, question in enumerate(summary):
        # Generate a stable ID for each question
        question_id = f"{session_id}-synth-{i}"
        formatted_summary.append({
            'id': question_id,
            'text': question,
            'approved': False  # Default not approved
        })
        
        # Check if this question was previously approved/rejected
        if session_id in _synth_approved and question_id in _synth_approved[session_id]:
            # Keep the approved status but update the text if needed
            _synth_approved[session_id][question_id]['text'] = question
        else:
            # Initialize in our approval tracking
            if session_id not in _synth_approved:
                _synth_approved[session_id] = {}
            _synth_approved[session_id][question_id] = {
                'text': question,
                'approved': False
            }
    
    _synth_cache[session_id] = {'questions': approved_ids, 'summary': formatted_summary}
    return formatted_summary

# --- Synthesized Questions Approval Functions ---
def approve_synthesized_question(session_id, question_id):
    """
    Mark a synthesized question as approved for showing to audience
    """
    if session_id in _synth_approved and question_id in _synth_approved[session_id]:
        _synth_approved[session_id][question_id]['approved'] = True
        return True
    return False

def reject_synthesized_question(session_id, question_id):
    """
    Mark a synthesized question as rejected (will not show to audience)
    """
    if session_id in _synth_approved and question_id in _synth_approved[session_id]:
        _synth_approved[session_id][question_id]['approved'] = False
        return True
    return False

def edit_synthesized_question(session_id, question_id, new_text):
    """
    Edit the text of a synthesized question
    """
    if session_id in _synth_approved and question_id in _synth_approved[session_id]:
        _synth_approved[session_id][question_id]['text'] = new_text
        return True
    return False

def get_approved_synthesized_questions(session_id):
    """
    Get only the approved synthesized questions for a session
    """
    if session_id not in _synth_approved:
        return []
    
    approved_questions = []
    for question_id, question_data in _synth_approved[session_id].items():
        if question_data['approved']:
            approved_questions.append({
                'id': question_id,
                'text': question_data['text'],
                'approved': True
            })
    
    return approved_questions

# --- Background Summarization Utility ---
def background_summarization(all_questions):
    """
    Simulate periodic background summarization for all sessions.
    Calls get_synthesized_questions for each session with approved questions.
    """
    session_ids = set(q['session_id'] for q in all_questions if q['status'] == 'approved')
    for session_id in session_ids:
        get_synthesized_questions(session_id, all_questions)
