import React, { useState } from 'react';

// --- NavBarRegisterForm Component ---
// This component renders the registration form for the NavBar.
// It manages its own state for email, password, and error messages.
function NavBarRegisterForm({ onRegister, onCancel }) {
  // --- State for form fields and loading/error status ---
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);

  // --- Handle registration form submission ---
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterLoading(true);
    setRegisterError('');
    try {
      // Send registration request to backend
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registerEmail, password: registerPassword })
      });
      const data = await res.json();
      if (res.ok) {
        onRegister({ email: registerEmail, role: data.role || 'attendee' });
        setRegisterEmail('');
        setRegisterPassword('');
        onCancel(); // Close the form
      } else {
        setRegisterError(data.error || 'Registration failed');
      }
    } catch {
      setRegisterError('Network error');
    } finally {
      setRegisterLoading(false);
    }
  };

  // --- Rendered UI ---
  return (
    <form className="d-flex flex-column" onSubmit={handleRegister}>
      <input
        type="email"
        className="form-control form-control-sm mb-2"
        placeholder="Email"
        value={registerEmail}
        onChange={e => setRegisterEmail(e.target.value)}
        required
      />
      <input
        type="password"
        className="form-control form-control-sm mb-2"
        placeholder="Password"
        value={registerPassword}
        onChange={e => setRegisterPassword(e.target.value)}
        required
      />
      <button className="btn btn-success btn-sm mb-2" type="submit" disabled={registerLoading}>
        {registerLoading ? '...' : 'Register'}
      </button>
      <button className="btn btn-link btn-sm mb-2" type="button" onClick={onCancel}>
        Cancel
      </button>
      {/* Show error message if present */}
      {registerError && <span className="text-danger small mt-2">{registerError}</span>}
    </form>
  );
}

export default NavBarRegisterForm;
