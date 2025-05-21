import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RequireAuth from '../components/RequireAuth'; // Assuming RequireAuth is exported for test, otherwise test via App

describe('RequireAuth', () => {
  beforeEach(() => {
    // Reset localStorage and window.location before each test
    localStorage.clear();
    delete window.location;
    window.location = { href: '' };
  });

  it('redirects to /login if not authenticated', () => {
    render(<RequireAuth><div>Protected</div></RequireAuth>);
    expect(window.location.href).toBe('/login');
  });

  it('renders children if authenticated', () => {
    localStorage.setItem('user_token', 'test');
    const { getByText } = render(<RequireAuth><div>Protected</div></RequireAuth>);
    expect(getByText('Protected')).toBeInTheDocument();
    localStorage.removeItem('user_token');
  });
});
