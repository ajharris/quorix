import { render, screen } from '@testing-library/react';
import App from './App';

beforeAll(() => {
  global.fetch = jest.fn(() => {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ message: 'Pong!' }),
    });
  });
});

test('renders backend message', async () => {
  render(<App />);
  const messageElement = await screen.findByText(/Pong!/i);
  expect(messageElement).toBeInTheDocument();
});
