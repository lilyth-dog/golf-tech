import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./client', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

import client from './client';
import { createAnalysis, getAnalyses, uploadVideo } from './analysis';

describe('api/analysis', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('createAnalysis posts to /analysis/analyze/', async () => {
    vi.mocked(client.post).mockResolvedValueOnce({ data: { id: 1 } });
    const res = await createAnalysis({ shoulder_angle: 1, hip_rotation: 2, knee_flexion: 3, spine_angle: 4 });
    expect(client.post).toHaveBeenCalledWith('/analysis/analyze/', { shoulder_angle: 1, hip_rotation: 2, knee_flexion: 3, spine_angle: 4 });
    expect(res).toEqual({ id: 1 });
  });

  it('getAnalyses calls GET /analysis/results/', async () => {
    vi.mocked(client.get).mockResolvedValueOnce({ data: [{ id: 1 }] });
    const res = await getAnalyses();
    expect(client.get).toHaveBeenCalledWith('/analysis/results/');
    expect(res).toEqual([{ id: 1 }]);
  });

  it('uploadVideo posts multipart form data', async () => {
    vi.mocked(client.post).mockResolvedValueOnce({ data: { id: 2 } });
    const file = new File(['x'], 'swing.mp4', { type: 'video/mp4' });
    const res = await uploadVideo(file);
    expect(client.post).toHaveBeenCalled();
    const call = vi.mocked(client.post).mock.calls[0]!;
    expect(call[0]).toBe('/analysis/upload/');
    expect(call[2]).toMatchObject({ headers: { 'Content-Type': 'multipart/form-data' } });
    expect(res).toEqual({ id: 2 });
  });
});

