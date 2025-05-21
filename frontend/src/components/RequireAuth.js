import React from 'react';

// RequireAuth: Protects routes/components that require authentication
function RequireAuth({ children }) {
  // Replace with real auth logic
  const isAuthenticated = Boolean(localStorage.getItem('user_token'));
  if (!isAuthenticated) {
    window.location.href = '/login'; // Or show OAuth/login modal
    return null;
  }
  return children;
}

export default RequireAuth;
