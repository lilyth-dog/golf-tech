export interface User {
    id: number;
    username: string;
    email: string;
}

export interface UserProfile {
    id: number;
    user: number;
    nickname: string;
    height?: number;
    weight?: number;
    skeletal_muscle_mass?: number;
    body_fat_percentage?: number;
    bmi?: number;
    bone_mineral_density?: number;
    visceral_fat_level?: number;
    body_water_percentage?: number;
    basal_metabolic_rate?: number;
    flexibility?: number;
    handicap: number;
    years_experience: number;
}

export interface AuthResponse {
    token: string;
    user_id: number;
    username: string;
}

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface RegisterCredentials {
    username: string;
    email: string;
    password: string;
}
