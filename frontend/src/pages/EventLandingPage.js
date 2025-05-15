import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import QRCodeImage from '../components/QRCodeImage';

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
    <form onSubmit={handleSubmit} className="mb-3">
      <label htmlFor="question" className="form-label">Ask a question:</label>
      <textarea
        id="question"
        value={question}
        onChange={e => setQuestion(e.target.value)}
        rows={3}
        className="form-control mb-2"
        disabled={submitting}
      />
      <button type="submit" className="btn btn-primary" disabled={submitting}>
        Submit
      </button>
      {error && <div className="alert alert-danger mt-2" role="alert">{error}</div>}
      {success && <div className="alert alert-success mt-2" role="alert">{success}</div>}
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

  if (error) return <div className="alert alert-danger" role="alert">{error}</div>;

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
    <ul className="list-group mb-3">
      {sortedQuestions.map((q) => (
        <li key={q.id} role="listitem" className="list-group-item">
          <strong>{getInitials(q.user)}:</strong> {q.text}
          <br />
          <small className="text-muted">{new Date(q.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' })}</small>
        </li>
      ))}
    </ul>
  );
}

function EventLandingPage() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/events')
      .then(res => res.ok ? res.json() : Promise.reject('Failed to load events'))
      .then(data => {
        setEvents(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load events.');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center mt-5">Loading events...</div>;
  if (error) return <div className="alert alert-danger mt-5" role="alert">{error}</div>;

  return (
    <div className="container py-4">
      <h1 className="mb-4">Available Events</h1>
      <ul className="list-group mb-4">
        {events.map(event => (
          <li key={event.session_id} className="list-group-item d-flex justify-content-between align-items-center">
            <span style={{ cursor: 'pointer' }} onClick={() => setSelectedEvent(event)}>
              {event.title}
            </span>
            <span className="badge bg-secondary">{new Date(event.start_time).toLocaleDateString()}</span>
          </li>
        ))}
      </ul>
      {selectedEvent && (
        <>
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">{selectedEvent.title}</h5>
              <p className="card-text">{selectedEvent.description}</p>
              <QRCodeImage sessionId={selectedEvent.session_id} />
              <a
                href={`/session/${selectedEvent.session_id}`}
                className="btn btn-primary mt-3"
                target="_blank"
                rel="noopener noreferrer"
              >
                Go to Event Page
              </a>
              <button className="btn btn-link mt-3" onClick={() => setSelectedEvent(null)}>Close</button>
            </div>
          </div>
          {/* Show question form and list for selected event */}
          <QuestionForm user={{ id: 1, name: 'Test User' }} sessionId={selectedEvent.session_id} />
          <QuestionList sessionId={selectedEvent.session_id} />
        </>
      )}
    </div>
  );
}

export default EventLandingPage;
