import { describe, it, expect, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from './LoginPage';
import type { AuthResponse } from '../types/auth';

vi.mock('../api/auth', () => ({
  login: vi.fn(),
}));

import { login } from '../api/auth';

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
  });

  it('shows error on failed login', async () => {
    vi.mocked(login).mockRejectedValueOnce(new Error('bad'));
    const user = userEvent.setup();

    // Render with router because component uses useNavigate and Link
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('Enter your username'), 'u1');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'pw');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
  });

  it('stores token on successful login', async () => {
    const resp: AuthResponse = { token: 'abc', user_id: 1, username: 'u1' };
    vi.mocked(login).mockResolvedValueOnce(resp);
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('Enter your username'), 'u1');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'pw');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('abc');
    });
  });

  it('toggles password visibility', async () => {
    vi.mocked(login).mockRejectedValueOnce(new Error('noop'));
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const pw = screen.getByPlaceholderText('Enter your password') as HTMLInputElement;
    expect(pw.type).toBe('password');
    await user.click(screen.getByLabelText('Toggle password visibility'));
    expect(pw.type).toBe('text');
  });
});

