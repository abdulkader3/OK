// eslint-disable-next-line import/no-named-as-default
import apiClient from './apiClient';

export interface UpdateProfileData {
  name?: string;
  phone?: string;
  company?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export async function updateProfile(data: UpdateProfileData): Promise<void> {
  const response = await apiClient.patch<{ user: unknown }>('/api/users/me', data);
  if (!response.success) {
    throw new Error(response.message || 'Failed to update profile');
  }
}

export async function changePassword(data: ChangePasswordData): Promise<void> {
  const response = await apiClient.post('/api/auth/change-password', data);
  if (!response.success) {
    throw new Error(response.message || 'Failed to change password');
  }
}
