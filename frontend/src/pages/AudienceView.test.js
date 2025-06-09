import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import AudienceView from './AudienceView';

describe('AudienceView', () => {
  beforeEach(() => {
    // Mock fetch before each test
    global.fetch = jest.fn();
  });

  it('shows loading state initially', () => {
    global.fetch.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => {
        resolve({
          ok: true,
          json: () => Promise.resolve({})
        });
      }, 100))
    );

    render(<AudienceView sessionId="test-session" />);
    expect(screen.getByText(/Loading event details/i)).toBeInTheDocument();
  });

  it('displays event title and QR code when loaded', async () => {
    const mockEvent = {
      title: 'Test Event',
      description: 'This is a test event'
    };

    global.fetch.mockImplementation((url) => {
      if (url.includes('/api/session/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockEvent)
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      });
    });

    render(<AudienceView sessionId="test-session" />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeInTheDocument();
      expect(screen.getByText('This is a test event')).toBeInTheDocument();
      expect(screen.getByAltText('Event QR Code')).toBeInTheDocument();
    });
  });

  it('displays approved questions when available', async () => {
    const mockEvent = {
      title: 'Test Event',
      description: 'This is a test event'
    };

    const mockQuestions = [
      { id: 1, text: 'What is the main topic?', approved: true },
      { id: 2, text: 'When is the next event?', approved: true }
    ];

    global.fetch.mockImplementation((url) => {
      if (url.includes('/api/session/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockEvent)
        });
      }
      if (url.includes('/api/audience/questions/synthesized/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockQuestions)
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      });
    });

    render(<AudienceView sessionId="test-session" />);
    
    await waitFor(() => {
      expect(screen.getByText('What is the main topic?')).toBeInTheDocument();
      expect(screen.getByText('When is the next event?')).toBeInTheDocument();
    });
  });

  it('shows error message when event load fails', async () => {
    global.fetch.mockImplementation((url) => {
      if (url.includes('/api/session/')) {
        return Promise.resolve({
          ok: false,
          statusText: 'Not Found'
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      });
    });

    render(<AudienceView sessionId="test-session" />);
    
    await waitFor(() => {
      expect(screen.getByText(/Could not load event details/i)).toBeInTheDocument();
    });
  });

  it('shows empty state when no approved questions', async () => {
    global.fetch.mockImplementation((url) => {
      if (url.includes('/api/session/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ title: 'Test Event' })
        });
      }
      if (url.includes('/api/audience/questions/synthesized/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      });
    });

    render(<AudienceView sessionId="test-session" />);
    
    await waitFor(() => {
      expect(screen.getByText(/No approved questions yet/i)).toBeInTheDocument();
      expect(screen.getByText(/Scan the QR code to submit your questions/i)).toBeInTheDocument();
    });
  });
});
