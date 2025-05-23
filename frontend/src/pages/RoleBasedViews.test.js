import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import SpeakerView from './SpeakerView';

// Helper to set up user and role for App
function renderAppWithRole(role, extraUser = {}, initialSession = null) {
  // Enhanced fetch mock for all relevant endpoints
  global.fetch = jest.fn((url) => {
    if (url.includes('/api/ping')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ message: 'pong' }) });
    }
    if (url.includes('/create_session')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ session_id: 'demo', title: 'Demo Event', description: 'Demo event for QR code display.' }) });
    }
    if (url.includes('/api/events')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve([
        { session_id: 'demo', title: 'Demo Event', start_time: new Date().toISOString(), description: 'Demo event for QR code display.' }
      ]) });
    }
    if (url.includes('/api/mod/questions/')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve([
        { id: 1, text: 'Pending question?', status: 'pending' },
        { id: 2, text: 'Approved question!', status: 'approved' }
      ]) });
    }
    if (url.includes('/api/session/')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ session_id: 'demo', title: 'Demo Event', description: 'Demo event for QR code display.' }) });
    }
    if (url.includes('/api/mod/events')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve([
        { id: 'demo', name: 'Demo Event', session_id: 'demo' }
      ]) });
    }
    if (url.includes('/api/mod/links/')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve([
        { url: 'https://example.com', title: 'Example Link', published_by: 'moderator' }
      ]) });
    }
    if (url.includes('/api/user/') && url.includes('/events')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ moderator_for: [{ session_id: 'demo' }] }) });
    }
    // Admin endpoints
    if (url.includes('/api/admin/users')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve([{ id: 1, email: 'user1@example.com', role: 'attendee' }]) });
    }
    if (url.includes('/api/admin/questions')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve([{ id: 1, text: 'Admin question?' }]) });
    }
    // Default fallback
    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
  });
  // Render App with user and optional initialSession
  const user = { id: 42, email: `${role}@example.com`, role, ...extraUser };
  return render(<App initialUser={user} initialSession={initialSession} />);
}

describe('Role-Based Views Integration', () => {
  afterEach(() => { jest.clearAllMocks(); });

  it('renders attendee view with event info, chat, question form, and list', async () => {
    localStorage.setItem('user_token', 'test'); // Ensure auth for RequireAuth
    window.history.pushState({}, '', '/session/demo');
    renderAppWithRole('attendee');
    expect(await screen.findByText(/Quorix/)).toBeInTheDocument();
    // Click the event in the list if present
    const eventItems = await screen.findAllByText(/Demo Event/);
    fireEvent.click(eventItems[0]);
    // Now check for event details in the chat view
    expect(await screen.findByText(/Event Chat/)).toBeInTheDocument();
    expect(await screen.findByPlaceholderText(/Type your question/i)).toBeInTheDocument();
    localStorage.removeItem('user_token');
  });

  it('renders moderator dashboard with moderation controls', async () => {
    window.history.pushState({}, '', '/moderator/demo');
    renderAppWithRole('moderator');
    // Wait for dashboard to appear (not just loading)
    expect(await screen.findByText(/Moderator Dashboard/)).toBeInTheDocument();
    expect(await screen.findByText(/Links Published by Moderators/)).toBeInTheDocument();
    expect(await screen.findByText(/Pending Questions/)).toBeInTheDocument();
    expect(await screen.findByText(/Approved Questions/)).toBeInTheDocument();
  });

  it('renders organizer dashboard with event editing and management', async () => {
    window.history.pushState({}, '', '/');
    const session = { session_id: 'demo', title: 'Demo Event', description: 'Demo event for QR code display.' };
    renderAppWithRole('organizer', {}, session);
    expect(await screen.findByText(/Organizer Dashboard/)).toBeInTheDocument();
    // Use findAllByText for Demo Event and assert at least one exists
    const demoEventHeadings = await screen.findAllByText(/Demo Event/);
    expect(demoEventHeadings.length).toBeGreaterThan(0);
    // Check for QR code image by alt text
    expect(await screen.findByAltText(/Event QR Code/i)).toBeInTheDocument();
  });

  it('renders speaker view with navigation and fullscreen question', async () => {
    // Patch fetch to return approved questions for the speaker endpoint
    global.fetch = jest.fn((url) => {
      if (url.includes('/api/speaker/questions/demo')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 1, text: 'What is the future of AI in events?', status: 'approved' },
            { id: 2, text: 'How do you handle privacy concerns?', status: 'approved' },
            { id: 3, text: 'What are the next steps for Quorix?', status: 'approved' },
          ]),
        });
      }
      // fallback to default mock
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });
    render(<SpeakerView sessionId="demo" user={{ email: 'speaker@example.com', role: 'speaker' }} onLogin={jest.fn()} onLogout={jest.fn()} />);
    expect(await screen.findByText('What is the future of AI in events?')).toBeInTheDocument();
    expect(screen.getByText(/Question 1 of 3/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Next'));
    expect(await screen.findByText('How do you handle privacy concerns?')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Previous'));
    expect(await screen.findByText('What is the future of AI in events?')).toBeInTheDocument();
  });

  it('shows admin view with user and question management', async () => {
    window.history.pushState({}, '', '/');
    const session = { session_id: 'demo', title: 'Demo Event', description: 'Demo event for QR code display.' };
    renderAppWithRole('admin', {}, session);
    // Use findAllByText to avoid duplicate match error
    const adminHeadings = await screen.findAllByText(/Admin View/);
    expect(adminHeadings.length).toBeGreaterThan(0);
    expect(await screen.findByText(/User Management/)).toBeInTheDocument();
    expect(await screen.findByText(/All Questions/)).toBeInTheDocument();
  });
});
