import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

globalThis.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ message: 'Pong!' }),
  })
);

beforeEach(() => {
  global.fetch.mockClear();
  global.fetch.mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ message: 'Pong!' }),
    })
  );
});

afterAll(() => {
  global.fetch.mockRestore?.();
});

test('renders backend message', async () => {
  render(<App />);
  const messageElement = await screen.findByText(/Pong!/i);
  expect(messageElement).toBeInTheDocument();
});
