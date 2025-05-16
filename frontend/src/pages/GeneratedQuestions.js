import React, { useEffect, useState } from 'react';

function GeneratedQuestions({ sessionId }) {
  const [generated, setGenerated] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    fetch(`/synthesized_questions?session_id=${sessionId}`)
      .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch generated questions'))
      .then(data => setGenerated(Array.isArray(data) ? data : []))
      .catch(() => setError('Failed to load generated questions.'));
  }, [sessionId]);
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!generated.length) return <div>No generated questions yet.</div>;
  return (
    <div className="mb-3">
      <h5>Generated Questions</h5>
      <ul className="list-group">
        {generated.map((q, i) => (
          <li key={i} className="list-group-item">{q.text || q}</li>
        ))}
      </ul>
    </div>
  );
}

export default GeneratedQuestions;
