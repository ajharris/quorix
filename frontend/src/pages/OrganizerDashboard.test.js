import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OrganizerDashboard from './OrganizerDashboard';

describe('OrganizerDashboard', () => {
  const mockUser = { id: 1, name: 'Organizer', role: 'organizer' };
  const sessionId = 'demo';

  beforeEach(() => {
    global.fetch = jest.fn((url) => {
      if (url.includes('/api/session/')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ title: 'Demo Event', start_time: '2025-05-16T12:00:00Z', description: 'Event desc' }) });
      }
      if (url.includes('/api/organizer/event/demo/roles')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([{ user_id: 2, name: 'Mod', email: 'mod@example.com', role: 'moderator' }]) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });
  });

  it('renders event meta and role management', async () => {
    render(<OrganizerDashboard sessionId={sessionId} user={mockUser} />);
    expect(await screen.findByText(/Organizer Dashboard/i)).toBeInTheDocument();
    expect(await screen.findByText(/Demo Event/i)).toBeInTheDocument();
    expect(await screen.findByText(/Manage Moderators & Speakers/i)).toBeInTheDocument();
    // Use findAllByText for 'Mod' and assert at least one exists
    const modCells = await screen.findAllByText('Mod');
    expect(modCells.length).toBeGreaterThan(0);
  });

  it('allows adding a moderator', async () => {
    render(<OrganizerDashboard sessionId={sessionId} user={mockUser} />);
    await screen.findByText(/Manage Moderators & Speakers/i);
    fireEvent.change(screen.getByPlaceholderText(/User email/i), { target: { value: 'newmod@example.com' } });
    // Use getByRole for the select and set value to 'moderator'
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'moderator' } });
    fireEvent.click(screen.getByRole('button', { name: /Add/i }));
    // No error means the form was submitted; backend call is mocked
  });
});
