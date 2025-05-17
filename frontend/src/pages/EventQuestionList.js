import React, { useEffect, useState, useRef } from 'react';

function EventQuestionList({ sessionId }) {
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState('');
  const intervalRef = useRef();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch(`/api/questions/${sessionId}`);
        if (!res.ok) throw new Error('Failed to fetch questions');
        const data = await res.json();
        setQuestions(Array.isArray(data) ? data : []);
      } catch (err) {
        setError('Failed to load questions.');
        setQuestions([]);
      }
    };
    fetchQuestions();
    intervalRef.current = setInterval(fetchQuestions, 5000);
    return () => clearInterval(intervalRef.current);
  }, [sessionId]);

  if (error) return <div className="alert alert-danger" role="alert">{error}</div>;

  const sortedQuestions = [...questions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

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
          {q.status && (
            <span className="ms-2 badge bg-info text-dark" data-testid="status">({q.status})</span>
          )}
          <br />
          <small className="text-muted">{new Date(q.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' })}</small>
        </li>
      ))}
    </ul>
  );
}

export default EventQuestionList;
