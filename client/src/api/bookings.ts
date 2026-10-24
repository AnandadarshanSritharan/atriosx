import api from './client';
import type { Booking, ApiResponse, AvailabilitySlot } from '../types';

export interface BookingFilters {
  page?: number; limit?: number; status?: string; facility?: string; facilityId?: string;
  dateFrom?: string; dateTo?: string; source?: string; search?: string; date?: string; sort?: string;
}

export const bookingsApi = {
  // Unified get list — handles both old and new filter shapes
  list: (params?: BookingFilters) => api.get<ApiResponse<Booking[]>>('/bookings', { params }),
  getAll: (params?: BookingFilters) => api.get<any>('/bookings', { params }),
  get: (id: string) => api.get<ApiResponse<Booking>>(`/bookings/${id}`),
  getById: (id: string) => api.get<ApiResponse<Booking>>(`/bookings/${id}`),
  create: (data: any) => api.post<ApiResponse<Booking>>('/bookings', data),
  update: (id: string, data: any) => api.put<ApiResponse<Booking>>(`/bookings/${id}`, data),
  updateStatus: (id: string, status: string, note?: string) =>
    api.patch<ApiResponse<Booking>>(`/bookings/${id}/status`, { status, note }),
  checkIn: (id: string) => api.patch<ApiResponse<Booking>>(`/bookings/${id}/checkin`, {}),
  getCalendar: (params: { start: string; end: string; facilityId?: string }) =>
    api.get<ApiResponse<any[]>>('/bookings/calendar', { params }),
  // Availability by specific facilityId
  getAvailability: (facilityId: string, date: string) =>
    api.get<ApiResponse<{ slots: AvailabilitySlot[]; minDuration: number; maxDuration: number; interval: number }>>
      ('/bookings/availability', { params: { facilityId, date } }),
  // Availability by categoryId — merges slots across all units in the category
  getAvailabilityByCategory: (categoryId: string, date: string) =>
    api.get<ApiResponse<{ slots: (AvailabilitySlot & { freeUnits: number })[]; minDuration: number; maxDuration: number; interval: number; totalUnits: number; openTime: string; closeTime: string }>>
      ('/bookings/availability-by-category', { params: { categoryId, date } }),
  exportExcel: (params?: BookingFilters) =>
    api.get('/bookings/export/excel', { params, responseType: 'blob' }),
  // Notification polling — returns the single most recent booking (admin only)
  getLatestBooking: () => api.get<ApiResponse<any>>('/bookings/latest'),
  delete: (id: string) => api.delete<ApiResponse<any>>(`/bookings/${id}`),
};
