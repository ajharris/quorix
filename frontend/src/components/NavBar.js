import React, { useState } from 'react';

function NavBar({ user, onLogin, onLogout }) {
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, session_code: sessionCode })
      });
      const data = await res.json();
      if (res.ok) {
        onLogin({ email, role: data.role });
        setShowLogin(false);
        setEmail('');
        setSessionCode('');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterLoading(true);
    setRegisterError('');
    try {
      const res = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registerEmail, password: registerPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setShowRegister(false);
        setRegisterEmail('');
        setRegisterPassword('');
        onLogin({ email: registerEmail, role: data.role || 'attendee' });
      } else {
        setRegisterError(data.error || 'Registration failed');
      }
    } catch {
      setRegisterError('Network error');
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light mb-4">
      <div className="container-fluid">
        <a className="navbar-brand" href="/">Quorix</a>
        <div className="d-flex ms-auto">
          {user ? (
            <>
              <span className="me-3">Logged in as <b>{user.email}</b> ({user.role})</span>
              <button className="btn btn-outline-danger btn-sm" onClick={onLogout}>Logout</button>
            </>
          ) : (
            <>
              <button className="btn btn-outline-primary btn-sm" onClick={() => { setShowLogin(v => !v); setShowRegister(false); }}>
                Login
              </button>
              <button className="btn btn-outline-success btn-sm ms-2" onClick={() => { setShowRegister(v => !v); setShowLogin(false); }}>
                Register
              </button>
              {showLogin && (
                <div className="ms-3 p-3 border rounded bg-white shadow-sm position-absolute" style={{ zIndex: 1000, minWidth: 320, right: 20, top: 60 }}>
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
                      type="text"
                      className="form-control form-control-sm mb-2"
                      placeholder="Session Code"
                      value={sessionCode}
                      onChange={e => setSessionCode(e.target.value)}
                      required
                    />
                    <button className="btn btn-primary btn-sm mb-2" type="submit" disabled={loading}>
                      {loading ? '...' : 'Login'}
                    </button>
                    <button className="btn btn-link btn-sm mb-2" type="button" onClick={() => setShowLogin(false)}>
                      Cancel
                    </button>
                    <div className="text-center text-muted mb-2" style={{ fontSize: '0.9em' }}>or login with</div>
                    <div className="d-flex justify-content-between mb-2">
                      <button type="button" className="btn btn-outline-secondary btn-sm w-100 me-1" onClick={() => window.location.href='/login/sso?provider=facebook'}>
                        <i className="bi bi-facebook me-1"></i> Facebook
                      </button>
                      <button type="button" className="btn btn-outline-danger btn-sm w-100 me-1" onClick={() => window.location.href='/login/sso?provider=google'}>
                        <i className="bi bi-google me-1"></i> Google
                      </button>
                      <button type="button" className="btn btn-outline-dark btn-sm w-100" onClick={() => window.location.href='/login/sso?provider=apple'}>
                        <i className="bi bi-apple me-1"></i> Apple
                      </button>
                    </div>
                    <div className="text-center mt-2">
                      <a href="#" className="small" onClick={e => { e.preventDefault(); setShowLogin(false); setShowRegister(true); }}>New user? Register</a>
                    </div>
                    {error && <span className="text-danger small mt-2">{error}</span>}
                  </form>
                </div>
              )}
              {showRegister && (
                <div className="ms-3 p-3 border rounded bg-white shadow-sm position-absolute" style={{ zIndex: 1000, minWidth: 320, right: 20, top: 60 }}>
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
                    <button className="btn btn-link btn-sm mb-2" type="button" onClick={() => setShowRegister(false)}>
                      Cancel
                    </button>
                    <div className="text-center mt-2">
                      <a href="#" className="small" onClick={e => { e.preventDefault(); setShowRegister(false); setShowLogin(true); }}>Already have an account? Login</a>
                    </div>
                    {registerError && <span className="text-danger small mt-2">{registerError}</span>}
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
