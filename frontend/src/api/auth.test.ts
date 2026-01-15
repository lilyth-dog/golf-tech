import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./client', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

import client from './client';
import { getProfile, login, register } from './auth';

describe('api/auth', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('login posts to /auth/login/', async () => {
    vi.mocked(client.post).mockResolvedValueOnce({ data: { token: 't' } });
    const res = await login({ username: 'u', password: 'p' });
    expect(client.post).toHaveBeenCalledWith('/auth/login/', { username: 'u', password: 'p' });
    expect(res.token).toBe('t');
  });

  it('register posts to /auth/register/', async () => {
    vi.mocked(client.post).mockResolvedValueOnce({ data: { token: 't2' } });
    const res = await register({ username: 'u', email: 'e@e.com', password: 'p' });
    expect(client.post).toHaveBeenCalledWith('/auth/register/', { username: 'u', email: 'e@e.com', password: 'p' });
    expect(res.token).toBe('t2');
  });

  it('getProfile calls GET /profile/', async () => {
    vi.mocked(client.get).mockResolvedValueOnce({ data: { id: 1 } });
    const res = await getProfile();
    expect(client.get).toHaveBeenCalledWith('/profile/');
    expect(res).toEqual({ id: 1 });
  });
});

