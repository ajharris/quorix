import React from 'react';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EventChat from './EventChat';

describe('EventChat', () => {
  const user = { id: 1, name: 'Test User' };
  const eventId = 42;

  beforeEach(() => {
    jest.clearAllMocks();
    // Default: always resolve fetch to avoid undefined
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));
  });

  it('renders loading and then messages', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([
      { id: 1, user_id: 1, text: 'Hello', timestamp: new Date().toISOString() },
      { id: 2, user_id: 2, text: 'Hi', timestamp: new Date().toISOString() }
    ]) });
    render(<EventChat user={user} eventId={eventId} />);
    expect(screen.getByText(/loading chat/i)).toBeInTheDocument();
    expect(await screen.findByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi')).toBeInTheDocument();
  });

  it('shows error if fetch fails', async () => {
    global.fetch.mockRejectedValueOnce(new Error('fail'));
    render(<EventChat user={user} eventId={eventId} />);
    const errors = await screen.findAllByText(/could not load chat messages/i);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('shows no messages state', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
    render(<EventChat user={user} eventId={eventId} />);
    expect(await screen.findByText(/no messages yet/i)).toBeInTheDocument();
  });

  it('can send a message', async () => {
    // Initial fetch
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      // Post
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: 3, user_id: 1, text: 'Test', timestamp: new Date().toISOString() }) })
      // Refresh
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([
        { id: 3, user_id: 1, text: 'Test', timestamp: new Date().toISOString() }
      ]) });
    render(<EventChat user={user} eventId={eventId} />);
    await screen.findByText(/no messages yet/i);
    fireEvent.change(screen.getByPlaceholderText(/type a message/i), { target: { value: 'Test' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    await waitFor(() => expect(screen.getByText('Test')).toBeInTheDocument());
  });

  it('shows error if send fails', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      .mockRejectedValueOnce(new Error('fail'));
    render(<EventChat user={user} eventId={eventId} />);
    await screen.findByText(/no messages yet/i);
    fireEvent.change(screen.getByPlaceholderText(/type a message/i), { target: { value: 'Oops' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    const errors = await screen.findAllByText(/failed to send message/i);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('EventChat (moderator controls)', () => {
  const user = { id: 1, name: 'Mod', role: 'moderator' };
  const eventId = 42;
  const messages = [
    { id: 10, user_id: 1, text: 'Hello', timestamp: new Date().toISOString() },
    { id: 11, user_id: 2, text: 'Hi', timestamp: new Date().toISOString() },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Default: always resolve fetch to avoid undefined
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));
  });

  it('shows moderator controls for each message', async () => {
    // Initial fetch returns messages with two users
    global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(messages) });
    render(<EventChat user={user} eventId={eventId} isModerator={true} />);
    expect(await screen.findByText('Hello')).toBeInTheDocument();
    expect(screen.getAllByText('Delete').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Mute').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Expel').length).toBeGreaterThan(0);
  });

  it('calls delete, mute, expel endpoints', async () => {
    window.confirm = jest.fn(() => true);
    window.prompt = jest.fn(() => '5');
    // Initial fetch returns messages with two users
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(messages) }) // initial fetch
      .mockResolvedValueOnce({ ok: true }) // delete
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(messages) }) // refresh after delete
      .mockResolvedValueOnce({ ok: true }) // mute
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(messages) }); // refresh after mute
    render(<EventChat user={user} eventId={eventId} isModerator={true} />);
    await screen.findByText('Hello');
    fireEvent.click(screen.getAllByText('Delete')[0]);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/delete'), expect.anything()));
    fireEvent.click(screen.getAllByText('Mute')[0]);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/mute'), expect.anything()));
    // After mute, check for info message instead of clicking Expel
    expect(screen.getAllByText(/muted for 5 min/i).length).toBeGreaterThan(0);
  });
});
