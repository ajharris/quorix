import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SpeakerView from './SpeakerView';

describe('SpeakerView', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          { id: 1, text: 'What is the future of AI in events?', status: 'approved' },
          { id: 2, text: 'How do you handle privacy concerns?', status: 'approved' },
          { id: 3, text: 'What are the next steps for Quorix?', status: 'approved' },
        ]),
      })
    );
  });
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the first approved question in fullscreen', async () => {
    render(<SpeakerView sessionId="demo" />);
    expect(await screen.findByText('What is the future of AI in events?')).toBeInTheDocument();
    expect(screen.getByText(/Question 1 of 3/)).toBeInTheDocument();
  });

  it('navigates to next and previous questions', async () => {
    render(<SpeakerView sessionId="demo" />);
    await screen.findByText('What is the future of AI in events?');
    // Next
    fireEvent.click(screen.getByText('Next'));
    expect(await screen.findByText('How do you handle privacy concerns?')).toBeInTheDocument();
    expect(screen.getByText(/Question 2 of 3/)).toBeInTheDocument();
    // Previous
    fireEvent.click(screen.getByText('Previous'));
    expect(await screen.findByText('What is the future of AI in events?')).toBeInTheDocument();
  });

  it('disables Previous on first and Next on last question', async () => {
    render(<SpeakerView sessionId="demo" />);
    await screen.findByText('What is the future of AI in events?');
    expect(screen.getByText('Previous')).toBeDisabled();
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Next')).toBeDisabled();
  });

  it('dismisses the current question', async () => {
    render(<SpeakerView sessionId="demo" />);
    await screen.findByText('What is the future of AI in events?');
    fireEvent.click(screen.getByText('Dismiss'));
    // After dismiss, the next question should show
    expect(await screen.findByText('How do you handle privacy concerns?')).toBeInTheDocument();
    expect(screen.getByText(/Question 1 of 2/)).toBeInTheDocument();
  });

  it('shows empty state if all questions are dismissed', async () => {
    render(<SpeakerView sessionId="demo" />);
    await screen.findByText('What is the future of AI in events?');
    fireEvent.click(screen.getByText('Dismiss'));
    fireEvent.click(screen.getByText('Dismiss'));
    fireEvent.click(screen.getByText('Dismiss'));
    expect(await screen.findByText('No approved questions yet.')).toBeInTheDocument();
  });
});
