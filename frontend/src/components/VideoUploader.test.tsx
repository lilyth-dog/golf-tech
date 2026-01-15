import { describe, it, expect, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { fireEvent, render, screen } from '@testing-library/react';
import VideoUploader from './VideoUploader';
import type { AnalysisResult } from '../api/analysis';

vi.mock('../api/analysis', async () => {
  // keep other exports and mock only functions
  const mod = await vi.importActual<typeof import('../api/analysis')>('../api/analysis');
  return {
    ...mod,
    uploadVideo: vi.fn(),
  };
});

import { uploadVideo } from '../api/analysis';

describe('VideoUploader', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal(
      'URL',
      ({
        createObjectURL: vi.fn(() => 'blob://preview'),
      } as unknown) as typeof URL
    );
  });

  it('shows error for non-video file', async () => {
    render(<VideoUploader />);

    const bad = new File(['x'], 'bad.txt', { type: 'text/plain' });
    // userEvent.upload respects <input accept="video/*"> and may ignore invalid files,
    // so we simulate a drag&drop instead.
    const dropZone = document.querySelector('.upload-zone') as HTMLElement;
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [bad] },
    });
    expect(await screen.findByText('동영상 파일만 업로드 가능합니다.')).toBeInTheDocument();
  });

  it('uploads video and calls onUploadComplete', async () => {
    const user = userEvent.setup();
    const onUploadComplete = vi.fn();
    const result = {
      id: 1,
      created_at: new Date().toISOString(),
      shoulder_angle: 90,
      hip_rotation: 45,
      knee_flexion: 25,
      spine_angle: 40,
      ai_feedback: 'ok',
    } satisfies AnalysisResult;

    vi.mocked(uploadVideo).mockResolvedValueOnce(result);

    render(<VideoUploader onUploadComplete={onUploadComplete} />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const good = new File(['x'], 'swing.mp4', { type: 'video/mp4' });
    await user.upload(fileInput, good);

    await user.click(screen.getByRole('button', { name: '영상 분석 시작' }));
    expect(onUploadComplete).toHaveBeenCalledWith(result);
  });

  it('shows error when upload fails', async () => {
    const user = userEvent.setup();
    vi.mocked(uploadVideo).mockRejectedValueOnce(new Error('fail'));

    render(<VideoUploader />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const good = new File(['x'], 'swing.mp4', { type: 'video/mp4' });
    await user.upload(fileInput, good);

    await user.click(screen.getByRole('button', { name: '영상 분석 시작' }));
    expect(await screen.findByText('업로드에 실패했습니다. 다시 시도해주세요.')).toBeInTheDocument();
  });

  it('accepts dropped video file', async () => {
    render(<VideoUploader />);
    const good = new File(['x'], 'swing.mp4', { type: 'video/mp4' });
    const dropZone = document.querySelector('.upload-zone') as HTMLElement;
    fireEvent.drop(dropZone, { dataTransfer: { files: [good] } });
    // preview video should appear
    expect(document.querySelector('video.preview-video')).toBeTruthy();
  });

  it('validates selected file type on change event', async () => {
    render(<VideoUploader />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const bad = new File(['x'], 'bad.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [bad] } });
    expect(await screen.findByText('동영상 파일만 업로드 가능합니다.')).toBeInTheDocument();
  });
});

