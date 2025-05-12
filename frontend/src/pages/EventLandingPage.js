import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';

function QuestionForm({ user, sessionId }) {
  const [question, setQuestion] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!question.trim()) {
      setError('Question cannot be empty.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          session_id: sessionId,
          question: question.trim(),
        }),
      });
      if (res.ok) {
        setQuestion('');
        setSuccess('Question submitted!');
      } else {
        const data = await res.json();
        setError(data.error || 'Submission failed.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="question">Ask a question:</label>
      <textarea
        id="question"
        value={question}
        onChange={e => setQuestion(e.target.value)}
        rows={3}
        style={{ width: '100%' }}
        disabled={submitting}
      />
      <button type="submit" disabled={submitting}>
        Submit
      </button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {success && <div style={{ color: 'green' }}>{success}</div>}
    </form>
  );
}

function QuestionList({ sessionId }) {
  const [questions, setQuestions] = useState([]); // Initialize as an empty array
  const [error, setError] = useState('');
  const intervalRef = useRef();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch(`/api/questions/${sessionId}`);
        if (!res.ok) throw new Error('Failed to fetch questions');
        const data = await res.json();
        setQuestions(Array.isArray(data) ? data : []); // Ensure questions is always an array
      } catch (err) {
        setError('Failed to load questions.');
        setQuestions([]); // Clear questions on error
      }
    };

    fetchQuestions();
    intervalRef.current = setInterval(fetchQuestions, 5000); // Poll every 5 seconds
    return () => clearInterval(intervalRef.current); // Cleanup polling on unmount
  }, [sessionId]);

  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  // Sort questions by timestamp descending
  const sortedQuestions = [...questions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Helper to get initials from user (string or object)
  const getInitials = (user) => {
    if (!user) return '??';
    if (typeof user === 'string') {
      return user.split(' ').map((n) => n[0]).join('').toUpperCase();
    }
    if (typeof user === 'object' && user.name) {
      return user.name.split(' ').map((n) => n[0]).join('').toUpperCase();
    }
    return '??';
  };

  return (
    <ul>
      {sortedQuestions.map((q) => (
        <li key={q.id} role="listitem">
          <strong>{getInitials(q.user)}:</strong> {q.text}
          <br />
          <small>{new Date(q.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</small>
        </li>
      ))}
    </ul>
  );
}

function EventLandingPage() {
  const { eventCode } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  // Simulate authentication for demo
  const [user] = useState({ id: 'demo-user-1', name: 'Demo User' });

  useEffect(() => {
    fetch(`/api/session/${eventCode}`)
      .then(res => res.json())
      .then(data => {
        setEvent(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [eventCode]);

  if (loading) return <div>Loading event...</div>;
  if (!event) return <div>Event not found.</div>;

  return (
    <div>
      <h1>{event.title}</h1>
      <p>Date: {new Date(event.start_time).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</p>
      <p>{event.description}</p>
      <button>Login / Register</button>
      {user && (
        <div style={{ marginTop: 32 }}>
          <QuestionForm user={user} sessionId={eventCode} />
          <QuestionList sessionId={eventCode} />
        </div>
      )}
    </div>
  );
}

export default EventLandingPage;
