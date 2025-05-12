import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import EventLandingPage from './pages/EventLandingPage';
import QRCodeImage from './components/QRCodeImage';
import ModeratorDashboard from './pages/ModeratorDashboard';

function App() {
  const [message, setMessage] = useState('');
  const [session, setSession] = useState(null);

  useEffect(() => {
    fetch('/api/ping')
      .then(response => response.json())
      .then(data => setMessage(data.message))
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  // Demo: create a session on mount (for dashboard demo)
  useEffect(() => {
    fetch('/create_session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Demo Event',
        start_time: new Date().toISOString(),
        description: 'Demo event for QR code display.'
      })
    })
      .then(res => res.json())
      .then(data => setSession(data))
      .catch(() => {});
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/session/:eventCode" element={<EventLandingPage />} />
        <Route path="/moderator/:sessionId" element={<ModeratorDashboardWrapper />} />
        <Route path="/" element={
          <div>
            <h1>React Frontend</h1>
            <p>Backend says: {message}</p>
            {session && (
              <div>
                <h2>Organizer Dashboard</h2>
                <p>Event: {session.session_id}</p>
                <QRCodeImage sessionId={session.session_id} />
              </div>
            )}
          </div>
        } />
      </Routes>
    </Router>
  );
}

// Wrapper to extract sessionId from params for ModeratorDashboard
function ModeratorDashboardWrapper() {
  const { sessionId } = require('react-router-dom').useParams();
  return <ModeratorDashboard sessionId={sessionId} />;
}

export default App;
