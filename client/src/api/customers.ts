import api from './client';
import type { Customer, Booking, ApiResponse } from '../types';

export const customersApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) => api.get<ApiResponse<Customer[]>>('/customers', { params }),
  get: (id: string) => api.get<ApiResponse<{ customer: Customer; bookings: Booking[] }>>(`/customers/${id}`),
  update: (id: string, data: Partial<Customer>) => api.put<ApiResponse<Customer>>(`/customers/${id}`, data),
  exportExcel: () => api.get('/customers/export/excel', { responseType: 'blob' }),
};
