import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import NavBar from './NavBar';

describe('NavBar', () => {
  const onLogin = jest.fn();
  const onLogout = jest.fn();

  beforeEach(() => {
    onLogin.mockClear();
    onLogout.mockClear();
  });

  it('shows login and register buttons when logged out', () => {
    render(<NavBar user={null} onLogin={onLogin} onLogout={onLogout} />);
    expect(screen.getByRole('button', { name: /^login$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^register$/i })).toBeInTheDocument();
  });

  it('shows login form when login button is clicked', () => {
    render(<NavBar user={null} onLogin={onLogin} onLogout={onLogout} />);
    fireEvent.click(screen.getByRole('button', { name: /^login$/i }));
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByText(/or login with/i)).toBeInTheDocument();
  });

  it('shows register form when register button is clicked', () => {
    render(<NavBar user={null} onLogin={onLogin} onLogout={onLogout} />);
    fireEvent.click(screen.getByRole('button', { name: /^register$/i }));
    expect(screen.getByPlaceholderText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
  });

  it('toggles between login and register forms', () => {
    render(<NavBar user={null} onLogin={onLogin} onLogout={onLogout} />);
    fireEvent.click(screen.getByRole('button', { name: /^login$/i }));
    fireEvent.click(screen.getByText(/new user\? register/i));
    // The register form's submit button (second Register button)
    expect(screen.getAllByRole('button', { name: /^register$/i })[1]).toBeInTheDocument();
    fireEvent.click(screen.getByText(/already have an account/i));
    expect(screen.getAllByRole('button', { name: /^login$/i })[1]).toBeInTheDocument();
  });

  it('calls onLogin on successful login', async () => {
    global.fetch = jest.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ role: 'attendee' })
    }));
    render(<NavBar user={null} onLogin={onLogin} onLogout={onLogout} />);
    fireEvent.click(screen.getByRole('button', { name: /^login$/i }));
    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'code123' } });
    fireEvent.click(screen.getAllByRole('button', { name: /^login$/i })[1]);
    await waitFor(() => expect(onLogin).toHaveBeenCalledWith({ email: 'user@example.com', role: 'attendee' }));
  });

  it('shows error on failed login', async () => {
    global.fetch = jest.fn(() => Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ error: 'Invalid credentials' })
    }));
    render(<NavBar user={null} onLogin={onLogin} onLogout={onLogout} />);
    fireEvent.click(screen.getByRole('button', { name: /^login$/i }));
    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'bad@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'badcode' } });
    fireEvent.click(screen.getAllByRole('button', { name: /^login$/i })[1]);
    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
  });

  it('calls onLogin on successful registration', async () => {
    global.fetch = jest.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ role: 'attendee' })
    }));
    render(<NavBar user={null} onLogin={onLogin} onLogout={onLogout} />);
    fireEvent.click(screen.getByRole('button', { name: /^register$/i }));
    fireEvent.change(screen.getByPlaceholderText(/^email$/i), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'pw123' } });
    fireEvent.click(screen.getAllByRole('button', { name: /^register$/i })[1]);
    await waitFor(() => expect(onLogin).toHaveBeenCalledWith({ email: 'new@example.com', role: 'attendee' }));
  });

  it('shows error on failed registration', async () => {
    global.fetch = jest.fn(() => Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ error: 'Email exists' })
    }));
    render(<NavBar user={null} onLogin={onLogin} onLogout={onLogout} />);
    fireEvent.click(screen.getByRole('button', { name: /^register$/i }));
    fireEvent.change(screen.getByPlaceholderText(/^email$/i), { target: { value: 'exists@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'pw123' } });
    fireEvent.click(screen.getAllByRole('button', { name: /^register$/i })[1]);
    expect(await screen.findByText(/email exists/i)).toBeInTheDocument();
  });

  it('shows user info and logout when logged in', () => {
    render(<NavBar user={{ email: 'user@example.com', role: 'attendee' }} onLogin={onLogin} onLogout={onLogout} />);
    expect(screen.getByText(/logged in as/i)).toBeInTheDocument();
    expect(screen.getByText(/user@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/logout/i)).toBeInTheDocument();
  });

  it('calls onLogout when logout button is clicked', () => {
    render(<NavBar user={{ email: 'user@example.com', role: 'attendee' }} onLogin={onLogin} onLogout={onLogout} />);
    fireEvent.click(screen.getByText(/logout/i));
    expect(onLogout).toHaveBeenCalled();
  });

  it('renders social login buttons', () => {
    render(<NavBar user={null} onLogin={onLogin} onLogout={onLogout} />);
    fireEvent.click(screen.getByRole('button', { name: /^login$/i }));
    expect(screen.getByText(/facebook/i)).toBeInTheDocument();
    expect(screen.getByText(/google/i)).toBeInTheDocument();
    expect(screen.getByText(/apple/i)).toBeInTheDocument();
  });
});
