import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EventLandingPage from './EventLandingPage';

// Mock useParams to provide eventCode
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ eventCode: 'test-session-1' }),
}));

describe('Question Submission Form', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  it('renders form for authenticated user', async () => {
    fetch.mockResponseOnce(JSON.stringify({
      title: 'Test Event',
      start_time: new Date().toISOString(),
      description: 'Test desc.'
    }));
    render(<EventLandingPage />);
    expect(await screen.findByText('Test Event')).toBeInTheDocument();
    expect(screen.getByLabelText(/ask a question/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeEnabled();
  });

  it('enables submit when textarea is not empty', async () => {
    fetch.mockResponseOnce(JSON.stringify({
      title: 'Test Event',
      start_time: new Date().toISOString(),
      description: 'Test desc.'
    }));
    render(<EventLandingPage />);
    await screen.findByText('Test Event');
    const textarea = screen.getByLabelText(/ask a question/i);
    fireEvent.change(textarea, { target: { value: 'What is the agenda?' } });
    expect(screen.getByRole('button', { name: /submit/i })).toBeEnabled();
  });

  it('shows error if submitted empty', async () => {
    fetch.mockResponseOnce(JSON.stringify({
      title: 'Test Event',
      start_time: new Date().toISOString(),
      description: 'Test desc.'
    }));
    render(<EventLandingPage />);
    await screen.findByText('Test Event');
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(await screen.findByText(/cannot be empty/i)).toBeInTheDocument();
  });

  it('submits question and shows confirmation', async () => {
    fetch.mockResponses(
      [JSON.stringify({ title: 'Test Event', start_time: new Date().toISOString(), description: 'Test desc.' }), { status: 200 }],
      [JSON.stringify({ success: true }), { status: 200 }]
    );
    render(<EventLandingPage />);
    await screen.findByText('Test Event');
    const textarea = screen.getByLabelText(/ask a question/i);
    fireEvent.change(textarea, { target: { value: 'What is the agenda?' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(await screen.findByText(/question submitted/i)).toBeInTheDocument();
    expect(textarea.value).toBe('');
  });

  it('shows error on backend 400', async () => {
    fetch.mockResponses(
      [JSON.stringify({ title: 'Test Event', start_time: new Date().toISOString(), description: 'Test desc.' }), { status: 200 }],
      [JSON.stringify({ error: 'Missing fields' }), { status: 400 }]
    );
    render(<EventLandingPage />);
    await screen.findByText('Test Event');
    const textarea = screen.getByLabelText(/ask a question/i);
    fireEvent.change(textarea, { target: { value: 'Bad input' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(await screen.findByText(/missing fields/i)).toBeInTheDocument();
  });

  it('shows error on network failure', async () => {
    fetch.mockResponses(
      [JSON.stringify({ title: 'Test Event', start_time: new Date().toISOString(), description: 'Test desc.' }), { status: 200 }],
      () => Promise.reject(new Error('Network error'))
    );
    render(<EventLandingPage />);
    await screen.findByText('Test Event');
    const textarea = screen.getByLabelText(/ask a question/i);
    fireEvent.change(textarea, { target: { value: 'Will there be food?' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(await screen.findByText(/network error/i)).toBeInTheDocument();
  });
});
