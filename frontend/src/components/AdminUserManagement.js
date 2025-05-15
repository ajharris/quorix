import React, { useEffect, useState } from 'react';

function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editUserId, setEditUserId] = useState(null);
  const [editRole, setEditRole] = useState('attendee');
  const [saving, setSaving] = useState(false);
  const [banDialogUser, setBanDialogUser] = useState(null);
  const [banType, setBanType] = useState('permanent');
  const [banDuration, setBanDuration] = useState('');
  const [banning, setBanning] = useState(false);

  useEffect(() => {
    fetch('/api/admin/users')
      .then(res => res.ok ? res.json() : Promise.reject('Failed to load users'))
      .then(data => {
        setUsers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load users.');
        setLoading(false);
      });
  }, []);

  const handleEdit = (user) => {
    setEditUserId(user.id);
    setEditRole(user.role);
  };

  const handleSave = async (userId) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editRole })
      });
      if (!res.ok) throw new Error('api');
      setUsers(users => users.map(u => u.id === userId ? { ...u, role: editRole } : u));
      setEditUserId(null);
    } catch {
      setError('Failed to update user role.');
    } finally {
      setSaving(false);
    }
  };

  const handleBan = (user) => {
    setBanDialogUser(user);
    setBanType('permanent');
    setBanDuration('');
  };

  const handleBanSubmit = async () => {
    if (!banDialogUser) return;
    setBanning(true);
    try {
      const res = await fetch(`/api/admin/users/${banDialogUser.id}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: banType,
          duration: banType === 'temporary' ? banDuration : undefined
        })
      });
      if (!res.ok) throw new Error('api');
      setUsers(users => users.map(u => u.id === banDialogUser.id ? { ...u, banned: true, banType, banDuration: banType === 'temporary' ? banDuration : null } : u));
      setBanDialogUser(null);
    } catch {
      setError('Failed to ban user.');
    } finally {
      setBanning(false);
    }
  };

  const handleUnban = async (user) => {
    setBanning(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/unban`, { method: 'POST' });
      if (!res.ok) throw new Error('api');
      setUsers(users => users.map(u => u.id === user.id ? { ...u, banned: false, banType: null, banDuration: null } : u));
    } catch {
      setError('Failed to unban user.');
    } finally {
      setBanning(false);
    }
  };

  if (loading) return <div>Loading users...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="mt-4">
      <h3>User Management</h3>
      <table className="table table-bordered table-sm mt-3">
        <thead>
          <tr>
            <th>Email</th>
            <th>Name</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.email}</td>
              <td>{user.name || '-'}</td>
              <td>
                {editUserId === user.id ? (
                  <select value={editRole} onChange={e => setEditRole(e.target.value)} disabled={saving}>
                    <option value="admin">Admin</option>
                    <option value="organizer">Organizer</option>
                    <option value="moderator">Moderator</option>
                    <option value="attendee">Attendee</option>
                  </select>
                ) : (
                  user.role
                )}
              </td>
              <td>{user.banned ? (user.banType === 'temporary' ? `Banned (temp)` : 'Banned') : 'Active'}</td>
              <td>
                {editUserId === user.id ? (
                  <>
                    <button className="btn btn-success btn-sm me-2" onClick={() => handleSave(user.id)} disabled={saving}>Save</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditUserId(null)} disabled={saving}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button className="btn btn-primary btn-sm me-2" onClick={() => handleEdit(user)}>Edit</button>
                    {user.banned ? (
                      <button className="btn btn-warning btn-sm" onClick={() => handleUnban(user)} disabled={banning}>Unban</button>
                    ) : (
                      <button className="btn btn-danger btn-sm" onClick={() => handleBan(user)} disabled={banning}>Ban</button>
                    )}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Ban dialog */}
      {banDialogUser && (
        <div className="modal show" style={{ display: 'block', background: 'rgba(0,0,0,0.3)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Ban User: {banDialogUser.email}</h5>
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

export default AdminUserManagement;
