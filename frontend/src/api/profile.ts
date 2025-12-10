import client from './client';
import type { UserProfile } from '../types/auth';

export const getProfile = async (): Promise<UserProfile> => {
    const response = await client.get<UserProfile>('/profile/');
    return response.data;
};

export const updateProfile = async (profileData: Partial<UserProfile>): Promise<UserProfile> => {
    const response = await client.patch<UserProfile>('/profile/', profileData);
    return response.data;
};
