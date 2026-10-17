import api from './client';
import type { Partner, ApiResponse } from '../types';

export const partnersApi = {
  list: () => api.get<ApiResponse<Partner[]>>('/partners'),
  get: (id: string) => api.get<ApiResponse<Partner>>(`/partners/${id}`),
  create: (data: Partial<Partner>) => api.post<ApiResponse<Partner>>('/partners', data),
  update: (id: string, data: Partial<Partner>) => api.put<ApiResponse<Partner>>(`/partners/${id}`, data),
  delete: (id: string) => api.delete(`/partners/${id}`),
  getDistribution: (params: { dateFrom: string; dateTo: string }) => api.get<ApiResponse<any>>('/partners/distribution', { params }),
  addInvestment: (id: string, data: { amount: number; date: string; note?: string }) => api.post(`/partners/${id}/investments`, data),
  recalculate: () => api.put('/partners/recalculate', {}),
};
