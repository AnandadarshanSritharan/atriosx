import api from './client';
import type { User } from '../types';

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ success: boolean; token: string; data: User }>('/auth/login', { email, password }),
  me: () => api.get<{ success: boolean; data: User }>('/auth/me'),
  logout: () => api.post('/auth/logout'),
  changePassword: (oldPassword: string, newPassword: string) =>
    api.put('/auth/change-password', { oldPassword, newPassword }),
};
