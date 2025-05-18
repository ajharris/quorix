import React, { useEffect, useState } from 'react';
import QRCodeImage from '../components/QRCodeImage';
import EventChat from './EventChat';
import ModeratorDashboard from './ModeratorDashboard';

// --- OrganizerDashboard Component ---
// Inherits moderator features, adds event editing and role management
function OrganizerDashboard({ sessionId, user }) {
  const [eventMeta, setEventMeta] = useState(null);
  const [eventMetaLoading, setEventMetaLoading] = useState(true);
  const [eventMetaError, setEventMetaError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // --- Role management state ---
  const [roles, setRoles] = useState([]); // [{user_id, name, email, role}]
  const [rolesLoading, setRolesLoading] = useState(true);
  const [rolesError, setRolesError] = useState('');
  const [addRoleEmail, setAddRoleEmail] = useState('');
  const [addRoleType, setAddRoleType] = useState('moderator');
  const [addRoleError, setAddRoleError] = useState('');
  const [addingRole, setAddingRole] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    setEventMetaLoading(true);
    fetch(`/api/session/${sessionId}`)
      .then(res => res.ok ? res.json() : Promise.reject('Failed to load event metadata'))
      .then(data => {
        setEventMeta(data);
        setEditTitle(data.title);
        setEditTime(data.start_time);
        setEditDescription(data.description);
        setEventMetaLoading(false);
      })
      .catch(() => {
        setEventMetaError('Could not load event metadata.');
        setEventMetaLoading(false);
      });
  }, [sessionId]);

  // Fetch current roles for this event
  useEffect(() => {
    if (!sessionId) return;
    setRolesLoading(true);
    fetch(`/api/organizer/event/${sessionId}/roles`)
      .then(res => res.ok ? res.json() : Promise.reject('Failed to load roles'))
      .then(data => {
        setRoles(Array.isArray(data) ? data : []);
        setRolesLoading(false);
      })
      .catch(() => {
        setRolesError('Could not load event roles.');
        setRolesLoading(false);
      });
  }, [sessionId, addingRole]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch(`/api/organizer/event/${sessionId}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle, start_time: editTime, description: editDescription })
      });
      if (!res.ok) throw new Error('api');
      setEditMode(false);
      setEventMeta({ ...eventMeta, title: editTitle, start_time: editTime, description: editDescription });
    } catch {
      setSaveError('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  // Add moderator or speaker
  const handleAddRole = async (e) => {
    e.preventDefault();
    setAddRoleError('');
    setAddingRole(true);
    try {
      if (addRoleType === 'organizer' && roles.some(r => r.role === 'organizer')) {
        setAddRoleError('There is already an organizer for this event.');
        setAddingRole(false);
        return;
      }
      const res = await fetch(`/api/organizer/event/${sessionId}/add_role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: addRoleEmail, role: addRoleType })
      });
      if (!res.ok) throw new Error('api');
      setAddRoleEmail('');
      setAddRoleType('moderator');
    } catch {
      setAddRoleError('Failed to add role.');
    } finally {
      setAddingRole(false);
    }
  };

  // Remove moderator or speaker
  const handleRemoveRole = async (userId, role) => {
    if (role === 'organizer') {
      alert('Cannot remove the only organizer.');
      return;
    }
    try {
      await fetch(`/api/organizer/event/${sessionId}/remove_role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, role })
      });
      setRoles(r => r.filter(u => !(u.user_id === userId && u.role === role)));
    } catch {
      alert('Failed to remove role.');
    }
  };

  // TODO: Enforce one organizer per event in the backend

  return (
    <div className="container py-4">
      <h2>Organizer Dashboard</h2>
      {eventMetaLoading ? (
        <div>Loading event info...</div>
      ) : eventMetaError ? (
        <div className="alert alert-danger">{eventMetaError}</div>
      ) : eventMeta ? (
        <div className="mb-4">
          {editMode ? (
            <>
              <input className="form-control mb-2" value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Event Title" />
              <input className="form-control mb-2" type="datetime-local" value={editTime} onChange={e => setEditTime(e.target.value)} placeholder="Start Time" />
              <textarea className="form-control mb-2" value={editDescription} onChange={e => setEditDescription(e.target.value)} placeholder="Description" />
              <button className="btn btn-success me-2" onClick={handleSave} disabled={saving}>Save</button>
              <button className="btn btn-secondary" onClick={() => setEditMode(false)} disabled={saving}>Cancel</button>
              {saveError && <div className="text-danger mt-2">{saveError}</div>}
            </>
          ) : (
            <>
              <h4>{eventMeta.title}</h4>
              <div><strong>Time:</strong> {eventMeta.start_time ? new Date(eventMeta.start_time).toLocaleString() : ''}</div>
              <div><strong>Description:</strong> {eventMeta.description}</div>
              <QRCodeImage sessionId={sessionId} />
              <button className="btn btn-primary mt-3 me-2" onClick={() => setEditMode(true)}>Edit Event</button>
            </>
          )}
        </div>
      ) : null}
      {/* Role management UI */}
      <div className="mb-4">
        <h5>Manage Moderators & Speakers</h5>
        {rolesLoading ? (
          <div>Loading roles...</div>
        ) : rolesError ? (
          <div className="alert alert-danger">{rolesError}</div>
        ) : (
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {roles.map(r => (
                <tr key={r.user_id + r.role}>
                  <td>{r.name}</td>
                  <td>{r.email}</td>
                  <td>{r.role}</td>
                  <td>
                    {r.role !== 'organizer' && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleRemoveRole(r.user_id, r.role)}>Remove</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <form className="d-flex align-items-end gap-2 mt-2" onSubmit={handleAddRole}>
          <input type="email" className="form-control" placeholder="User email" value={addRoleEmail} onChange={e => setAddRoleEmail(e.target.value)} required disabled={addingRole} />
          <select className="form-select" value={addRoleType} onChange={e => setAddRoleType(e.target.value)} disabled={addingRole}>
            <option value="moderator">Moderator</option>
            <option value="speaker">Speaker</option>
            <option value="organizer">Organizer</option>
          </select>
          <button className="btn btn-primary" type="submit" disabled={addingRole}>Add</button>
        </form>
        {addRoleError && <div className="text-danger mt-2">{addRoleError}</div>}
      </div>
      {/* Inherit moderator features */}
      <ModeratorDashboard sessionId={sessionId} user={user} />
    </div>
  );
}

export default OrganizerDashboard;
