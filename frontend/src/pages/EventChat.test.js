import React from 'react';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EventChat from './EventChat';

describe('EventChat', () => {
  const user = { id: 1, name: 'Test User' };
  const eventId = 42;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
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
