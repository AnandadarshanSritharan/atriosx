import api from './client';
import type { Facility, FacilityCategory, ApiResponse } from '../types';

export const facilitiesApi = {
  list: (params?: { includeInactive?: boolean }) =>
    api.get<ApiResponse<Facility[]>>('/facilities', { params }),
  getAll: (params?: any) =>
    api.get<ApiResponse<Facility[]>>('/facilities', { params }),
  get: (id: string) => api.get<ApiResponse<Facility>>(`/facilities/${id}`),
  create: (data: Partial<Facility>) => api.post<ApiResponse<Facility>>('/facilities', data),
  update: (id: string, data: Partial<Facility>) => api.put<ApiResponse<Facility>>(`/facilities/${id}`, data),
  delete: (id: string) => api.delete(`/facilities/${id}`),
  uploadImage: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post(`/facilities/${id}/images`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  categories: {
    list: () => api.get<ApiResponse<FacilityCategory[]>>('/facilities/categories/all'),
    create: (data: { name: string; slug: string; icon?: string }) =>
      api.post<ApiResponse<FacilityCategory>>('/facilities/categories', data),
    update: (id: string, data: Partial<FacilityCategory>) =>
      api.put<ApiResponse<FacilityCategory>>(`/facilities/categories/${id}`, data),
    delete: (id: string) => api.delete(`/facilities/categories/${id}`),
  },
};
