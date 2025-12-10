import { useState, useCallback } from 'react';
import VideoUploader from '../components/VideoUploader';
import LiveFeedback from '../components/LiveFeedback';
import FeedbackMedia from '../components/FeedbackMedia';
import type { AnalysisResult } from '../api/analysis';
import './SwingAnalysis.css';

export default function SwingAnalysis() {
    const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
    const [feedbackUrls, setFeedbackUrls] = useState<{ image?: string; video?: string }>({});

    const handleUploadComplete = useCallback((result: AnalysisResult) => {
        setCurrentAnalysis(result);
        setFeedbackUrls({});
    }, []);

    const handleAnalysisComplete = useCallback((data: { feedback_image_url?: string; feedback_video_url?: string }) => {
        setFeedbackUrls({
            image: data.feedback_image_url,
            video: data.feedback_video_url,
        });
    }, []);

    return (
        <div className="swing-analysis-page">
            <header className="page-header">
                <h1>🏌️ 스윙 영상 분석</h1>
                <p>영상을 업로드하면 AI가 스윙을 분석하고 맞춤형 피드백을 제공합니다.</p>
            </header>

            <div className="analysis-grid">
                <section className="upload-section">
                    <h2>📹 영상 업로드</h2>
                    <VideoUploader onUploadComplete={handleUploadComplete} />
                </section>

                <section className="live-section">
                    <h2>📊 실시간 분석</h2>
                    <LiveFeedback
                        analysisId={currentAnalysis?.id}
                        onComplete={handleAnalysisComplete}
                    />
                </section>

                <section className="feedback-section">
                    <FeedbackMedia
                        imageUrl={feedbackUrls.image}
                        videoUrl={feedbackUrls.video}
                        aiAdvice={currentAnalysis?.ai_feedback}
                    />
                </section>
            </div>
        </div>
    );
}
