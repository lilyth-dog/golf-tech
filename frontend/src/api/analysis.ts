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
    swing_tempo_ratio?: number | null;
    downswing_time_s?: number | null;
    omega_peak?: number | null;
    evaluation?: {
        overall_score: number;
        components: {
            x_factor_score: number;
            tempo_score: number;
            posture_score: number;
            rotation_speed_score?: number | null;
            release_score?: number | null;
            sequence_score?: number | null;
        };
        inputs: {
            x_factor: number;
            swing_tempo_ratio: number;
            knee_flexion: number | null;
            spine_angle: number | null;
            release_rate_rad_s?: number | null;
            release_deg?: number | null;
            lead_ms?: number | null;
            omega_x_peak?: number | null;
            omega_shoulder_peak?: number | null;
            omega_hip_peak?: number | null;
            omega_x_avg?: number | null;
            omega_shoulder_avg?: number | null;
            omega_hip_avg?: number | null;
            alpha_x_peak?: number | null;
            alpha_shoulder_peak?: number | null;
            alpha_hip_peak?: number | null;
        };
        flags: string[];
        recommendations: string[];
        phases?: {
            peak_idx?: number;
            impact_idx?: number;
        };
    };
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
