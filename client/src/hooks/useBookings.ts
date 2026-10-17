import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi, type BookingFilters } from '../api/bookings';

export const useBookings = (filters?: BookingFilters) => useQuery({ queryKey: ['bookings', filters], queryFn: () => bookingsApi.list(filters).then(r => r.data) });
export const useBooking = (id: string) => useQuery({ queryKey: ['booking', id], queryFn: () => bookingsApi.get(id).then(r => r.data.data), enabled: !!id });
export const useCreateBooking = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: bookingsApi.create, onSuccess: () => { qc.invalidateQueries({ queryKey: ['bookings'] }); qc.invalidateQueries({ queryKey: ['calendar'] }); } });
};
export const useUpdateBookingStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: string; note?: string }) => bookingsApi.updateStatus(id, status, note),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bookings'] }); qc.invalidateQueries({ queryKey: ['calendar'] }); },
  });
};
export const useCheckIn = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: bookingsApi.checkIn, onSuccess: () => { qc.invalidateQueries({ queryKey: ['bookings'] }); qc.invalidateQueries({ queryKey: ['calendar'] }); } });
};
export const useCalendarBookings = (start: string, end: string) => useQuery({ queryKey: ['calendar', start, end], queryFn: () => bookingsApi.getCalendar({ start, end }).then(r => r.data.data), enabled: !!start && !!end });
export const useAvailability = (facilityId: string, date: string) => useQuery({ queryKey: ['availability', facilityId, date], queryFn: () => bookingsApi.getAvailability(facilityId, date).then(r => r.data.data), enabled: !!facilityId && !!date });
// Category-based availability — merges slots across all units, used in public booking wizard
export const useAvailabilityByCategory = (categoryId: string, date: string) => useQuery({ queryKey: ['availability-category', categoryId, date], queryFn: () => bookingsApi.getAvailabilityByCategory(categoryId, date).then(r => r.data.data), enabled: !!categoryId && !!date });
