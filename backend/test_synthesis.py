import pytest
from utils.synthesis import get_approved_questions, cluster_similar_questions, generate_synthesized_questions, get_synthesized_questions

def test_get_approved_questions_only_returns_approved():
    questions = [
        {'id': 1, 'session_id': 's1', 'status': 'approved'},
        {'id': 2, 'session_id': 's1', 'status': 'pending'},
        {'id': 3, 'session_id': 's2', 'status': 'approved'},
        {'id': 4, 'session_id': 's1', 'status': 'approved'},
    ]
    result = get_approved_questions('s1', questions)
    assert all(q['status'] == 'approved' and q['session_id'] == 's1' for q in result)
    assert {q['id'] for q in result} == {1, 4}

def test_cluster_similar_questions_groups_and_separates():
    questions = [
        {'text': 'What is the agenda?'},
        {'text': 'What will the agenda be?'},
        {'text': 'Will there be food?'},
        {'text': 'Is lunch provided?'}
    ]
    clusters = cluster_similar_questions(questions, threshold=0.6)
    # Should group the two agenda questions, and the two food questions
    assert any(len(cluster) > 1 for cluster in clusters)
    all_texts = [q['text'] for cluster in clusters for q in cluster]
    assert set(all_texts) == {q['text'] for q in questions}

def test_generate_synthesized_questions_returns_3_to_5():
    clusters = [
        [{'text': 'Q1'}],
        [{'text': 'Q2'}],
        [{'text': 'Q3'}],
        [{'text': 'Q4'}],
        [{'text': 'Q5'}],
        [{'text': 'Q6'}],
    ]
    result = generate_synthesized_questions(clusters)
    assert isinstance(result, list)
    assert 3 <= len(result) <= 5
    assert all(isinstance(q, str) for q in result)

def test_get_synthesized_questions_caching():
    questions = [
        {'id': 1, 'session_id': 's1', 'status': 'approved', 'text': 'Q1'},
        {'id': 2, 'session_id': 's1', 'status': 'approved', 'text': 'Q2'}
    ]
    out1 = get_synthesized_questions('s1', questions)
    out2 = get_synthesized_questions('s1', questions)
    assert out1 == out2  # Should be cached
    # Add a new approved question
    questions.append({'id': 3, 'session_id': 's1', 'status': 'approved', 'text': 'Q3'})
    out3 = get_synthesized_questions('s1', questions)
    assert out3 != out1

def test_generate_synthesized_questions_strings():
    clusters = [
        [{'text': 'What is the agenda?'}],
        [{'text': 'Will there be food?'}],
        [{'text': 'Is lunch provided?'}]
    ]
    result = generate_synthesized_questions(clusters)
    assert all(isinstance(q, str) and q for q in result)
