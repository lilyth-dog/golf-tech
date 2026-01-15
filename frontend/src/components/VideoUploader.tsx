import { useState, useRef } from 'react';
import { uploadVideo } from '../api/analysis';
import type { AnalysisResult } from '../api/analysis';
import './VideoUploader.css';

interface VideoUploaderProps {
    onUploadComplete?: (result: AnalysisResult) => void;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({ onUploadComplete }) => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (!selectedFile.type.startsWith('video/')) {
                setError('동영상 파일만 업로드 가능합니다.');
                return;
            }
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setProgress(10);
        try {
            setProgress(30);
            const result = await uploadVideo(file);
            setProgress(100);
            onUploadComplete?.(result);
            setFile(null);
            setPreview(null);
        } catch (err) {
            console.error(err);
            setError('업로드에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile?.type.startsWith('video/')) {
            setFile(droppedFile);
            setPreview(URL.createObjectURL(droppedFile));
            setError(null);
        } else {
            setError('동영상 파일만 업로드 가능합니다.');
        }
    };

    return (
        <div className="video-uploader">
            <div
                className="upload-zone"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
            >
                {preview ? (
                    <video src={preview} controls className="preview-video" />
                ) : (
                    <div className="upload-placeholder">
                        <span className="upload-icon">🎬</span>
                        <p>클릭하거나 드래그하여 스윙 영상을 업로드하세요</p>
                    </div>
                )}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    hidden
                />
            </div>
            {error && <p className="error-message">{error}</p>}
            {uploading && (
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
            )}
            <button
                className="upload-button"
                onClick={handleUpload}
                disabled={!file || uploading}
            >
                {uploading ? '분석 중...' : '영상 분석 시작'}
            </button>
        </div>
    );
};

export default VideoUploader;
