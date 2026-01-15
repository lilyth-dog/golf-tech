import { describe, it, expect, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProfilePage from './ProfilePage';
import type { UserProfile } from '../types/auth';

vi.mock('../api/profile', () => ({
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
}));

import { getProfile, updateProfile } from '../api/profile';

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('loads profile and saves updates', async () => {
    const user = userEvent.setup();

    const initial: UserProfile = {
      id: 1,
      user: 1,
      nickname: 'E2E',
      height: 180,
      weight: 75,
      handicap: 18,
      years_experience: 3,
    };

    vi.mocked(getProfile).mockResolvedValueOnce(initial);
    vi.mocked(updateProfile).mockImplementation(async (p) => ({ ...initial, ...p } as UserProfile));

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    );

    // Loaded
    expect(await screen.findByText('My Profile')).toBeInTheDocument();
    const nick = screen.getByPlaceholderText('Enter nickname');
    await user.clear(nick);
    await user.type(nick, 'NEW');

    await user.click(screen.getByRole('button', { name: /Save Profile/i }));
    expect(await screen.findByText('Profile updated successfully!')).toBeInTheDocument();
  });

  it('shows error message when save fails', async () => {
    const user = userEvent.setup();
    vi.mocked(getProfile).mockResolvedValueOnce({
      id: 1,
      user: 1,
      nickname: 'E2E',
      height: 180,
      weight: 75,
      handicap: 18,
      years_experience: 3,
    } as UserProfile);
    vi.mocked(updateProfile).mockRejectedValueOnce(new Error('fail'));

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    );

    expect(await screen.findByText('My Profile')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Save Profile/i }));
    expect(await screen.findByText('Failed to update profile.')).toBeInTheDocument();
  });

  it('logout clears token', async () => {
    localStorage.setItem('token', 't');
    vi.mocked(getProfile).mockResolvedValueOnce({
      id: 1,
      user: 1,
      nickname: 'E2E',
      height: 180,
      weight: 75,
      handicap: 18,
      years_experience: 3,
    } as UserProfile);

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    );
    expect(await screen.findByText('My Profile')).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Logout/i }));
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('renders even if loading profile fails', async () => {
    vi.mocked(getProfile).mockRejectedValueOnce(new Error('nope'));
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    );
    expect(await screen.findByText('My Profile')).toBeInTheDocument();
  });
});

