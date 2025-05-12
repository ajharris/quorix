import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ModeratorDashboard from './ModeratorDashboard';

const sampleQuestions = [
  { id: 1, text: 'First question?' },
  { id: 2, text: 'Second question?' },
  { id: 3, text: 'Third question?' }
];

describe('ModeratorDashboard', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('shows loading and then questions', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(sampleQuestions)
    });
    render(<ModeratorDashboard sessionId="abc" />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(await screen.findByText('First question?')).toBeInTheDocument();
    expect(screen.getByText('Second question?')).toBeInTheDocument();
  });

  it('shows empty state', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
    render(<ModeratorDashboard sessionId="abc" />);
    expect(await screen.findByText(/no questions/i)).toBeInTheDocument();
  });

  it('handles API failure', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false });
    render(<ModeratorDashboard sessionId="abc" />);
    expect(await screen.findByText(/failed to load/i)).toBeInTheDocument();
  });

  it('handles unauthorized', async () => {
    global.fetch.mockResolvedValueOnce({ status: 401 });
    render(<ModeratorDashboard sessionId="abc" />);
    expect(await screen.findByText(/unauthorized/i)).toBeInTheDocument();
  });

  it('approves, deletes, and flags a question', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(sampleQuestions) }) // load
      .mockResolvedValue({ ok: true }); // actions
    render(<ModeratorDashboard sessionId="abc" />);
    expect(await screen.findByText('First question?')).toBeInTheDocument();
    fireEvent.click(screen.getAllByText('Approve')[0]);
    await waitFor(() => expect(screen.queryByText('First question?')).not.toBeInTheDocument());
    fireEvent.click(screen.getAllByText('Delete')[0]);
    await waitFor(() => expect(screen.queryByText('Second question?')).not.toBeInTheDocument());
    fireEvent.click(screen.getAllByText('Flag')[0]);
    await waitFor(() => expect(screen.queryByText('Third question?')).not.toBeInTheDocument());
  });

  it('handles action failure', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(sampleQuestions) })
      .mockResolvedValue({ ok: false });
    render(<ModeratorDashboard sessionId="abc" />);
    expect(await screen.findByText('First question?')).toBeInTheDocument();
    fireEvent.click(screen.getAllByText('Approve')[0]);
    expect(await screen.findByText(/action failed/i)).toBeInTheDocument();
  });

  it('merges questions', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(sampleQuestions) })
      .mockResolvedValue({ ok: true });
    render(<ModeratorDashboard sessionId="abc" />);
    expect(await screen.findByText('First question?')).toBeInTheDocument();
    fireEvent.click(screen.getAllByLabelText('select-question-1')[0]);
    fireEvent.click(screen.getAllByLabelText('select-question-2')[0]);
    fireEvent.click(screen.getByText('Merge Selected'));
    await waitFor(() => expect(screen.queryByText('First question?')).not.toBeInTheDocument());
    expect(screen.queryByText('Second question?')).not.toBeInTheDocument();
  });

  it('disables merge with <2 selected', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(sampleQuestions) });
    render(<ModeratorDashboard sessionId="abc" />);
    expect(await screen.findByText('First question?')).toBeInTheDocument();
    expect(screen.getByText('Merge Selected')).toBeDisabled();
    fireEvent.click(screen.getAllByLabelText('select-question-1')[0]);
    expect(screen.getByText('Merge Selected')).toBeDisabled();
    fireEvent.click(screen.getAllByLabelText('select-question-2')[0]);
    expect(screen.getByText('Merge Selected')).toBeEnabled();
  });

  it('handles merge failure', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(sampleQuestions) })
      .mockResolvedValue({ ok: false });
    render(<ModeratorDashboard sessionId="abc" />);
    expect(await screen.findByText('First question?')).toBeInTheDocument();
    fireEvent.click(screen.getAllByLabelText('select-question-1')[0]);
    fireEvent.click(screen.getAllByLabelText('select-question-2')[0]);
    fireEvent.click(screen.getByText('Merge Selected'));
    expect(await screen.findByText(/merge failed/i)).toBeInTheDocument();
  });

  it('triggers synthesis and displays result', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(sampleQuestions) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ summary: 'Synthesized summary.' }) });
    render(<ModeratorDashboard sessionId="abc" />);
    expect(await screen.findByText('First question?')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Trigger Synthesis'));
    expect(await screen.findByTestId('synth-result')).toHaveTextContent('Synthesized summary.');
  });

  it('handles synthesis failure', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(sampleQuestions) })
      .mockResolvedValueOnce({ ok: false });
    render(<ModeratorDashboard sessionId="abc" />);
    expect(await screen.findByText('First question?')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Trigger Synthesis'));
    expect(await screen.findByText(/synthesis failed/i)).toBeInTheDocument();
  });
});
