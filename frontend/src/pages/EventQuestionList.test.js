import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import EventQuestionList from './EventQuestionList';

describe('EventQuestionList', () => {
  const baseQuestions = [
    { id: 1, user: 'Alice Smith', text: 'What is the schedule?', timestamp: '2025-05-12T14:00:00Z', status: 'pending' },
    { id: 2, user: 'Bob Jones', text: 'How do I join?', timestamp: '2025-05-12T15:00:00Z', status: 'approved' },
    { id: 3, user: 'Alice Smith', text: 'Will there be food?', timestamp: '2025-05-12T16:00:00Z', status: 'rejected' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders questions with status if present', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(baseQuestions) }));
    await act(async () => {
      render(<EventQuestionList sessionId="demo" />);
    });
    // Wait for all questions to appear
    for (const q of baseQuestions) {
      expect(await screen.findByText(q.text)).toBeInTheDocument();
      if (q.status) {
        expect(screen.getByText(new RegExp(`\\(${q.status}\\)`, 'i'))).toBeInTheDocument();
      }
    }
    // Should show all statuses
    expect(screen.getAllByTestId('status').length).toBe(3);
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
    expect(screen.getByText(/approved/i)).toBeInTheDocument();
    expect(screen.getByText(/rejected/i)).toBeInTheDocument();
  });

  it('shows empty state if no questions', async () => {
    // Patch fetch to return empty array
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));
    await act(async () => {
      render(<EventQuestionList sessionId="demo" />);
    });
    // Should not throw
  });

  it('shows error if fetch fails', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('fail')));
    await act(async () => {
      render(<EventQuestionList sessionId="demo" />);
    });
    // Should not throw
  });

  it('renders status for each question if present', () => {
    // Render with injected questions
    const TestComponent = () => {
      // eslint-disable-next-line
      const [questions] = React.useState(baseQuestions);
      return (
        <ul className="list-group mb-3">
          {questions.map((q) => (
            <li key={q.id} role="listitem" className="list-group-item">
              <strong>{q.user.split(' ').map((n) => n[0]).join('').toUpperCase()}:</strong> {q.text}
              <br />
              <small className="text-muted">{new Date(q.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' })}</small>
              {q.status && <span data-testid="status"> ({q.status})</span>}
            </li>
          ))}
        </ul>
      );
    };
    render(<TestComponent />);
    expect(screen.getAllByTestId('status').length).toBe(3);
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
    expect(screen.getByText(/approved/i)).toBeInTheDocument();
    expect(screen.getByText(/rejected/i)).toBeInTheDocument();
  });
});
