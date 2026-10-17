import api from './client';
import type { User, ApiResponse } from '../types';

export const usersApi = {
  list: () => api.get<ApiResponse<User[]>>('/users'),
  create: (data: { name: string; email: string; password: string; role: string }) => api.post<ApiResponse<User>>('/users', data),
  update: (id: string, data: Partial<User>) => api.put<ApiResponse<User>>(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};
