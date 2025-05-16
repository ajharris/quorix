import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import QRCodeImage from '../components/QRCodeImage';
import EventQuestionForm from './EventQuestionForm';
import EventQuestionList from './EventQuestionList';
import GeneratedQuestions from './GeneratedQuestions';

// --- EventLandingPage Component ---
// This page displays a list of available events, allows users to select an event,
// view event details, submit questions, and see generated/synthesized questions.
function EventLandingPage() {
  // --- State for events, selection, loading, error, and user (demo) ---
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // For demo: hardcoded user; in production, get from auth context
  const [user, setUser] = useState({ id: 1, name: 'Test User', role: 'attendee' });

  // --- Fetch events on mount ---
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

  // --- Render loading or error states ---
  if (loading) return <div className="text-center mt-5">Loading events...</div>;
  if (error) return <div className="alert alert-danger mt-5" role="alert">{error}</div>;

  // --- Rendered UI ---
  return (
    <div className="container py-4">
      <h1 className="mb-4">Available Events</h1>
      {/* List of events */}
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
      {/* Event details and actions when an event is selected */}
      {selectedEvent && (
        <>
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">{selectedEvent.title}</h5>
              <p className="card-text">{selectedEvent.description}</p>
              {/* Show QR code for joining the event */}
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
          {/* Show chat, generated questions, and question list for organizers/moderators */}
          {(user.role === 'organizer' || user.role === 'moderator') && (
            <>
              <div className="mb-4">
                <h5>Event Chat (Coming Soon)</h5>
                <div className="border rounded p-3 bg-light">Chat feature placeholder</div>
              </div>
            </>
          )}
          {/* Show question form and list for attendees */}
          {user.role === 'attendee' && (
            <>
              <EventQuestionForm user={user} sessionId={selectedEvent.session_id} />
              <EventQuestionList sessionId={selectedEvent.session_id} />
              <GeneratedQuestions sessionId={selectedEvent.session_id} />
            </>
          )}
        </>
      )}
    </div>
  );
}

export default EventLandingPage;
