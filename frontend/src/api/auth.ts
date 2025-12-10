import client from './client';
import type { LoginCredentials, RegisterCredentials, AuthResponse } from '../types/auth';

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await client.post<AuthResponse>('/auth/login/', credentials);
    return response.data;
};

export const register = async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await client.post<AuthResponse>('/auth/register/', credentials);
    return response.data;
};

export const getProfile = async () => {
    const response = await client.get('/profile/');
    return response.data;
}
