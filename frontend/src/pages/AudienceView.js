import React, { useEffect, useState } from 'react';
import QRCodeImage from '../components/QRCodeImage';

// AudienceView: Shows the QR code for the event and a digest of AI-determined,
// moderator-approved questions for attendees to see on a shared screen
function AudienceView({ sessionId, user, onLogin, onLogout }) {
  // Fetch approved AI-curated questions for this event/session
  const [questions, setQuestions] = useState([]);
  const [eventMeta, setEventMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch event metadata
  useEffect(() => {
    if (!sessionId) return;
    
    fetch(`/api/session/${sessionId}`)
      .then(res => res.ok ? res.json() : Promise.reject('Failed to load event metadata'))
      .then(data => {
        setEventMeta(data);
      })
      .catch(() => {
        setError('Could not load event details.');
      });
  }, [sessionId]);

  // Poll for approved synthesized questions every 5s
  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    setError('');

    const fetchQuestions = () => {
      // Use the public audience endpoint for approved synthesized questions
      fetch(`/api/audience/questions/synthesized/${sessionId}`)
        .then(res => res.ok ? res.json() : Promise.reject('Failed to load questions'))
        .then(data => {
          setQuestions(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => {
          setError('Could not load approved questions.');
          setLoading(false);
        });
    };

    fetchQuestions();
    const interval = setInterval(fetchQuestions, 5000);
    return () => clearInterval(interval);
  }, [sessionId]);

  // Basic loading state
  if (loading && !eventMeta) return (
    <div className="d-flex align-items-center justify-content-center vh-100">
      <h2>Loading event details...</h2>
    </div>
  );

  // Error state
  if (error && !eventMeta) return (
    <div className="d-flex align-items-center justify-content-center vh-100">
      <h2 style={{ color: 'red' }}>{error}</h2>
    </div>
  );

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          {/* Event title header */}
          {eventMeta && (
            <div className="text-center mb-4">
              <h1 className="display-4">{eventMeta.title || 'Event'}</h1>
              {eventMeta.description && (
                <p className="lead">{eventMeta.description}</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="row">
        {/* QR Code column - takes 1/3 of the screen */}
        <div className="col-md-4 text-center">
          <div className="card h-100">
            <div className="card-body d-flex flex-column align-items-center justify-content-center">
              <h3 className="mb-3">Join the conversation!</h3>
              <QRCodeImage sessionId={sessionId} />
              <p className="mt-3">Scan to submit your questions</p>
            </div>
          </div>
        </div>

        {/* Questions digest column - takes 2/3 of the screen */}
        <div className="col-md-8">
          <div className="card h-100">
            <div className="card-header bg-primary text-white">
              <h3>Selected Questions</h3>
              <p className="mb-0">AI-curated questions approved by moderators</p>
            </div>
            <div className="card-body">
              {loading && questions.length === 0 && (
                <div className="text-center p-5">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3">Loading questions...</p>
                </div>
              )}
              {!loading && questions.length === 0 && (
                <div className="text-center p-5">
                  <p className="lead">No approved questions yet.</p>
                  <p>Scan the QR code to submit your questions!</p>
                </div>
              )}
              {questions.length > 0 && (
                <ul className="list-group list-group-flush">
                  {questions.map((q, index) => (
                    <li key={q.id || index} className="list-group-item px-4 py-3 border-bottom">
                      <div className="d-flex align-items-center">
                        <span className="badge bg-secondary rounded-pill me-3">{index + 1}</span>
                        <h5 className="mb-0">{q.text}</h5>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AudienceView;
