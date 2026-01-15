import client from './client';

export interface AnalysisResult {
    id: number;
    video_url?: string;
    created_at: string;
    shoulder_angle: number;
    hip_rotation: number;
    knee_flexion: number;
    spine_angle: number;
    ai_feedback: string;
    x_factor?: number;
    angular_momentum?: number;
    physics_score?: number;
    feedback_image?: string;
    feedback_video?: string;
}

export interface AnalysisFrame {
    timestamp_ms: number;
    shoulder_angle: number;
    hip_rotation: number;
    knee_flexion?: number;
    spine_angle?: number;
}

export interface AnalysisCreateRequest {
    shoulder_angle: number;
    hip_rotation: number;
    knee_flexion: number;
    spine_angle: number;
    frames?: AnalysisFrame[];
}

export const createAnalysis = async (payload: AnalysisCreateRequest): Promise<AnalysisResult> => {
    const response = await client.post<AnalysisResult>('/analysis/analyze/', payload);
    return response.data;
};

export const getAnalyses = async (): Promise<AnalysisResult[]> => {
    const response = await client.get<AnalysisResult[]>('/analysis/results/');
    return response.data;
};

export const uploadVideo = async (videoFile: File): Promise<AnalysisResult> => {
    const formData = new FormData();
    formData.append('video', videoFile);
    const response = await client.post<AnalysisResult>('/analysis/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};
