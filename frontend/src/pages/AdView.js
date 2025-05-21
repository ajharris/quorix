import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCodeImage from '../components/QRCodeImage';

// AdView: Simple landing page that leads users to the attendee view and prompts login
function AdView() {
  const navigate = useNavigate();

  // Redirect to attendee view and enforce login if not authenticated
  useEffect(() => {
    // Check for authentication (replace with real auth check)
    const isAuthenticated = Boolean(localStorage.getItem('user_token'));
    if (!isAuthenticated) {
      // Optionally, redirect to OAuth or show login/register modal
      // For now, just show the ad view and let the attendee view handle auth
    }
  }, []);

  // Example: hardcoded event info and questions (replace with dynamic data as needed)
  const eventId = 'demo';
  const eventUrl = `${window.location.origin}/session/${eventId}`;
  const speakerTopics = [
    'AI in Education',
    'Future of Remote Work',
    'Ethics in Technology'
  ];
  const thoughtProvokingQuestions = [
    'How will AI change the way we learn and teach?',
    'What are the biggest challenges of remote collaboration?',
    'Where should we draw the line with technology and privacy?'
  ];

  const handleGoToEvent = () => {
    // Optionally, check auth here and redirect to login if needed
    navigate(`/session/${eventId}`);
  };

  return (
    <div className="container d-flex flex-column align-items-center justify-content-center vh-100">
      <h1 className="mb-4">Welcome to Quorix Live Q&amp;A!</h1>
      <p className="lead mb-4">Join an event to ask questions, chat, and participate live.</p>
      <div className="mb-4">
        <QRCodeImage value={eventUrl} size={180} />
        <div className="text-muted mt-2" style={{ fontSize: '0.95rem' }}>
          Scan to join the event on your device
        </div>
      </div>
      <div className="mb-4 w-100" style={{ maxWidth: 400 }}>
        <h5>Thought-Provoking Questions</h5>
        <ul>
          {thoughtProvokingQuestions.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ul>
        <div className="small text-muted">Topics: {speakerTopics.join(', ')}</div>
      </div>
      <button className="btn btn-primary btn-lg mb-3" onClick={handleGoToEvent}>
        Go to Event (Attendee View)
      </button>
      <div className="text-muted">You will be asked to log in or register to participate.</div>
    </div>
  );
}

export default AdView;
