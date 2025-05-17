import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import GeneratedQuestions from './GeneratedQuestions';

describe('GeneratedQuestions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading and then generated questions', async () => {
    const questions = [
      { text: 'Synth Q1' },
      { text: 'Synth Q2' },
      { text: 'Synth Q3' }
    ];
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(questions) }));
    render(<GeneratedQuestions sessionId="demo" />);
    for (const q of questions) {
      expect(await screen.findByText(q.text)).toBeInTheDocument();
    }
    expect(screen.getAllByTestId('generated-question').length).toBe(3);
  });

  it('shows empty state if no generated questions', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));
    render(<GeneratedQuestions sessionId="demo" />);
    expect(await screen.findByText(/no generated questions yet/i)).toBeInTheDocument();
  });

  it('shows error if fetch fails', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('fail')));
    render(<GeneratedQuestions sessionId="demo" />);
    expect(await screen.findByText(/failed to load generated questions/i)).toBeInTheDocument();
  });
});
