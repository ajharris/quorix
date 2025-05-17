import React, { useEffect, useState } from 'react';
import NavBar from '../components/NavBar';

// SpeakerView: Shows one approved question at a time, fullscreen, with navigation
function SpeakerView({ sessionId, user, onLogin, onLogout }) {
  // Fetch approved questions for this event/session
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Poll for approved questions every 3s
  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    setError('');
    const fetchQuestions = () => {
      fetch(`/api/speaker/questions/${sessionId}`)
        .then(res => res.ok ? res.json() : Promise.reject('Failed to load questions'))
        .then(data => {
          setQuestions(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => {
          setError('Could not load questions.');
          setLoading(false);
        });
    };
    fetchQuestions();
    const interval = setInterval(fetchQuestions, 3000);
    return () => clearInterval(interval);
  }, [sessionId]);

  if (loading) return (
    <>
      <NavBar user={user} onLogin={onLogin} onLogout={onLogout} />
      <div className="d-flex align-items-center justify-content-center vh-100">
        <h2>Loading...</h2>
      </div>
    </>
  );
  if (error) return (
    <>
      <NavBar user={user} onLogin={onLogin} onLogout={onLogout} />
      <div className="d-flex align-items-center justify-content-center vh-100">
        <h2 style={{ color: 'red' }}>{error}</h2>
      </div>
    </>
  );
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
