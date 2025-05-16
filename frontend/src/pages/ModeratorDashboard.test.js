import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ModeratorDashboard from './ModeratorDashboard';

const sampleQuestions = [
  { id: 1, text: 'First question?' },
  { id: 2, text: 'Second question?' },
  { id: 3, text: 'Third question?' }
];

const mockUser = { id: 123, role: 'moderator', email: 'mod@example.com' };

describe('ModeratorDashboard', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  function mockInitialFetches(questions = sampleQuestions) {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ moderator_for: [{ session_id: 'abc' }] })
      }) // moderator status
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(questions)
      }) // questions
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      }); // events
  }

  it('shows loading and then questions', async () => {
    mockInitialFetches();
    render(<ModeratorDashboard sessionId="abc" user={mockUser} />);
    expect(screen.getByText(/checking permissions/i)).toBeInTheDocument();
    expect(await screen.findByText('First question?')).toBeInTheDocument();
  });

  it('shows empty state', async () => {
    mockInitialFetches([]);
    render(<ModeratorDashboard sessionId="abc" user={mockUser} />);
    expect(await screen.findByText('No new questions.')).toBeInTheDocument();
  });

  it('handles API failure', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ moderator_for: [{ session_id: 'abc' }] })
      })
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
    render(<ModeratorDashboard sessionId="abc" user={mockUser} />);
    expect(await screen.findByText(/failed to load/i)).toBeInTheDocument();
  });

  it('handles unauthorized', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ moderator_for: [{ session_id: 'abc' }] })
      })
      .mockResolvedValueOnce({ status: 401 })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
    render(<ModeratorDashboard sessionId="abc" user={mockUser} />);
    expect(await screen.findByText(/unauthorized/i)).toBeInTheDocument();
  });

  it('approves, deletes, and flags a question', async () => {
    mockInitialFetches();
    // After the three initial fetches, all subsequent fetches (for actions) should resolve ok
    global.fetch.mockResolvedValue({ ok: true });
    render(<ModeratorDashboard sessionId="abc" user={mockUser} />);
    expect(await screen.findByText('First question?')).toBeInTheDocument();
    fireEvent.click(screen.getAllByText('Approve')[0]);
    await waitFor(() => expect(screen.queryByText('First question?')).not.toBeInTheDocument());
    fireEvent.click(screen.getAllByText('Delete')[0]);
    await waitFor(() => expect(screen.queryByText('Second question?')).not.toBeInTheDocument());
    fireEvent.click(screen.getAllByText('Flag')[0]);
    await waitFor(() => expect(screen.queryByText('Third question?')).not.toBeInTheDocument());
  });

  it('handles action failure', async () => {
    mockInitialFetches();
    global.fetch.mockResolvedValue({ ok: false });
    render(<ModeratorDashboard sessionId="abc" user={mockUser} />);
    expect(await screen.findByText('First question?')).toBeInTheDocument();
    fireEvent.click(screen.getAllByText('Approve')[0]);
    expect(await screen.findByText(/action failed/i)).toBeInTheDocument();
  });

  it('merges questions', async () => {
    mockInitialFetches();
    global.fetch.mockResolvedValue({ ok: true });
    render(<ModeratorDashboard sessionId="abc" user={mockUser} />);
    expect(await screen.findByText('First question?')).toBeInTheDocument();
    fireEvent.click(screen.getAllByLabelText('select-question-1')[0]);
    fireEvent.click(screen.getAllByLabelText('select-question-2')[0]);
    fireEvent.click(screen.getByText('Merge Selected'));
    await waitFor(() => expect(screen.queryByText('First question?')).not.toBeInTheDocument());
    expect(screen.queryByText('Second question?')).not.toBeInTheDocument();
  });

  it('disables merge with <2 selected', async () => {
    mockInitialFetches();
    render(<ModeratorDashboard sessionId="abc" user={mockUser} />);
    expect(await screen.findByText('First question?')).toBeInTheDocument();
    expect(screen.getByText('Merge Selected')).toBeDisabled();
    fireEvent.click(screen.getAllByLabelText('select-question-1')[0]);
    expect(screen.getByText('Merge Selected')).toBeDisabled();
    fireEvent.click(screen.getAllByLabelText('select-question-2')[0]);
    expect(screen.getByText('Merge Selected')).toBeEnabled();
  });

  it('handles merge failure', async () => {
    mockInitialFetches();
    global.fetch.mockResolvedValue({ ok: false });
    render(<ModeratorDashboard sessionId="abc" user={mockUser} />);
    expect(await screen.findByText('First question?')).toBeInTheDocument();
    fireEvent.click(screen.getAllByLabelText('select-question-1')[0]);
    fireEvent.click(screen.getAllByLabelText('select-question-2')[0]);
    fireEvent.click(screen.getByText('Merge Selected'));
    expect(await screen.findByText(/merge failed/i)).toBeInTheDocument();
  });

  it('triggers synthesis and displays result', async () => {
    mockInitialFetches();
    // The next fetch is for synthesis
    global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ summary: 'Synthesized summary.' }) });
    render(<ModeratorDashboard sessionId="abc" user={mockUser} />);
    expect(await screen.findByText('First question?')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Trigger Synthesis'));
    expect(await screen.findByTestId('synth-result')).toHaveTextContent('Synthesized summary.');
  });

  it('handles synthesis failure', async () => {
    mockInitialFetches();
    global.fetch.mockResolvedValueOnce({ ok: false });
    render(<ModeratorDashboard sessionId="abc" user={mockUser} />);
    expect(await screen.findByText('First question?')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Trigger Synthesis'));
    expect(await screen.findByText(/synthesis failed/i)).toBeInTheDocument();
  });
});
