import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BookingStatusBadge } from '@/components/shared/BookingStatusBadge';
import { useUpdateBookingStatus, useCheckIn } from '@/hooks/useBookings';

export function BookingDetailsModal({ isOpen, onClose, booking }: any) {
  const [status, setStatus] = useState(booking?.status || 'pending');
  const { mutate: updateStatus, isPending: updating } = useUpdateBookingStatus();
  const { mutate: checkIn, isPending: checkingIn } = useCheckIn();

  React.useEffect(() => {
    if (booking?.status) {
      setStatus(booking.status);
    }
  }, [booking?.status]);

  if (!isOpen || !booking) return null;

  const handleSaveStatus = () => updateStatus({ id: booking._id, status }, { onSuccess: () => onClose() });
  const handleCheckIn = () => checkIn(booking._id, { onSuccess: () => onClose() });

  const totalDisplay = booking.totalAmount ?? booking.total ?? 0;
  const durationDisplay = booking.durationMinutes ?? booking.duration ?? 60;
  const customerName = booking.customer?.name || booking.name || 'Walk-in Customer';
  const customerPhone = booking.customer?.phone || booking.phone || 'N/A';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md shadow-2xl relative">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-bold text-white">Booking {booking.bookingNumber}</h2>
          <BookingStatusBadge status={booking.status} />
        </div>
        
        <div className="space-y-4 text-sm text-silver">
          <div className="bg-surface-2 p-4 rounded-lg border border-border space-y-2">
            <p><span className="text-muted">Customer:</span> <strong className="text-white">{customerName}</strong> ({customerPhone})</p>
            <p><span className="text-muted">Facility:</span> <span className="text-white">{booking.facility?.name || 'Assigned Facility'}</span></p>
            <p><span className="text-muted">Schedule:</span> <span className="text-white">{booking.date} at {booking.startTime} ({durationDisplay}m)</span></p>
            {booking.personCount && (
              <p><span className="text-muted">Players:</span> <span className="text-white font-semibold">{booking.personCount} {booking.personCount > 1 ? 'Players' : 'Player'}</span></p>
            )}
            <p><span className="text-muted">Total:</span> <span className="text-white font-bold">Rs. {Number(totalDisplay).toLocaleString()}</span></p>
          </div>

          <div className="flex items-center gap-3">
            <select className="flex-1 bg-surface border border-border rounded p-2 text-white" 
                    value={status} onChange={e => setStatus(e.target.value)}>
              <option value="pending">Pending</option>
              <option value="confirmed">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="no_show">No Show</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <Button size="sm" onClick={handleSaveStatus} disabled={updating}>Save Status</Button>
          </div>
        </div>
        
        <div className="flex flex-col gap-3 mt-8">
          {!booking.checkedIn && booking.status !== 'completed' && booking.status !== 'cancelled' && (
            <Button onClick={handleCheckIn} disabled={checkingIn} className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0">
              Check In Customer
            </Button>
          )}
          <Button variant="outline" onClick={onClose} className="w-full">Close Window</Button>
        </div>
      </div>
    </div>
  );
}
