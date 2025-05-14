import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EventLandingPage from './EventLandingPage';
import { act } from 'react';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ eventCode: 'test-session-1' }),
}));

beforeEach(() => {
  global.fetch = jest.fn();

  // Shim interval functions in case they're missing (e.g., in Node)
  if (typeof global.setInterval !== 'function') {
    global.setInterval = () => 0;
  }
  if (typeof global.clearInterval !== 'function') {
    global.clearInterval = () => {};
  }

  if (fetch.resetMocks) fetch.resetMocks();
  if (jest.isMockFunction(global.fetch)) global.fetch.mockClear();
});


afterEach(() => {
  jest.useRealTimers();
});

describe('EventLandingPage', () => {
  function mockInitialFetches(questions = []) {
    global.fetch = jest.fn((url, options) => {
      if (url === '/api/events') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            {
              session_id: 'test-session-1',
              title: 'Test Event',
              start_time: '2025-05-12T14:00:00Z',
              description: 'Test desc.'
            }
          ])
        });
      }
      if (url.startsWith('/api/session/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            title: 'Test Event',
            start_time: '2025-05-12T14:00:00Z',
            description: 'Test desc.'
          })
        });
      }
      if (url.startsWith('/api/questions/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(questions)
        });
      }
      if (url === '/questions' && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({})
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  }

  // Helper to select the event before making assertions
  async function selectEvent() {
    // Wait for the event list to load
    const eventListItems = await screen.findAllByText('Test Event');
    // Click the event in the event list (not the card title)
    fireEvent.click(eventListItems.find(el => el.tagName === 'SPAN'));
    // Wait for event details to render
    await screen.findByRole('heading', { name: 'Test Event' });
  }

  it('renders form for authenticated user', async () => {
    mockInitialFetches();
    render(<EventLandingPage />);
    await selectEvent();
    expect(screen.getByLabelText(/ask a question/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeEnabled();
  });

  it('enables submit when textarea is not empty', async () => {
    mockInitialFetches();
    render(<EventLandingPage />);
    await selectEvent();
    fireEvent.change(screen.getByLabelText(/ask a question/i), { target: { value: 'What is the agenda?' } });
    expect(screen.getByRole('button', { name: /submit/i })).toBeEnabled();
  });

  it('shows error if submitted empty', async () => {
    mockInitialFetches();
    render(<EventLandingPage />);
    await selectEvent();
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(await screen.findByText(/cannot be empty/i)).toBeInTheDocument();
  });

  it('submits question and shows confirmation', async () => {
    mockInitialFetches();
    render(<EventLandingPage />);
    await selectEvent();
    const textarea = screen.getByLabelText(/ask a question/i);
    fireEvent.change(textarea, { target: { value: 'What is the agenda?' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(await screen.findByText(/question submitted/i)).toBeInTheDocument();
    expect(textarea.value).toBe('');
  });

  it('shows error on backend 400', async () => {
    global.fetch = jest.fn((url, options) => {
      if (url === '/api/events') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            {
              session_id: 'test-session-1',
              title: 'Test Event',
              start_time: '2025-05-12T14:00:00Z',
              description: 'Test desc.'
            }
          ])
        });
      }
      if (url.startsWith('/api/session/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            title: 'Test Event',
            start_time: '2025-05-12T14:00:00Z',
            description: 'Test desc.'
          })
        });
      }
      if (url.startsWith('/api/questions/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      }
      if (url === '/questions' && options?.method === 'POST') {
        return Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ error: 'Missing fields' })
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
    render(<EventLandingPage />);
    await selectEvent();
    fireEvent.change(screen.getByLabelText(/ask a question/i), { target: { value: 'Bad input' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(await screen.findByText(/missing fields/i)).toBeInTheDocument();
  });

  it('shows error on network failure', async () => {
    global.fetch = jest.fn((url, options) => {
      if (url === '/api/events') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            {
              session_id: 'test-session-1',
              title: 'Test Event',
              start_time: '2025-05-12T14:00:00Z',
              description: 'Test desc.'
            }
          ])
        });
      }
      if (url.startsWith('/api/session/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            title: 'Test Event',
            start_time: '2025-05-12T14:00:00Z',
            description: 'Test desc.'
          })
        });
      }
      if (url.startsWith('/api/questions/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      }
      if (url === '/questions' && options?.method === 'POST') {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
    render(<EventLandingPage />);
    await selectEvent();
    fireEvent.change(screen.getByLabelText(/ask a question/i), { target: { value: 'Will there be food?' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(await screen.findByText(/network error/i)).toBeInTheDocument();
  });

  it('fetches and displays synthesized questions', async () => {
    mockInitialFetches([
      { id: 1, text: 'What is the agenda?', user: 'John Doe', timestamp: '2025-05-12T14:00:00Z' },
      { id: 2, text: 'Will there be food?', user: 'Jane Smith', timestamp: '2025-05-12T15:00:00Z' },
    ]);
    render(<EventLandingPage />);
    await selectEvent();
    expect(await screen.findByText('What is the agenda?')).toBeInTheDocument();
    expect(await screen.findByText('Will there be food?')).toBeInTheDocument();
    expect(screen.getByText('2:00 PM')).toBeInTheDocument();
    expect(screen.getByText('3:00 PM')).toBeInTheDocument();
  });

  it('updates in real time', async () => {
    jest.useFakeTimers();

    let questions = [
      { id: 1, text: 'What is the agenda?', user: 'John Doe', timestamp: '2025-05-12T14:00:00Z' }
    ];

    global.fetch = jest.fn((url) => {
      if (url === '/api/events') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            {
              session_id: 'test-session-1',
              title: 'Test Event',
              start_time: '2025-05-12T14:00:00Z',
              description: 'desc'
            }
          ])
        });
      }
      if (url.startsWith('/api/session/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            title: 'Test Event',
            start_time: '2025-05-12T14:00:00Z',
            description: 'desc'
          })
        });
      }
      if (url.startsWith('/api/questions/')) {
        // Return a new array reference each time to trigger React state update
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([...questions])
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    render(<EventLandingPage />);
    await selectEvent();
    expect(await screen.findByText('What is the agenda?')).toBeInTheDocument();

    questions.push({
      id: 2,
      text: 'Will there be food?',
      user: 'Jane Smith',
      timestamp: '2025-05-12T15:00:00Z'
    });

    await act(async () => {
      jest.advanceTimersByTime(5000);
      // Wait for the next tick to allow the component to re-render
      await Promise.resolve();
    });

    expect(await screen.findByText('Will there be food?')).toBeInTheDocument();
  });

  it('cleans up polling or WebSocket on unmount', async () => {
    jest.useFakeTimers();
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    mockInitialFetches();
    const { unmount } = render(<EventLandingPage />);
    await selectEvent();

    jest.runOnlyPendingTimers();
    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });

  it('displays loading state', async () => {
    global.fetch = jest.fn((url) => {
      if (url === '/api/events') {
        return new Promise(() => {}); // never resolves
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
    render(<EventLandingPage />);
    expect(screen.getByText(/loading event/i)).toBeInTheDocument();
  });

  it('handles API error', async () => {
    global.fetch = jest.fn((url) => {
      if (url === '/api/events') {
        return Promise.reject(new Error('Internal Server Error'));
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
    render(<EventLandingPage />);
    expect(await screen.findByText(/could not load events/i)).toBeInTheDocument();
  });

  it('displays user initials', async () => {
    mockInitialFetches([
      { id: 1, user: 'John Doe', text: 'What is the agenda?', timestamp: '2025-05-12T14:00:00Z' }
    ]);
    render(<EventLandingPage />);
    await selectEvent();
    expect(await screen.findByText('JD:')).toBeInTheDocument();
  });

  it('formats timestamp correctly', async () => {
    mockInitialFetches([
      { id: 1, text: 'What is the agenda?', timestamp: '2025-05-12T14:00:00Z' }
    ]);
    render(<EventLandingPage />);
    await selectEvent();
    expect(await screen.findByText('2:00 PM')).toBeInTheDocument();
  });

  it('displays questions in correct order', async () => {
    mockInitialFetches([
      { id: 2, text: 'Will there be food?', user: 'Jane Smith', timestamp: '2025-05-12T15:00:00Z' },
      { id: 1, text: 'What is the agenda?', user: 'John Doe', timestamp: '2025-05-12T14:00:00Z' }
    ]);
    render(<EventLandingPage />);
    await selectEvent();
    // Wait for a question to appear
    await screen.findByText('Will there be food?');
    // Get all question list items by finding the question list container
    const questionLists = document.querySelectorAll('ul.list-group.mb-3');
    // The last .list-group.mb-3 is the question list (the first is the event list)
    const questionList = questionLists[questionLists.length - 1];
    const questions = Array.from(questionList.querySelectorAll('li'));
    expect(questions.length).toBeGreaterThanOrEqual(2);
    expect(questions[0]).toHaveTextContent('Will there be food?');
    expect(questions[1]).toHaveTextContent('What is the agenda?');
  });
});
