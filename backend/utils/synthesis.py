# Synthesis and clustering logic for questions
import os
import openai
from collections import defaultdict
from difflib import SequenceMatcher

# Set your OpenAI API key (for demo, use env var)
openai.api_key = os.getenv('OPENAI_API_KEY', 'sk-demo')

_synth_cache = {}  # session_id -> {'questions': [...], 'summary': [...], 'last_update': timestamp}

def get_approved_questions(session_id, all_questions):
    """Return only approved questions for a session."""
    return [q for q in all_questions if q.get('session_id') == session_id and q.get('status') == 'approved']

def cluster_similar_questions(questions, threshold=0.7):
    """Group similar questions using simple string similarity."""
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

def generate_synthesized_questions(clusters):
    """Call OpenAI to generate 3–5 synthesized questions from clusters."""
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

def get_synthesized_questions(session_id, all_questions):
    """Return cached or newly synthesized questions for a session."""
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
    _synth_cache[session_id] = {'questions': approved_ids, 'summary': summary}
    return summary

def background_summarization(all_questions):
    """Simulate periodic background summarization for all sessions."""
    session_ids = set(q['session_id'] for q in all_questions if q['status'] == 'approved')
    for session_id in session_ids:
        get_synthesized_questions(session_id, all_questions)
