import api from './client';
import type { BusinessSettings, ApiResponse } from '../types';

export const settingsApi = {
  get: () => api.get<ApiResponse<BusinessSettings>>('/settings'),
  update: (data: Partial<BusinessSettings>) => api.put<ApiResponse<BusinessSettings>>('/settings', data),
  holidays: {
    list: () => api.get('/settings/holidays'),
    create: (data: { date: string; name: string; type: string; specialHours?: any }) => api.post('/settings/holidays', data),
    delete: (id: string) => api.delete(`/settings/holidays/${id}`),
  },
};
