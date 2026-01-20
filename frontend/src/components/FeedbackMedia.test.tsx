import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FeedbackMedia from './FeedbackMedia';

describe('FeedbackMedia', () => {
  it('renders null when no inputs', () => {
    const { container } = render(<FeedbackMedia />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders advice, image and video', () => {
    render(<FeedbackMedia aiAdvice="hi" imageUrl="/img.png" videoUrl="/v.mp4" />);
    expect(screen.getByText('🏌️ AI 분석 결과')).toBeInTheDocument();
    expect(screen.getByText('hi')).toBeInTheDocument();
    expect(screen.getByText('피드백 이미지')).toBeInTheDocument();
    expect(screen.getByText('피드백 영상')).toBeInTheDocument();
  });
});

