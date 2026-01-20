import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./client', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

import client from './client';
import { getProfile, updateProfile } from './profile';

describe('api/profile', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('getProfile calls GET /profile/', async () => {
    vi.mocked(client.get).mockResolvedValueOnce({ data: { id: 1 } });
    const res = await getProfile();
    expect(client.get).toHaveBeenCalledWith('/profile/');
    expect(res).toEqual({ id: 1 });
  });

  it('updateProfile calls PATCH /profile/', async () => {
    vi.mocked(client.patch).mockResolvedValueOnce({ data: { nickname: 'n' } });
    const res = await updateProfile({ nickname: 'n' });
    expect(client.patch).toHaveBeenCalledWith('/profile/', { nickname: 'n' });
    expect(res).toEqual({ nickname: 'n' });
  });
});

