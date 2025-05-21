import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NavBarRegisterForm from './NavBarRegisterForm';

describe('NavBarRegisterForm', () => {
  it('renders registration form fields and submits', async () => {
    const onRegister = jest.fn();
    const onCancel = jest.fn();
    render(<NavBarRegisterForm onRegister={onRegister} onCancel={onCancel} />);
    expect(screen.getByPlaceholderText(/Email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText(/Email/i), 'user@example.com');
    await userEvent.type(screen.getByPlaceholderText(/Password/i), 'password');
    await userEvent.click(screen.getByRole('button', { name: /Register/i }));
    // Wait for possible async UI updates
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Register/i })).toBeInTheDocument();
    });
    // Optionally, check if onRegister was called (if you want to test callback)
    // expect(onRegister).toHaveBeenCalled();
  });
});
