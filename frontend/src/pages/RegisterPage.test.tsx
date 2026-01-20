import { describe, it, expect, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RegisterPage from './RegisterPage';
import type { AuthResponse } from '../types/auth';

vi.mock('../api/auth', () => ({
  register: vi.fn(),
}));

import { register } from '../api/auth';

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows error on failed register', async () => {
    vi.mocked(register).mockRejectedValueOnce(new Error('bad'));
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('Choose a username'), 'u1');
    await user.type(screen.getByPlaceholderText('Enter your email'), 'u1@example.com');
    await user.type(screen.getByPlaceholderText('Create a password'), 'pw');
    await user.click(screen.getByRole('button', { name: 'Sign Up' }));

    expect(await screen.findByText('Registration failed. Username might be taken.')).toBeInTheDocument();
  });

  it('calls register and navigates to login on success', async () => {
    const resp: AuthResponse = { token: 't', user_id: 1, username: 'u1' };
    vi.mocked(register).mockResolvedValueOnce(resp);
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('Choose a username'), 'u1');
    await user.type(screen.getByPlaceholderText('Enter your email'), 'u1@example.com');
    await user.type(screen.getByPlaceholderText('Create a password'), 'pw');
    await user.click(screen.getByRole('button', { name: 'Sign Up' }));

    expect(register).toHaveBeenCalled();
  });

  it('toggles password visibility', async () => {
    vi.mocked(register).mockRejectedValueOnce(new Error('noop'));
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );
    const pw = screen.getByPlaceholderText('Create a password') as HTMLInputElement;
    expect(pw.type).toBe('password');
    await user.click(screen.getByLabelText('Toggle password visibility'));
    expect(pw.type).toBe('text');
  });
});

