import React, { useEffect, useRef, useState } from 'react';

// Embedded Speaker View: Fullscreen, minimal, for iframe/slide embedding
function SpeakerEmbedView({ eventId }) {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimeout = useRef();

  // Poll for approved questions every 3s
  useEffect(() => {
    if (!eventId) return;
    const fetchQuestions = () => {
      fetch(`/api/speaker/questions/${eventId}`)
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
  }, [eventId]);

  // Auto-hide controls after 5s
  useEffect(() => {
    if (!controlsVisible) return;
    controlsTimeout.current && clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => setControlsVisible(false), 5000);
    return () => clearTimeout(controlsTimeout.current);
  }, [controlsVisible, current]);

  // Show controls on any key/mouse
  useEffect(() => {
    const showControls = () => setControlsVisible(true);
    window.addEventListener('mousemove', showControls);
    window.addEventListener('keydown', showControls);
    return () => {
      window.removeEventListener('mousemove', showControls);
      window.removeEventListener('keydown', showControls);
    };
  }, []);

  const handleNext = () => setCurrent(c => Math.min(c + 1, questions.length - 1));
  const handlePrev = () => setCurrent(c => Math.max(c - 1, 0));
  const handleDismiss = () => {
    setQuestions(qs => {
      const newQuestions = qs.filter((_, i) => i !== current);
      setCurrent(c => Math.max(0, c - (current === qs.length - 1 ? 1 : 0)));
      return newQuestions;
    });
  };

  // Query params for auto-advance
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const autoAdvance = params.get('autoAdvance') === 'true';
    const interval = parseInt(params.get('interval'), 10) || 60;
    if (!autoAdvance) return;
    if (questions.length < 2) return;
    const adv = setInterval(() => {
      setCurrent(c => (c < questions.length - 1 ? c + 1 : c));
    }, interval * 1000);
    return () => clearInterval(adv);
  }, [questions]);

  // Layout
  if (loading) return <div style={{ color: '#fff', background: '#111', width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>Loading...</div>;
  if (error) return <div style={{ color: 'red', background: '#111', width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>{error}</div>;
  if (!questions.length) return <div style={{ color: '#fff', background: '#111', width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>No approved questions yet.</div>;

  const q = questions[current];

  return (
    <div
      id="question-container"
      style={{
        width: '100vw',
        height: '100vh',
        background: '#111',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        aspectRatio: '16/9',
        overflow: 'hidden',
        position: 'relative',
      }}
      tabIndex={0}
    >
      <h1 id="question-text" style={{ color: '#fff', fontSize: '5vw', textAlign: 'center', margin: 0, maxWidth: '90vw', wordBreak: 'break-word' }}>{q.text}</h1>
      {controlsVisible && (
        <div style={{ position: 'absolute', bottom: '6vh', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 32, transition: 'opacity 0.3s', opacity: 1 }}>
          <button onClick={handlePrev} disabled={current === 0} style={btnStyle}>Previous</button>
          <button onClick={handleDismiss} style={{ ...btnStyle, background: '#c00', color: '#fff' }}>Dismiss</button>
          <button onClick={handleNext} disabled={current === questions.length - 1} style={btnStyle}>Next</button>
        </div>
      )}
      <div style={{ position: 'absolute', top: '2vh', right: '3vw', color: '#aaa', fontSize: '1.5vw' }}>Question {current + 1} of {questions.length}</div>
    </div>
  );
}

const btnStyle = {
  fontSize: '2vw',
  padding: '1vw 2vw',
  borderRadius: '1vw',
  border: 'none',
  background: '#fff',
  color: '#222',
  cursor: 'pointer',
  opacity: 0.95,
  transition: 'background 0.2s',
};

export default SpeakerEmbedView;
