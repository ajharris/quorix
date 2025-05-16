import React, { useState } from 'react';

function EventQuestionForm({ user, sessionId, onSuccess }) {
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
        if (onSuccess) onSuccess();
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

export default EventQuestionForm;
