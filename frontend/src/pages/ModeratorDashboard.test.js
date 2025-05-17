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

  function mockInitialFetches(questions = sampleQuestions, {
    eventMeta = { title: 'Event Title', start_time: '2025-05-16T12:00:00Z', description: 'Event desc' },
    links = []
  } = {}) {
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
      }) // events
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(eventMeta)
      }) // event meta
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(links)
      }); // links
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
      }) // moderator check
      .mockResolvedValueOnce({ ok: false }) // questions fetch fails
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) }) // events
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ title: 'Event Title', start_time: '2025-05-16T12:00:00Z', description: 'Event desc' }) }) // event meta
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) }); // links
    render(<ModeratorDashboard sessionId="abc" user={mockUser} />);
    expect(await screen.findByText(/failed to load/i)).toBeInTheDocument();
  });

  it('handles unauthorized', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ moderator_for: [{ session_id: 'abc' }] })
      }) // moderator check
      .mockResolvedValueOnce({ status: 401 }) // questions fetch unauthorized
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) }) // events
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ title: 'Event Title', start_time: '2025-05-16T12:00:00Z', description: 'Event desc' }) }) // event meta
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) }); // links
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

describe('ModeratorDashboard - Links Feature', () => {
  const mockUser = { id: 123, name: 'Test Mod', email: 'mod@example.com', role: 'moderator' };
  const sessionId = 'abc123';

  function setupFetchMocks({
    moderator = true,
    eventMeta = { title: 'Event Title', start_time: '2025-05-16T12:00:00Z', description: 'Event desc' },
    links = [],
  } = {}) {
    global.fetch = jest.fn()
      // Moderator check
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ moderator_for: moderator ? [{ session_id: sessionId }] : [] })
      })
      // Questions fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      })
      // Events fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      })
      // Event meta fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(eventMeta)
      })
      // Links fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(links)
      });
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays event metadata and published links', async () => {
    setupFetchMocks({ links: [
      { url: 'https://example.com', title: 'Example', published_by: 'Alice' },
      { url: 'https://foo.com', title: '', published_by: 'Bob' }
    ] });
    render(<ModeratorDashboard sessionId={sessionId} user={mockUser} />);
    expect(await screen.findByText('Event Title')).toBeInTheDocument();
    expect(screen.getByText('Event desc')).toBeInTheDocument();
    expect(screen.getByText('Example')).toBeInTheDocument();
    expect(screen.getByText('https://foo.com')).toBeInTheDocument();
    expect(screen.getByText('(by Alice)')).toBeInTheDocument();
    expect(screen.getByText('(by Bob)')).toBeInTheDocument();
  });

  it('shows empty state if no links', async () => {
    setupFetchMocks({ links: [] });
    render(<ModeratorDashboard sessionId={sessionId} user={mockUser} />);
    expect(await screen.findByText('No links published yet.')).toBeInTheDocument();
  });

  it('allows moderator to post a new link', async () => {
    setupFetchMocks({ links: [] });
    render(<ModeratorDashboard sessionId={sessionId} user={mockUser} />);
    // Wait for form to appear
    await screen.findByText('Links Published by Moderators');
    // Fill form
    fireEvent.change(screen.getByPlaceholderText(/Paste link URL/i), { target: { value: 'https://new.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Optional title/i), { target: { value: 'New Link' } });
    // Mock POST and refresh fetch
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true, link: { url: 'https://new.com', title: 'New Link', published_by: mockUser.name } }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([{ url: 'https://new.com', title: 'New Link', published_by: mockUser.name }]) });
    fireEvent.click(screen.getByRole('button', { name: /Post/i }));
    // Wait for new link to appear
    expect(await screen.findByText('New Link')).toBeInTheDocument();
    expect(screen.getByText('(by Test Mod)')).toBeInTheDocument();
  });

  it('shows error if posting link fails', async () => {
    setupFetchMocks({ links: [] });
    render(<ModeratorDashboard sessionId={sessionId} user={mockUser} />);
    await screen.findByText('Links Published by Moderators');
    fireEvent.change(screen.getByPlaceholderText(/Paste link URL/i), { target: { value: 'https://fail.com' } });
    global.fetch
      .mockResolvedValueOnce({ ok: false });
    fireEvent.click(screen.getByRole('button', { name: /Post/i }));
    expect(await screen.findByText('Failed to post link.')).toBeInTheDocument();
  });

  it('requires URL to post a link', async () => {
    setupFetchMocks({ links: [] });
    render(<ModeratorDashboard sessionId={sessionId} user={mockUser} />);
    await screen.findByText('Links Published by Moderators');
    const postButton = screen.getByRole('button', { name: /Post/i });
    // Button should be disabled when URL is empty
    expect(postButton).toBeDisabled();
    // Enter a URL, button should be enabled
    fireEvent.change(screen.getByPlaceholderText(/Paste link URL/i), { target: { value: 'https://foo.com' } });
    expect(postButton).toBeEnabled();
    // Clear the URL, button should be disabled again
    fireEvent.change(screen.getByPlaceholderText(/Paste link URL/i), { target: { value: '' } });
    expect(postButton).toBeDisabled();
  });
});
