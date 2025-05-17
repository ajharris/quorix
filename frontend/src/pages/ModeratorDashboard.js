import React, { useEffect, useState, useRef } from 'react';
import ModeratorBanDialog from './ModeratorBanDialog';
import ModeratorQuestionList from './ModeratorQuestionList';
import ModeratorApprovedList from './ModeratorApprovedList';
import EventChat from './EventChat';

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
  const [eventMeta, setEventMeta] = useState(null);
  const [eventMetaLoading, setEventMetaLoading] = useState(true);
  const [eventMetaError, setEventMetaError] = useState('');
  const [links, setLinks] = useState([]);
  const [linksLoading, setLinksLoading] = useState(true);
  const [linksError, setLinksError] = useState('');
  // --- State for posting new link ---
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [postingLink, setPostingLink] = useState(false);
  const [postLinkError, setPostLinkError] = useState('');

  // --- State for synthesized questions ---
  const [synthQuestions, setSynthQuestions] = useState([]);
  const [synthLoading, setSynthLoading] = useState(false);
  const [synthError, setSynthError] = useState('');
  const [editingSynthId, setEditingSynthId] = useState(null);
  const [editingSynthText, setEditingSynthText] = useState('');

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

  // Fetch event metadata
  useEffect(() => {
    if (!sessionId) return;
    setEventMetaLoading(true);
    fetch(`/api/session/${sessionId}`)
      .then(res => res.ok ? res.json() : Promise.reject('Failed to load event metadata'))
      .then(data => {
        setEventMeta(data);
        setEventMetaLoading(false);
      })
      .catch(() => {
        setEventMetaError('Could not load event metadata.');
        setEventMetaLoading(false);
      });
  }, [sessionId]);

  // Fetch moderator-published links
  useEffect(() => {
    if (!sessionId) return;
    setLinksLoading(true);
    fetch(`/api/mod/links/${sessionId}`)
      .then(res => res.ok ? res.json() : Promise.reject('Failed to load links'))
      .then(data => {
        setLinks(Array.isArray(data) ? data : []);
        setLinksLoading(false);
      })
      .catch(() => {
        setLinksError('Could not load links.');
        setLinksLoading(false);
      });
  }, [sessionId]);

  // --- Fetch synthesized questions for approval ---
  useEffect(() => {
    if (!sessionId) return;
    setSynthLoading(true);
    fetch(`/api/mod/questions/synthesized/${sessionId}`)
      .then(res => res.ok ? res.json() : Promise.reject('Failed to load synthesized questions'))
      .then(data => {
        setSynthQuestions(Array.isArray(data) ? data : []);
        setSynthLoading(false);
      })
      .catch(() => {
        setSynthError('Could not load synthesized questions.');
        setSynthLoading(false);
      });
  }, [sessionId]);

  // --- Handler for posting a new link ---
  const handlePostLink = async (e) => {
    e.preventDefault();
    setPostLinkError('');
    if (!newLinkUrl) {
      setPostLinkError('URL is required.');
      return;
    }
    setPostingLink(true);
    try {
      const res = await fetch(`/api/mod/links/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newLinkUrl, title: newLinkTitle, published_by: user?.name || user?.email || 'moderator' })
      });
      if (!res.ok) throw new Error('api');
      setNewLinkUrl('');
      setNewLinkTitle('');
      // Refresh links after posting
      fetch(`/api/mod/links/${sessionId}`)
        .then(res => res.ok ? res.json() : [])
        .then(data => setLinks(Array.isArray(data) ? data : []));
    } catch {
      setPostLinkError('Failed to post link.');
    } finally {
      setPostingLink(false);
    }
  };

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

  // Handler for toggling exclude_from_ai
  const handleToggleExcludeFromAI = async (id, value) => {
    try {
      const res = await fetch(`/api/mod/question/${id}/exclude_from_ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exclude_from_ai: value })
      });
      if (!res.ok) throw new Error('api');
      setQuestions(qs => qs.map(q => q.id === id ? { ...q, exclude_from_ai: value } : q));
    } catch {
      setError('Failed to update AI exclusion.');
    }
  };

  // --- Handlers for approve/edit/reject synthesized questions ---
  const handleApproveSynth = async (id) => {
    try {
      const res = await fetch(`/api/mod/questions/synthesized/${id}/approve`, { method: 'POST' });
      if (!res.ok) throw new Error('api');
      setSynthQuestions(qs => qs.filter(q => q.id !== id));
    } catch {
      setSynthError('Failed to approve synthesized question.');
    }
  };
  const handleRejectSynth = async (id) => {
    try {
      const res = await fetch(`/api/mod/questions/synthesized/${id}/reject`, { method: 'POST' });
      if (!res.ok) throw new Error('api');
      setSynthQuestions(qs => qs.filter(q => q.id !== id));
    } catch {
      setSynthError('Failed to reject synthesized question.');
    }
  };
  const handleEditSynth = (id, text) => {
    setEditingSynthId(id);
    setEditingSynthText(text);
  };
  const handleSaveSynthEdit = async (id) => {
    try {
      const res = await fetch(`/api/mod/questions/synthesized/${id}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editingSynthText })
      });
      if (!res.ok) throw new Error('api');
      setSynthQuestions(qs => qs.map(q => q.id === id ? { ...q, text: editingSynthText } : q));
      setEditingSynthId(null);
      setEditingSynthText('');
    } catch {
      setSynthError('Failed to edit synthesized question.');
    }
  };
  const handleCancelSynthEdit = () => {
    setEditingSynthId(null);
    setEditingSynthText('');
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
      {/* Event metadata section */}
      <div className="mb-4">
        {eventMetaLoading ? (
          <div>Loading event info...</div>
        ) : eventMetaError ? (
          <div className="alert alert-danger">{eventMetaError}</div>
        ) : eventMeta ? (
          <div>
            <h4>{eventMeta.title}</h4>
            <div><strong>Time:</strong> {eventMeta.start_time ? new Date(eventMeta.start_time).toLocaleString() : ''}</div>
            <div><strong>Description:</strong> {eventMeta.description}</div>
          </div>
        ) : null}
      </div>
      {/* Moderator-published links section */}
      <div className="mb-4">
        <h5>Links Published by Moderators</h5>
        {/* Form to post a new link */}
        <form className="mb-3" onSubmit={handlePostLink} style={{ maxWidth: 500 }}>
          <div className="input-group mb-2">
            <input
              type="url"
              className="form-control"
              placeholder="Paste link URL (https://...)"
              value={newLinkUrl}
              onChange={e => setNewLinkUrl(e.target.value)}
              required
              disabled={postingLink}
            />
            <input
              type="text"
              className="form-control"
              placeholder="Optional title"
              value={newLinkTitle}
              onChange={e => setNewLinkTitle(e.target.value)}
              disabled={postingLink}
            />
            <button className="btn btn-primary" type="submit" disabled={postingLink || !newLinkUrl}>Post</button>
          </div>
          {postLinkError && <div className="text-danger small">{postLinkError}</div>}
        </form>
        {linksLoading ? (
          <div>Loading links...</div>
        ) : linksError ? (
          <div className="alert alert-danger">{linksError}</div>
        ) : links.length === 0 ? (
          <div>No links published yet.</div>
        ) : (
          <ul className="list-group">
            {links.map(link => (
              <li key={link.url} className="list-group-item">
                <a href={link.url} target="_blank" rel="noopener noreferrer">{link.title || link.url}</a>
                {link.published_by && (
                  <span className="text-muted ms-2">(by {link.published_by})</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* Moderator Chat Section */}
      <div className="mb-4">
        <h5>Event Chat (Moderator View)</h5>
        <EventChat user={user} eventId={sessionId} isModerator={true} />
      </div>
      {/* Synthesized questions for approval */}
      <div className="mb-4">
        <h5>AI-Synthesized Questions for Approval</h5>
        {synthLoading ? (
          <div>Loading synthesized questions...</div>
        ) : synthError ? (
          <div className="alert alert-danger">{synthError}</div>
        ) : synthQuestions.length === 0 ? (
          <div>No synthesized questions pending approval.</div>
        ) : (
          <ul className="list-group mb-3">
            {synthQuestions.map(q => (
              <li key={q.id} className="list-group-item d-flex justify-content-between align-items-center">
                {editingSynthId === q.id ? (
                  <>
                    <input
                      type="text"
                      className="form-control me-2"
                      value={editingSynthText}
                      onChange={e => setEditingSynthText(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button className="btn btn-success btn-sm me-2" onClick={() => handleSaveSynthEdit(q.id)}>Save</button>
                    <button className="btn btn-secondary btn-sm me-2" onClick={handleCancelSynthEdit}>Cancel</button>
                  </>
                ) : (
                  <>
                    <span>{q.text}</span>
                    <div>
                      <button className="btn btn-success btn-sm me-2" onClick={() => handleApproveSynth(q.id)}>Approve</button>
                      <button className="btn btn-secondary btn-sm me-2" onClick={() => handleEditSynth(q.id, q.text)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleRejectSynth(q.id)}>Reject</button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* Pending questions list and actions */}
      <ModeratorQuestionList questions={pendingQuestions} selected={selected} setSelected={setSelected} onAction={handleAction} onToggleExcludeFromAI={handleToggleExcludeFromAI} />
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
