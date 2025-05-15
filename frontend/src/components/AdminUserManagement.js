import React, { useEffect, useState } from 'react';

function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editUserId, setEditUserId] = useState(null);
  const [editRole, setEditRole] = useState('attendee');
  const [saving, setSaving] = useState(false);

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
              <td>
                {editUserId === user.id ? (
                  <>
                    <button className="btn btn-success btn-sm me-2" onClick={() => handleSave(user.id)} disabled={saving}>Save</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditUserId(null)} disabled={saving}>Cancel</button>
                  </>
                ) : (
                  <button className="btn btn-primary btn-sm" onClick={() => handleEdit(user)}>Edit</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminUserManagement;
