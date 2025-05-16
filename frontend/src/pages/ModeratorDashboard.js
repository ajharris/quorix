import React, { useEffect, useState, useRef } from 'react';
import ModeratorBanDialog from './ModeratorBanDialog';
import ModeratorQuestionList from './ModeratorQuestionList';
import ModeratorApprovedList from './ModeratorApprovedList';

// --- ModeratorDashboard Component ---
// This page is for moderators to manage questions for a session/event.
// It allows viewing, approving, deleting, merging, and synthesizing questions, as well as banning users.
function ModeratorDashboard({ sessionId, user }) {
  // --- State for questions, selection, loading, errors, and moderator status ---
  const [questions, setQuestions] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [synthResult, setSynthResult] = useState('');
  const [unauthorized, setUnauthorized] = useState(false);
  const intervalRef = useRef();
  const [events, setEvents] = useState([]);
  const [eventLoading, setEventLoading] = useState(true);
  const [eventError, setEventError] = useState('');
  const [isEventModerator, setIsEventModerator] = useState(false);
  const [checkingModerator, setCheckingModerator] = useState(true);
  const [banDialogUser, setBanDialogUser] = useState(null);
  const [banType, setBanType] = useState('permanent');
  const [banDuration, setBanDuration] = useState('');
  const [banning, setBanning] = useState(false);

  // --- Check if user is moderator for this event ---
  useEffect(() => {
    if (!user || !user.id || !sessionId) return;
    fetch(`/api/user/${user.id}/events`)
      .then(res => res.ok ? res.json() : Promise.reject('Failed to check moderator status'))
      .then(data => {
        setIsEventModerator(
          Array.isArray(data.moderator_for) &&
          data.moderator_for.some(ev => ev.session_id === sessionId || ev.id === sessionId)
        );
        setCheckingModerator(false);
      })
      .catch(() => {
        setIsEventModerator(false);
        setCheckingModerator(false);
      });
  }, [user, sessionId]);

  // --- Polling for questions every 5 seconds ---
  useEffect(() => {
    const fetchQuestions = () => {
      fetch(`/api/mod/questions/${sessionId}`)
        .then(res => {
          if (res.status === 401) throw new Error('unauthorized');
          if (!res.ok) throw new Error('api');
          return res.json();
        })
        .then(data => {
          setQuestions(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(e => {
          if (e.message === 'unauthorized') setUnauthorized(true);
          else setError('Failed to load questions.');
          setLoading(false);
        });
    };
    fetchQuestions();
    intervalRef.current = setInterval(fetchQuestions, 5000);
    return () => clearInterval(intervalRef.current);
  }, [sessionId]);

  // --- Fetch events for moderator controls ---
  useEffect(() => {
    fetch('/api/mod/events')
      .then(res => {
        if (!res.ok) throw new Error('api');
        return res.json();
      })
      .then(data => {
        setEvents(Array.isArray(data) ? data : []);
        setEventLoading(false);
      })
      .catch(() => {
        setEventError('Failed to load events.');
        setEventLoading(false);
      });
  }, []);

  // --- Handlers for moderator actions (approve, delete, merge, synthesize, ban, unban) ---
  const handleAction = async (id, action) => {
    try {
      const res = await fetch(`/api/mod/question/${id}/${action}`, { method: 'POST' });
      if (res.status === 401) return setUnauthorized(true);
      if (!res.ok) throw new Error('api');
      setQuestions(qs => qs.filter(q => q.id !== id));
    } catch {
      setError('Action failed.');
    }
  };

  const handleMerge = async () => {
    try {
      const res = await fetch(`/api/mod/questions/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selected })
      });
      if (res.status === 401) return setUnauthorized(true);
      if (!res.ok) throw new Error('api');
      setQuestions(qs => qs.filter(q => !selected.includes(q.id)));
      setSelected([]);
    } catch {
      setError('Merge failed.');
    }
  };

  const handleSynthesis = async () => {
    try {
      const res = await fetch(`/api/mod/questions/synthesize/${sessionId}`, { method: 'POST' });
      if (res.status === 401) return setUnauthorized(true);
      if (!res.ok) throw new Error('api');
      const data = await res.json();
      setSynthResult(data.summary || 'Synthesis complete.');
    } catch {
      setError('Synthesis failed.');
    }
  };

  // --- Event handlers for event management (start, access, close) ---
  const handleStartEvent = async () => {
    const name = window.prompt('Enter new event name:');
    if (!name) return;
    try {
      const res = await fetch('/api/mod/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (!res.ok) throw new Error('api');
      const newEvent = await res.json();
      setEvents(evts => [...evts, newEvent]);
    } catch {
      setEventError('Failed to create event.');
    }
  };

  const handleAccessEvent = (eventId) => {
    // For now, just alert or navigate (replace with real navigation as needed)
    window.alert(`Accessing event ${eventId}`);
    // e.g., navigate(`/moderator/event/${eventId}`)
  };

  const handleCloseEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to close this event?')) return;
    try {
      const res = await fetch(`/api/mod/events/${eventId}/close`, { method: 'POST' });
      if (!res.ok) throw new Error('api');
      setEvents(evts => evts.filter(e => e.id !== eventId));
    } catch {
      setEventError('Failed to close event.');
    }
  };

  // --- Ban/unban handlers for users ---
  const handleBan = (userId) => {
    setBanDialogUser(userId);
    setBanType('permanent');
    setBanDuration('');
  };
  const handleBanSubmit = async () => {
    if (!banDialogUser) return;
    setBanning(true);
    try {
      const res = await fetch(`/api/mod/users/${banDialogUser}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: banType,
          duration: banType === 'temporary' ? banDuration : undefined
        })
      });
      if (!res.ok) throw new Error('api');
      setBanDialogUser(null);
    } catch {
      setError('Failed to ban user.');
    } finally {
      setBanning(false);
    }
  };
  const handleUnban = async (userId) => {
    setBanning(true);
    try {
      const res = await fetch(`/api/mod/users/${userId}/unban`, { method: 'POST' });
      if (!res.ok) throw new Error('api');
    } catch {
      setError('Failed to unban user.');
    } finally {
      setBanning(false);
    }
  };

  // --- Split questions into pending and approved ---
  const pendingQuestions = questions.filter(q => q.status !== 'approved');
  const approvedQuestions = questions.filter(q => q.status === 'approved');

  // --- Render loading, error, and permission states ---
  if (checkingModerator) return <div>Checking permissions...</div>;
  if (!isEventModerator) return <div>Access denied: You are not a moderator for this event.</div>;
  if (unauthorized) return <div>Unauthorized</div>;
  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  // --- Rendered UI ---
  return (
    <div className="container py-4">
      <h2>Moderator Dashboard</h2>
      {/* Pending questions list and actions */}
      <ModeratorQuestionList questions={pendingQuestions} selected={selected} setSelected={setSelected} onAction={handleAction} />
      {/* Merge and synthesize controls */}
      <button className="btn btn-secondary btn-sm me-2" onClick={handleMerge} disabled={selected.length < 2}>Merge Selected</button>
      <button className="btn btn-info btn-sm" onClick={handleSynthesis}>Trigger Synthesis</button>
      {/* Show synthesis result if available */}
      {synthResult && <div data-testid="synth-result" className="alert alert-info mt-2">{synthResult}</div>}
      {/* Approved questions list */}
      <ModeratorApprovedList questions={approvedQuestions} />
      {/* Ban dialog for user moderation */}
      {banDialogUser && (
        <ModeratorBanDialog
          userId={banDialogUser}
          banType={banType}
          banDuration={banDuration}
          setBanType={setBanType}
          setBanDuration={setBanDuration}
          onCancel={() => setBanDialogUser(null)}
          onSubmit={handleBanSubmit}
          banning={banning}
        />
      )}
    </div>
  );
}

export default ModeratorDashboard;
