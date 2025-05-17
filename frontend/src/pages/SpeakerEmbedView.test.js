import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom'; // Import jest-dom for custom matchers
import SpeakerEmbedView from './SpeakerEmbedView';

// Mock fetch
beforeEach(() => {
  jest.useFakeTimers();
  global.fetch = jest.fn();
});
afterEach(() => {
  jest.clearAllTimers();
  jest.resetAllMocks();
});

describe('SpeakerEmbedView', () => {
  const approvedQuestions = [
    { id: 1, text: 'First approved question', status: 'approved', timestamp: '2024-01-01T00:00:00Z' },
    { id: 2, text: 'Second approved question', status: 'approved', timestamp: '2024-01-01T00:01:00Z' },
    { id: 3, text: 'Third approved question', status: 'approved', timestamp: '2024-01-01T00:02:00Z' },
  ];

  function setupFetch(data = approvedQuestions, ok = true) {
    fetch.mockImplementation(() =>
      Promise.resolve({
        ok,
        json: () => Promise.resolve(data),
      })
    );
  }

  it('renders loading state', async () => {
    setupFetch([]);
    render(<SpeakerEmbedView eventId="demo" />);
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    await act(async () => {
      await Promise.resolve();
    });
  });

  it('renders error state', async () => {
    fetch.mockImplementation(() => Promise.reject('fail'));
    render(<SpeakerEmbedView eventId="demo" />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByText(/Could not load questions/i)).toBeInTheDocument();
  });

  it('renders empty state if no questions', async () => {
    setupFetch([]);
    render(<SpeakerEmbedView eventId="demo" />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByText(/No approved questions yet/i)).toBeInTheDocument();
  });

  it('renders the first approved question and navigation controls', async () => {
    setupFetch();
    render(<SpeakerEmbedView eventId="demo" />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByText('First approved question')).toBeInTheDocument();
    expect(screen.getByText('Previous')).toBeDisabled();
    expect(screen.getByText('Next')).not.toBeDisabled();
    expect(screen.getByText('Dismiss')).toBeInTheDocument();
    expect(screen.getByText(/Question 1 of 3/)).toBeInTheDocument();
  });

  it('navigates to next and previous questions', async () => {
    setupFetch();
    render(<SpeakerEmbedView eventId="demo" />);
    await act(async () => {
      await Promise.resolve();
    });
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Second approved question')).toBeInTheDocument();
    expect(screen.getByText(/Question 2 of 3/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Previous'));
    expect(screen.getByText('First approved question')).toBeInTheDocument();
  });

  it('disables Previous on first and Next on last question', async () => {
    setupFetch();
    render(<SpeakerEmbedView eventId="demo" />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByText('Previous')).toBeDisabled();
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Next')).toBeDisabled();
  });

  it('dismisses the current question', async () => {
    setupFetch();
    render(<SpeakerEmbedView eventId="demo" />);
    await act(async () => {
      await Promise.resolve();
    });
    fireEvent.click(screen.getByText('Dismiss'));
    expect(screen.getByText('Second approved question')).toBeInTheDocument();
    expect(screen.getByText(/Question 1 of 2/)).toBeInTheDocument();
  });

  it('shows empty state if all questions are dismissed', async () => {
    setupFetch();
    render(<SpeakerEmbedView eventId="demo" />);
    await act(async () => {
      await Promise.resolve();
    });
    fireEvent.click(screen.getByText('Dismiss'));
    fireEvent.click(screen.getByText('Dismiss'));
    fireEvent.click(screen.getByText('Dismiss'));
    expect(screen.getByText(/No approved questions yet/i)).toBeInTheDocument();
  });

  it('auto-hides controls after 5 seconds', async () => {
    setupFetch();
    render(<SpeakerEmbedView eventId="demo" />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByText('Next')).toBeVisible();
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    // Controls should be hidden (not in the document)
    expect(screen.queryByText('Next')).not.toBeInTheDocument();
  });

  it('shows controls again on mousemove or keydown', async () => {
    setupFetch();
    render(<SpeakerEmbedView eventId="demo" />);
    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(screen.queryByText('Next')).not.toBeInTheDocument();
    act(() => {
      window.dispatchEvent(new Event('mousemove'));
    });
    expect(screen.getByText('Next')).toBeVisible();
  });

  it('auto-advances questions if autoAdvance param is set', async () => {
    setupFetch();
    // Simulate URL param
    const orig = window.location.search;
    delete window.location;
    window.location = { search: '?autoAdvance=true&interval=1' };
    render(<SpeakerEmbedView eventId="demo" />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByText('First approved question')).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText('Second approved question')).toBeInTheDocument();
    window.location = { search: orig };
  });
});
