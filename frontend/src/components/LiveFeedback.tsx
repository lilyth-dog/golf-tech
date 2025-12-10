import { useEffect, useState, useRef } from 'react';
import './LiveFeedback.css';

interface LiveMetrics {
    x_factor?: number;
    angular_momentum?: number;
    physics_score?: number;
    timestamp?: number;
}

interface LiveFeedbackProps {
    analysisId?: number;
    onComplete?: (data: { feedback_image_url?: string; feedback_video_url?: string }) => void;
}

const LiveFeedback: React.FC<LiveFeedbackProps> = ({ analysisId, onComplete }) => {
    const [metrics, setMetrics] = useState<LiveMetrics>({});
    const [connected, setConnected] = useState(false);
    const [status, setStatus] = useState<'idle' | 'processing' | 'complete'>('idle');
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!analysisId) return;

        const wsUrl = `ws://localhost:8000/ws/analysis/`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            setConnected(true);
            setStatus('processing');
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.analysis_id === analysisId) {
                    if (data.feedback_image_url || data.feedback_video_url) {
                        setStatus('complete');
                        onComplete?.(data);
                    } else if (data.x_factor !== undefined) {
                        setMetrics(data);
                    }
                }
            } catch (err) {
                console.error('WebSocket parse error:', err);
            }
        };

        ws.onclose = () => {
            setConnected(false);
        };

        ws.onerror = () => {
            setConnected(false);
        };

        return () => {
            ws.close();
        };
    }, [analysisId, onComplete]);

    return (
        <div className="live-feedback">
            <div className="connection-status">
                <span className={`status-dot ${connected ? 'connected' : ''}`} />
                {connected ? '실시간 연결됨' : '연결 대기 중...'}
            </div>

            {status === 'processing' && (
                <div className="metrics-grid">
                    <div className="metric-card">
                        <span className="metric-label">X-Factor</span>
                        <span className="metric-value">
                            {metrics.x_factor?.toFixed(1) ?? '--'}°
                        </span>
                    </div>
                    <div className="metric-card">
                        <span className="metric-label">각운동량</span>
                        <span className="metric-value">
                            {metrics.angular_momentum?.toFixed(2) ?? '--'}
                        </span>
                    </div>
                    <div className="metric-card">
                        <span className="metric-label">임팩트 효율</span>
                        <span className="metric-value">
                            {metrics.physics_score?.toFixed(0) ?? '--'}%
                        </span>
                    </div>
                </div>
            )}

            {status === 'complete' && (
                <div className="complete-message">
                    <span className="complete-icon">✅</span>
                    <p>분석이 완료되었습니다!</p>
                </div>
            )}

            {status === 'idle' && (
                <p className="idle-message">영상을 업로드하면 실시간 분석이 시작됩니다.</p>
            )}
        </div>
    );
};

export default LiveFeedback;
