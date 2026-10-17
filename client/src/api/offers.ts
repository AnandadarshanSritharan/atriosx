import api from './client';
import type { Offer, ApiResponse } from '../types';

export const offersApi = {
  list: (params?: { active?: boolean; limit?: number; all?: boolean | string }) =>
    api.get<ApiResponse<Offer[]>>('/offers', { params: { all: 'true', ...params } }),
  getAll: (params?: { active?: boolean; limit?: number; all?: boolean | string }) =>
    api.get<ApiResponse<Offer[]>>('/offers', { params }),
  get: (id: string) => api.get<ApiResponse<Offer>>(`/offers/${id}`),
  create: (data: Partial<Offer>) => api.post<ApiResponse<Offer>>('/offers', data),
  update: (id: string, data: Partial<Offer>) => api.put<ApiResponse<Offer>>(`/offers/${id}`, data),
  delete: (id: string) => api.delete(`/offers/${id}`),
};
