import React, { useState } from 'react';
import NavBar from '../components/NavBar';

// SpeakerDashboard: Allows speakers to upload or edit their talk abstract
function SpeakerDashboard({ user, onLogin, onLogout }) {
  const [abstract, setAbstract] = useState('');
  const [status, setStatus] = useState('');

  const handleAbstractChange = (e) => {
    setAbstract(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Replace with real API call
    setStatus('Uploading...');
    setTimeout(() => {
      setStatus('Abstract uploaded successfully!');
    }, 1000);
  };

  return (
    <>
      <NavBar user={user} onLogin={onLogin} onLogout={onLogout} />
      <div className="container mt-5" style={{ maxWidth: 600 }}>
        <h2>Speaker Dashboard</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="abstract" className="form-label">Talk Abstract</label>
            <textarea
              id="abstract"
              className="form-control"
              rows={6}
              value={abstract}
              onChange={handleAbstractChange}
              placeholder="Paste or write your talk abstract here..."
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">Upload Abstract</button>
        </form>
        {status && <div className="alert alert-info mt-3">{status}</div>}
      </div>
    </>
  );
}

export default SpeakerDashboard;
