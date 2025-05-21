import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SpeakerDashboard from './SpeakerDashboard';

describe('SpeakerDashboard', () => {
  it('renders the abstract form', () => {
    render(<SpeakerDashboard user={{ name: 'Speaker' }} onLogin={jest.fn()} onLogout={jest.fn()} />);
    expect(screen.getByText(/Speaker Dashboard/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Talk Abstract/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Upload Abstract/i })).toBeInTheDocument();
  });

  it('allows entering and uploading an abstract', () => {
    render(<SpeakerDashboard user={{ name: 'Speaker' }} onLogin={jest.fn()} onLogout={jest.fn()} />);
    const textarea = screen.getByLabelText(/Talk Abstract/i);
    fireEvent.change(textarea, { target: { value: 'My talk abstract.' } });
    expect(textarea.value).toBe('My talk abstract.');
    fireEvent.click(screen.getByRole('button', { name: /Upload Abstract/i }));
    expect(screen.getByText(/Uploading.../i)).toBeInTheDocument();
  });
});
