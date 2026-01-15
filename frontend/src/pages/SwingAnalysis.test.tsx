import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import SwingAnalysis from './SwingAnalysis';
import type { AnalysisResult } from '../api/analysis';

vi.mock('../components/VideoUploader', () => ({
  default: ({ onUploadComplete }: { onUploadComplete: (r: AnalysisResult) => void }) => (
    <button
      type="button"
      onClick={() =>
        onUploadComplete({
          id: 1,
          created_at: new Date().toISOString(),
          shoulder_angle: 90,
          hip_rotation: 45,
          knee_flexion: 25,
          spine_angle: 40,
          ai_feedback: 'AI OK',
        })
      }
    >
      UPLOAD
    </button>
  ),
}));

vi.mock('../components/LiveFeedback', () => ({
  default: ({ onComplete }: { onComplete: (d: { feedback_image_url?: string; feedback_video_url?: string }) => void }) => (
    <button type="button" onClick={() => onComplete({ feedback_image_url: '/img.png' })}>
      COMPLETE
    </button>
  ),
}));

describe('SwingAnalysis', () => {
  it('wires upload result and feedback media', async () => {
    render(<SwingAnalysis />);
    const user = userEvent.setup();

    expect(screen.getByText('🏌️ 스윙 영상 분석')).toBeInTheDocument();
    // FeedbackMedia should be null initially
    expect(screen.queryByText('🏌️ AI 분석 결과')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'UPLOAD' }));
    expect(await screen.findByText('🏌️ AI 분석 결과')).toBeInTheDocument();
    expect(screen.getByText('AI OK')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'COMPLETE' }));
    expect(await screen.findByText('피드백 이미지')).toBeInTheDocument();
  });
});

