import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdView from './AdView';

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: jest.fn(),
  };
});

describe('AdView', () => {
  beforeEach(() => {
    // Clear previous mocks
    require('react-router-dom').useNavigate.mockClear();
  });

  it('renders welcome message and button', () => {
    render(
      <MemoryRouter>
        <AdView />
      </MemoryRouter>
    );
    expect(screen.getByText(/Welcome to Quorix Live Q&A/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Go to Event/i })).toBeInTheDocument();
    expect(screen.getByText(/You will be asked to log in/i)).toBeInTheDocument();
  });

  it('navigates to attendee view on button click', () => {
    const mockNavigate = jest.fn();
    require('react-router-dom').useNavigate.mockImplementation(() => mockNavigate);
    render(
      <MemoryRouter>
        <AdView />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /Go to Event/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/session/demo');
  });

  it('renders the QR code and scan prompt', () => {
    render(
      <MemoryRouter>
        <AdView />
      </MemoryRouter>
    );
    expect(screen.getByText(/Scan to join the event/i)).toBeInTheDocument();
    // QRCodeImage is rendered, but we can't check the image src directly without mocking
  });

  it('renders thought-provoking questions and topics', () => {
    render(
      <MemoryRouter>
        <AdView />
      </MemoryRouter>
    );
    expect(screen.getByText(/Thought-Provoking Questions/i)).toBeInTheDocument();
    expect(screen.getByText(/How will AI change the way we learn and teach/i)).toBeInTheDocument();
    expect(screen.getByText(/What are the biggest challenges of remote collaboration/i)).toBeInTheDocument();
    expect(screen.getByText(/Where should we draw the line with technology and privacy/i)).toBeInTheDocument();
    expect(screen.getByText(/Topics: AI in Education, Future of Remote Work, Ethics in Technology/i)).toBeInTheDocument();
  });
});
