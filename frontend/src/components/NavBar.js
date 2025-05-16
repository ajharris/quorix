import React, { useState } from 'react';
import NavBarLoginForm from './NavBarLoginForm';
import NavBarRegisterForm from './NavBarRegisterForm';

// --- NavBar Component ---
// This component renders the top navigation bar, including login/logout/register controls.
// It manages the display of login/register forms and shows the current user info if logged in.
function NavBar({ user, onLogin, onLogout }) {
  // --- State for login/register form visibility and input fields ---
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // --- Rendered UI ---
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light mb-4">
      <div className="container-fluid">
        {/* Brand/Logo */}
        <a className="navbar-brand" href="/">Quorix</a>
        <div className="d-flex ms-auto">
          {/* If user is logged in, show user info and logout button */}
          {user ? (
            <>
              <span className="me-3">Logged in as <b>{user.email}</b> ({user.role})</span>
              <button className="btn btn-outline-danger btn-sm" onClick={onLogout}>Logout</button>
            </>
          ) : (
            <>
              {/* Login and Register buttons */}
              <button className="btn btn-outline-primary btn-sm" onClick={() => { setShowLogin(v => !v); setShowRegister(false); }}>
                Login
              </button>
              <button className="btn btn-outline-success btn-sm ms-2" onClick={() => { setShowRegister(v => !v); setShowLogin(false); }}>
                Register
              </button>
              {/* Login form popup */}
              {showLogin && (
                <div className="ms-3 p-3 border rounded bg-white shadow-sm position-absolute" style={{ zIndex: 1000, minWidth: 320, right: 20, top: 60 }}>
                  <NavBarLoginForm onLogin={onLogin} onCancel={() => setShowLogin(false)} />
                  {/* SSO login buttons and links can be added here if needed */}
                  <div className="text-center mt-2">
                    <a href="#" className="small" onClick={e => { e.preventDefault(); setShowLogin(false); setShowRegister(true); }}>New user? Register</a>
                  </div>
                </div>
              )}
              {/* Register form popup */}
              {showRegister && (
                <div className="ms-3 p-3 border rounded bg-white shadow-sm position-absolute" style={{ zIndex: 1000, minWidth: 320, right: 20, top: 60 }}>
                  <NavBarRegisterForm onRegister={onLogin} onCancel={() => setShowRegister(false)} />
                  <div className="text-center mt-2">
                    <a href="#" className="small" onClick={e => { e.preventDefault(); setShowRegister(false); setShowLogin(true); }}>Already have an account? Login</a>
                  </div>
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
