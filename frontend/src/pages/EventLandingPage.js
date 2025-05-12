import React, { useEffect, useState } from 'react';
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
      <p>Date: {new Date(event.start_time).toLocaleString()}</p>
      <p>{event.description}</p>
      {/* TODO: Add login/registration UI here */}
      <button>Login / Register</button>
      {/* Render question form only if user is authenticated */}
      {user && (
        <div style={{ marginTop: 32 }}>
          <QuestionForm user={user} sessionId={eventCode} />
        </div>
      )}
    </div>
  );
}

export default EventLandingPage;
