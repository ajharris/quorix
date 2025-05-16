import React, { useState } from 'react';

// --- NavBarLoginForm Component ---
// This component renders the login form for the NavBar.
// It manages its own state for email, password, and error messages.
function NavBarLoginForm({ onLogin, onCancel }) {
  // --- State for form fields and loading/error status ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // --- Handle login form submission ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Send login request to backend
      const res = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        onLogin({ email, role: data.role });
        setEmail('');
        setPassword('');
        onCancel(); // Close the form
      } else {
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  // --- Rendered UI ---
  return (
    <form className="d-flex flex-column" onSubmit={handleLogin}>
      <input
        type="email"
        className="form-control form-control-sm mb-2"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        className="form-control form-control-sm mb-2"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />
      <button className="btn btn-primary btn-sm mb-2" type="submit" disabled={loading}>
        {loading ? '...' : 'Login'}
      </button>
      <button className="btn btn-link btn-sm mb-2" type="button" onClick={onCancel}>
        Cancel
      </button>
      {/* Show error message if present */}
      {error && <span className="text-danger small mt-2">{error}</span>}
      <div className="text-center mt-2">
        <div className="mb-2 text-muted">or login with</div>
        <button className="btn btn-outline-primary btn-sm me-1" type="button">Facebook</button>
        <button className="btn btn-outline-danger btn-sm me-1" type="button">Google</button>
        <button className="btn btn-outline-dark btn-sm" type="button">Apple</button>
      </div>
    </form>
  );
}

export default NavBarLoginForm;
