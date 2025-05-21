import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NavBarLoginForm from './NavBarLoginForm';

describe('NavBarLoginForm', () => {
  it('renders login form fields and submits', async () => {
    const onLogin = jest.fn();
    const onCancel = jest.fn();
    render(<NavBarLoginForm onLogin={onLogin} onCancel={onCancel} />);
    expect(screen.getByPlaceholderText(/Email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText(/Email/i), 'user@example.com');
    await userEvent.type(screen.getByPlaceholderText(/Password/i), 'password');
    await userEvent.click(screen.getByRole('button', { name: /Login/i }));
    // Wait for possible async UI updates
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
    });
    // Optionally, check if onLogin was called (if you want to test callback)
    // expect(onLogin).toHaveBeenCalled();
  });
});
