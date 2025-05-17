import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import EventLandingPage from './pages/EventLandingPage';
import QRCodeImage from './components/QRCodeImage';
import ModeratorDashboard from './pages/ModeratorDashboard';
import NavBar from './components/NavBar';
import AdminUserManagement from './components/AdminUserManagement'; // Import the new component
import AdminQuestionsView from './components/AdminQuestionsView';
import SpeakerView from './pages/SpeakerView';
import SpeakerEmbedView from './pages/SpeakerEmbedView';

function App({ initialUser, initialSession }) {
  const [message, setMessage] = useState('');
  const [session, setSession] = useState(initialSession || null); // Use initialSession if provided
  const [user, setUser] = useState(initialUser || null); // Track logged-in user and role
  const [viewOverride, setViewOverride] = useState(null); // 'admin', 'moderator', 'attendee', or null

  useEffect(() => {
    fetch('/api/ping')
      .then(response => response.json())
      .then(data => setMessage(data.message))
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  // Demo: create a session on mount (for dashboard demo)
  useEffect(() => {
    if (initialSession) return; // Don't fetch if initialSession is provided
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
  }, [initialSession]);

  // Simulate login state (replace with real auth in production)
  useEffect(() => {
    if (initialUser) return; // Do not reset user if initialUser is provided (for tests)
    setUser(null); // or setUser({ role: 'organizer', name: 'Alice' })
  }, [initialUser]);

  // Fetch current user session on mount (if not in test)
  useEffect(() => {
    if (initialUser) return; // Don't fetch if test user is provided
    fetch('/api/session')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.user_id && data.role) {
          setUser({
            id: data.user_id,
            email: data.email,
            name: data.name,
            role: data.role
          });
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null));
  }, [initialUser]);

  // Add login/logout handlers
  const handleLogin = (userObj) => setUser(userObj);
  const handleLogout = () => setUser(null);

  // For admin: allow switching views
  const effectiveRole = viewOverride || (user && user.role);

  return (
    <Router>
      <NavBar user={user} onLogin={handleLogin} onLogout={handleLogout} />
      {message && <div>{message}</div>}
      {user && user.role === 'admin' && (
        <div style={{ position: 'fixed', top: 0, right: 0, background: '#eee', padding: 8, zIndex: 1000 }}>
          <b>Admin View Switcher:</b>
          <select value={viewOverride || user.role} onChange={e => setViewOverride(e.target.value === user.role ? null : e.target.value)}>
            <option value="admin">Admin</option>
            <option value="organizer">Organizer</option>
            <option value="moderator">Moderator</option>
            <option value="attendee">Attendee</option>
            <option value="speaker">Speaker</option>
            <option value="">(Actual Role)</option>
          </select>
        </div>
      )}
      <Routes>
        <Route path="/session/:eventCode" element={<EventLandingPage />} />
        <Route path="/moderator/:sessionId" element={<ModeratorDashboardWrapper user={{...user, role: effectiveRole}} />} />
        <Route path="/speaker/:sessionId" element={<SpeakerViewWrapper user={user} onLogin={handleLogin} onLogout={handleLogout} />} />
        <Route path="/speaker/embed/:eventId" element={<SpeakerEmbedViewWrapper />} />
        <Route path="/" element={
          <div>
            {/* Only show organizer dashboard if user is organizer */}
            {effectiveRole === 'organizer' && session && (
              <div>
                <h2>Organizer Dashboard</h2>
                <p>Event: {session.session_id}</p>
                <QRCodeImage sessionId={session.session_id} />
              </div>
            )}
            {effectiveRole === 'admin' && (
              <div>
                <h2>Admin View</h2>
                <p>You are logged in as admin.</p>
                <AdminUserManagement />
                <AdminQuestionsView />
              </div>
            )}
          </div>
        } />
      </Routes>
    </Router>
  );
}

// Wrapper to extract sessionId from params for ModeratorDashboard
function ModeratorDashboardWrapper({ user }) {
  const { sessionId } = require('react-router-dom').useParams();
  return <ModeratorDashboard sessionId={sessionId} user={user} />;
}

// Wrapper to extract sessionId from params for SpeakerView and pass user, onLogin, onLogout
function SpeakerViewWrapper(props) {
  const { sessionId } = require('react-router-dom').useParams();
  // Get user, onLogin, onLogout from App props/context
  // We'll pass them down from App
  return <SpeakerView sessionId={sessionId} user={props.user} onLogin={props.onLogin} onLogout={props.onLogout} />;
}

// Add wrapper for embed route
function SpeakerEmbedViewWrapper() {
  const { eventId } = require('react-router-dom').useParams();
  return <SpeakerEmbedView eventId={eventId} />;
}

export default App;
