import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SpeakerView from './SpeakerView';

describe('SpeakerView', () => {
  it('renders the first approved question in fullscreen', () => {
    render(<SpeakerView sessionId="demo" />);
    expect(screen.getByText('What is the future of AI in events?')).toBeInTheDocument();
    expect(screen.getByText(/Question 1 of 3/)).toBeInTheDocument();
  });

  it('navigates to next and previous questions', () => {
    render(<SpeakerView sessionId="demo" />);
    // Next
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('How do you handle privacy concerns?')).toBeInTheDocument();
    expect(screen.getByText(/Question 2 of 3/)).toBeInTheDocument();
    // Previous
    fireEvent.click(screen.getByText('Previous'));
    expect(screen.getByText('What is the future of AI in events?')).toBeInTheDocument();
  });

  it('disables Previous on first and Next on last question', () => {
    render(<SpeakerView sessionId="demo" />);
    expect(screen.getByText('Previous')).toBeDisabled();
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Next')).toBeDisabled();
  });

  it('dismisses the current question', () => {
    render(<SpeakerView sessionId="demo" />);
    fireEvent.click(screen.getByText('Dismiss'));
    // After dismiss, the next question should show
    expect(screen.getByText('How do you handle privacy concerns?')).toBeInTheDocument();
    expect(screen.getByText(/Question 1 of 2/)).toBeInTheDocument();
  });

  it('shows empty state if all questions are dismissed', () => {
    render(<SpeakerView sessionId="demo" />);
    fireEvent.click(screen.getByText('Dismiss'));
    fireEvent.click(screen.getByText('Dismiss'));
    fireEvent.click(screen.getByText('Dismiss'));
    expect(screen.getByText('No approved questions yet.')).toBeInTheDocument();
  });
});
