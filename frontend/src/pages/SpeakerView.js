import React, { useEffect, useState } from 'react';
import NavBar from '../components/NavBar';

// SpeakerView: Shows one approved question at a time, fullscreen, with navigation
function SpeakerView({ sessionId, user, onLogin, onLogout }) {
  // For now, use mocked data. Replace with API call when backend is ready.
  const [questions, setQuestions] = useState([
    { id: 1, text: 'What is the future of AI in events?', status: 'approved' },
    { id: 2, text: 'How do you handle privacy concerns?', status: 'approved' },
    { id: 3, text: 'What are the next steps for Quorix?', status: 'approved' },
  ]);
  const [current, setCurrent] = useState(0);

  // TODO: Replace with polling/fetch for live approved questions
  useEffect(() => {
    // Example: fetch(`/api/speaker/questions/${sessionId}`)
    //   .then(res => res.ok ? res.json() : [])
    //   .then(data => setQuestions(data));
  }, [sessionId]);

  if (!questions.length) return (
    <>
      <NavBar user={user} onLogin={onLogin} onLogout={onLogout} />
      <div className="d-flex align-items-center justify-content-center vh-100">
        <h2>No approved questions yet.</h2>
      </div>
    </>
  );

  const handleNext = () => setCurrent(c => Math.min(c + 1, questions.length - 1));
  const handlePrev = () => setCurrent(c => Math.max(c - 1, 0));
  const handleDismiss = () => setQuestions(qs => qs.filter((_, i) => i !== current));

  const q = questions[current];

  return (
    <>
      <NavBar user={user} onLogin={onLogin} onLogout={onLogout} />
      <div className="d-flex flex-column align-items-center justify-content-center vh-100 bg-dark text-white" style={{ minHeight: '100vh', paddingTop: 56 }}>
        <div className="card bg-secondary text-white" style={{ minWidth: 600, minHeight: 200, fontSize: 32, padding: 32, marginBottom: 32 }}>
          <div>{q.text}</div>
        </div>
        <div className="d-flex gap-3">
          <button className="btn btn-light btn-lg" onClick={handlePrev} disabled={current === 0}>Previous</button>
          <button className="btn btn-danger btn-lg" onClick={handleDismiss}>Dismiss</button>
          <button className="btn btn-light btn-lg" onClick={handleNext} disabled={current === questions.length - 1}>Next</button>
        </div>
        <div className="mt-4 text-muted">Question {current + 1} of {questions.length}</div>
      </div>
    </>
  );
}

export default SpeakerView;
