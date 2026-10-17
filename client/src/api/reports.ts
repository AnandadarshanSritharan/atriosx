import api from './client';
import type { DashboardStats, ApiResponse } from '../types';

export const reportsApi = {
  dashboard: (params?: { dateFrom?: string; dateTo?: string; period?: string }) => api.get<ApiResponse<DashboardStats>>('/reports/dashboard', { params }),
  revenue: (params?: any) => api.get<ApiResponse<any>>('/reports/revenue', { params }),
  expenses: (params?: any) => api.get<ApiResponse<any>>('/reports/expenses', { params }),
  profit: (params?: any) => api.get<ApiResponse<any>>('/reports/profit', { params }),
  facilityPerformance: (params?: any) => api.get<ApiResponse<any[]>>('/reports/facility-performance', { params }),
  partnerDistribution: (params?: any) => api.get<ApiResponse<any[]>>('/reports/partner-distribution', { params }),
  exportBookings: (params?: any) => api.get('/reports/export/bookings', { params, responseType: 'blob' }),
  exportExpenses: (params?: any) => api.get('/reports/export/expenses', { params, responseType: 'blob' }),
  exportProfit: (params?: any) => api.get('/reports/export/profit', { params, responseType: 'blob' }),
};
