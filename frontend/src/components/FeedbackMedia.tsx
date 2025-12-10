import type { FC } from 'react';
import './FeedbackMedia.css';

interface FeedbackMediaProps {
    imageUrl?: string;
    videoUrl?: string;
    aiAdvice?: string;
}

const FeedbackMedia: FC<FeedbackMediaProps> = ({ imageUrl, videoUrl, aiAdvice }) => {
    if (!imageUrl && !videoUrl && !aiAdvice) {
        return null;
    }

    return (
        <div className="feedback-media">
            <h3 className="feedback-title">🏌️ AI 분석 결과</h3>

            {aiAdvice && (
                <div className="ai-advice-card">
                    <span className="advice-icon">💡</span>
                    <p className="advice-text">{aiAdvice}</p>
                </div>
            )}

            <div className="media-grid">
                {imageUrl && (
                    <div className="media-card">
                        <h4>피드백 이미지</h4>
                        <img src={imageUrl} alt="Swing feedback" className="feedback-image" />
                        <a href={imageUrl} download className="download-button">
                            📥 다운로드
                        </a>
                    </div>
                )}

                {videoUrl && (
                    <div className="media-card">
                        <h4>피드백 영상</h4>
                        <video src={videoUrl} controls className="feedback-video" />
                        <a href={videoUrl} download className="download-button">
                            📥 다운로드
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FeedbackMedia;
