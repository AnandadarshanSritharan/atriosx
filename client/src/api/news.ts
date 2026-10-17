import api from './client';
import type { News, ApiResponse } from '../types';

export const newsApi = {
  list: (params?: { status?: string; page?: number; limit?: number; all?: boolean | string }) =>
    api.get<ApiResponse<News[]>>('/news', { params: { all: 'true', ...params } }),
  getAll: (params?: { published?: boolean; limit?: number; status?: string; page?: number; all?: boolean | string }) =>
    api.get<ApiResponse<News[]>>('/news', { params: { ...params, status: params?.published !== false && !params?.all ? 'published' : undefined } }),
  getBySlug: (slug: string) => api.get<ApiResponse<News>>(`/news/${slug}`),
  get: (id: string) => api.get<ApiResponse<News>>(`/news/${id}`),
  create: (data: Partial<News>) => api.post<ApiResponse<News>>('/news', data),
  update: (id: string, data: Partial<News>) => api.put<ApiResponse<News>>(`/news/${id}`, data),
  delete: (id: string) => api.delete(`/news/${id}`),
};
