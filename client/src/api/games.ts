import api from './client';
import type { Game, ApiResponse } from '../types';

export interface GameListParams {
  platform?: string;
  facilityCategory?: string;
  active?: boolean;
  featured?: boolean;
  limit?: number;
  includeInactive?: boolean;
  search?: string;
}

export const gamesApi = {
  list: (params?: GameListParams) => api.get<ApiResponse<Game[]>>('/games', { params }),
  getAll: (params?: GameListParams) => api.get<ApiResponse<Game[]>>('/games', { params }),
  get: (id: string) => api.get<ApiResponse<Game>>(`/games/${id}`),
  create: (data: Partial<Game>) => api.post<ApiResponse<Game>>('/games', data),
  update: (id: string, data: Partial<Game>) => api.put<ApiResponse<Game>>(`/games/${id}`, data),
  delete: (id: string) => api.delete(`/games/${id}`),
  uploadImage: (id: string, file: File) => {
    const fd = new FormData();
    fd.append('image', file);
    return api.post<ApiResponse<Game>>(`/games/${id}/image`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
