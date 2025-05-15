import React, { useEffect, useState, useRef } from 'react';

function ModeratorDashboard({ sessionId, user }) {
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

  // Check if user is moderator for this event
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

  // Polling for questions every 5 seconds
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

  // Fetch events for moderator controls
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

  // Event handlers
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

  // Ban/unban handlers
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

  // Split questions into pending and approved
  const pendingQuestions = questions.filter(q => q.status !== 'approved');
  const approvedQuestions = questions.filter(q => q.status === 'approved');

  if (checkingModerator) return <div>Checking permissions...</div>;
  if (!isEventModerator) return <div>Access denied: You are not a moderator for this event.</div>;
  if (unauthorized) return <div>Unauthorized</div>;
  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div>
      <h2>Moderator Dashboard</h2>
      {/* Event Controls */}
      <div style={{ marginBottom: 24 }}>
        <button onClick={handleStartEvent}>Start New Event</button>
        {eventLoading ? (
          <span>Loading events...</span>
        ) : eventError ? (
          <span style={{ color: 'red' }}>{eventError}</span>
        ) : (
          <>
            <h4>Existing Events</h4>
            <ul>
              {events.map(ev => (
                <li key={ev.id}>
                  <b>{ev.name}</b> (ID: {ev.id})
                  <button onClick={() => handleAccessEvent(ev.id)} style={{ marginLeft: 8 }}>Access</button>
                  <button onClick={() => handleCloseEvent(ev.id)} style={{ marginLeft: 8 }}>Close</button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      <h3>Incoming Questions</h3>
      {pendingQuestions.length === 0 ? (
        <div>No new questions.</div>
      ) : (
        <ul>
          {pendingQuestions.map(q => (
            <li key={q.id}>
              <input
                type="checkbox"
                checked={selected.includes(q.id)}
                onChange={e => {
                  setSelected(sel =>
                    e.target.checked ? [...sel, q.id] : sel.filter(id => id !== q.id)
                  );
                }}
                aria-label={`select-question-${q.id}`}
              />
              <span>{q.text}</span>
              <button onClick={() => handleAction(q.id, 'approve')}>Approve</button>
              <button onClick={() => handleAction(q.id, 'delete')}>Delete</button>
              <button onClick={() => handleAction(q.id, 'flag')}>Flag</button>
              <button className="btn btn-danger btn-sm ms-2" onClick={() => handleBan(q.user_id)} disabled={banning}>Ban User</button>
              <button className="btn btn-warning btn-sm ms-2" onClick={() => handleUnban(q.user_id)} disabled={banning}>Unban User</button>
            </li>
          ))}
        </ul>
      )}
      <button onClick={handleMerge} disabled={selected.length < 2}>Merge Selected</button>
      <button onClick={handleSynthesis}>Trigger Synthesis</button>
      {synthResult && <div data-testid="synth-result">{synthResult}</div>}
      <h3>Curated (Approved) Questions</h3>
      {approvedQuestions.length === 0 ? (
        <div>No approved questions yet.</div>
      ) : (
        <ul>
          {approvedQuestions.map(q => (
            <li key={q.id}>{q.text}</li>
          ))}
        </ul>
      )}
      {/* Ban dialog */}
      {banDialogUser && (
        <div className="modal show" style={{ display: 'block', background: 'rgba(0,0,0,0.3)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Ban User: {banDialogUser}</h5>
                <button type="button" className="btn-close" onClick={() => setBanDialogUser(null)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-2">
                  <label className="form-label">Ban Type:</label>
                  <select className="form-select" value={banType} onChange={e => setBanType(e.target.value)}>
                    <option value="permanent">Permanent</option>
                    <option value="temporary">Temporary</option>
                  </select>
                </div>
                {banType === 'temporary' && (
                  <div className="mb-2">
                    <label className="form-label">Duration (hours):</label>
                    <input type="number" className="form-control" value={banDuration} onChange={e => setBanDuration(e.target.value)} min="1" />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setBanDialogUser(null)} disabled={banning}>Cancel</button>
                <button className="btn btn-danger" onClick={handleBanSubmit} disabled={banning || (banType === 'temporary' && !banDuration)}>Ban</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ModeratorDashboard;
