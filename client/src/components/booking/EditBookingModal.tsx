import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from '@/api/bookings';
import { X, User, Phone, Mail, AlertCircle, Edit3, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface EditBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  facilities?: any[];
}

// Clean and normalize any time string (e.g. "8.27", "8:27", "827", "08:27") into "HH:mm"
function normalizeTimeString(val: string): string {
  if (!val) return '';
  const clean = val.trim().replace(/[.\s,-]/g, ':');
  if (/^\d{3,4}$/.test(clean)) {
    const padded = clean.padStart(4, '0');
    return `${padded.slice(0, 2)}:${padded.slice(2)}`;
  }
  const parts = clean.split(':');
  if (parts.length >= 2) {
    const h = Math.min(23, Math.max(0, parseInt(parts[0], 10) || 0));
    const m = Math.min(59, Math.max(0, parseInt(parts[1], 10) || 0));
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  return val;
}

export function EditBookingModal({ isOpen, onClose, booking, facilities = [] }: EditBookingModalProps) {
  const qc = useQueryClient();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [facilityId, setFacilityId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [personCount, setPersonCount] = useState(1);
  const [total, setTotal] = useState<number | string>('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Check if this booking can be edited
  const isEditable = useMemo(() => {
    if (!booking) return false;
    const nonEditable = ['completed', 'cancelled', 'no_show', 'no-show'];
    return !nonEditable.includes(booking.status);
  }, [booking]);

  const prevBookingIdRef = useRef<string | null>(null);

  // Pre-fill form when modal opens or a different booking is selected
  useEffect(() => {
    const currentId = booking?._id || booking?.id;
    if (isOpen && booking && currentId !== prevBookingIdRef.current) {
      prevBookingIdRef.current = currentId;
      setError('');
      setCustomerName(booking.customer?.name || booking.name || '');
      setCustomerPhone(booking.customer?.phone || booking.phone || '');
      setCustomerEmail(booking.customer?.email || booking.email || '');
      setFacilityId(booking.facility?._id || booking.facility || facilities[0]?._id || '');
      setDate(booking.date || '');
      setStartTime(normalizeTimeString(booking.startTime || '10:00'));
      setDuration(booking.durationMinutes ?? booking.duration ?? 60);
      setPersonCount(booking.personCount || 1);
      setTotal(booking.total ?? booking.totalAmount ?? 0);
      setNotes(booking.notes || '');
    }
    if (!isOpen) {
      prevBookingIdRef.current = null;
    }
  }, [isOpen, booking, facilities]);

  // Selected facility object
  const selectedFacility = useMemo(() => {
    return facilities.find(f => f._id === facilityId) || (typeof booking?.facility === 'object' ? booking.facility : null);
  }, [facilities, facilityId, booking]);

  // Formatted start time & calculated end time
  const formattedStartTime = useMemo(() => normalizeTimeString(startTime) || '10:00', [startTime]);
  const calculatedEndTime = useMemo(() => {
    const [h, m] = formattedStartTime.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return '11:00';
    const totalMinutes = h * 60 + m + (Number(duration) || 60);
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  }, [formattedStartTime, duration]);

  // Live recalculate estimated total when facility, duration, or personCount changes
  const calculateEstimatedPrice = () => {
    if (!selectedFacility) return;
    const hours = (Number(duration) || 60) / 60;
    if (selectedFacility.pricingTiers && selectedFacility.pricingTiers.length > 0) {
      const exactTier = selectedFacility.pricingTiers.find((t: any) => t.persons === personCount);
      const tier = exactTier || selectedFacility.pricingTiers.slice().sort((a: any, b: any) => Math.abs(a.persons - personCount) - Math.abs(b.persons - personCount))[0];
      if (tier) {
        if (duration === 30 && tier.halfHourRate) {
          setTotal(tier.halfHourRate);
          return;
        }
        setTotal(Math.round(tier.hourlyRate * hours));
        return;
      }
    }
    const rate = selectedFacility.hourlyRate || 0;
    setTotal(Math.round(rate * hours));
  };

  const { mutate: updateBooking, isPending } = useMutation({
    mutationFn: (payload: any) => bookingsApi.update(booking._id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['booking', booking._id] });
      qc.invalidateQueries({ queryKey: ['calendar'] });
      onClose();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to update booking.';
      setError(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isEditable) {
      setError(`Cannot edit this booking because it is already ${booking.status}. Only pending or ongoing bookings can be edited.`);
      return;
    }

    if (!customerName.trim()) {
      setError('Customer name is required.');
      return;
    }
    if (!customerPhone.trim()) {
      setError('Customer phone number is required.');
      return;
    }
    if (!date) {
      setError('Date is required.');
      return;
    }

    const payload = {
      customerName: customerName.trim(),
      name: customerName.trim(),
      customerPhone: customerPhone.trim(),
      phone: customerPhone.trim(),
      customerEmail: customerEmail.trim() || undefined,
      email: customerEmail.trim() || undefined,
      facilityId: facilityId || undefined,
      facility: facilityId || undefined,
      date,
      startTime: formattedStartTime,
      endTime: calculatedEndTime,
      durationMinutes: Number(duration),
      duration: Number(duration),
      personCount: Number(personCount),
      total: total !== '' ? Number(total) : undefined,
      notes: notes.trim(),
    };

    updateBooking(payload);
  };

  if (!isOpen || !booking) return null;

  const DURATION_PRESETS = [15, 30, 45, 60, 90, 120, 180];
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const tomorrowStr = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backdropFilter: 'blur(5px)',
      }}
      onClick={() => !isPending && onClose()}
    >
      <div
        style={{
          background: '#111111',
          border: '1px solid #2a2a2a',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '540px',
          padding: '28px',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.9)',
          position: 'relative',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isPending}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: '#161616',
            border: '1px solid #2a2a2a',
            color: '#8b8b8b',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={16} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#c0c0c015', border: '1px solid #c0c0c030', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Edit3 size={17} color="#c0c0c0" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
              Edit Booking
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#c0c0c0', fontWeight: 700 }}>
                {booking.bookingNumber}
              </span>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '1px 8px',
                borderRadius: '12px',
                background: booking.status === 'confirmed' ? '#3d85c820' : '#d4a01720',
                color: booking.status === 'confirmed' ? '#3d85c8' : '#d4a017',
                border: `1px solid ${booking.status === 'confirmed' ? '#3d85c840' : '#d4a01740'}`,
                textTransform: 'capitalize',
              }}>
                {booking.status === 'confirmed' ? 'Ongoing' : booking.status}
              </span>
            </div>
          </div>
        </div>

        {/* Guard for non-editable status */}
        {!isEditable ? (
          <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: 700, fontSize: '0.85rem' }}>
              <AlertCircle size={16} />
              Editing Not Allowed
            </div>
            <p style={{ fontSize: '0.78rem', color: '#a0a0a0', marginTop: '6px', lineHeight: 1.5 }}>
              This booking is marked as <strong style={{ color: '#ffffff', textTransform: 'capitalize' }}>{booking.status.replace(/[-_]/g, ' ')}</strong> and cannot be edited. Only pending or ongoing bookings can be modified.
            </p>
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={onClose}
                style={{ padding: '8px 16px', background: '#222', border: '1px solid #333', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && (
              <div style={{ padding: '12px 14px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '0.8rem' }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Customer Section */}
            <div style={{ background: '#161616', border: '1px solid #222222', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8b8b8b', marginBottom: '12px' }}>
                Customer Information
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#a0a0a0', marginBottom: '4px' }}>Name *</label>
                  <div style={{ position: 'relative' }}>
                    <User size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6b6b6b' }} />
                    <input
                      type="text"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      required
                      placeholder="Customer name"
                      style={{ width: '100%', padding: '8px 10px 8px 30px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#ffffff', fontSize: '0.82rem', outline: 'none' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#a0a0a0', marginBottom: '4px' }}>Phone *</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6b6b6b' }} />
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      required
                      placeholder="0771234567"
                      style={{ width: '100%', padding: '8px 10px 8px 30px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#ffffff', fontSize: '0.82rem', outline: 'none' }}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#a0a0a0', marginBottom: '4px' }}>Email (Optional)</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6b6b6b' }} />
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={e => setCustomerEmail(e.target.value)}
                    placeholder="email@example.com"
                    style={{ width: '100%', padding: '8px 10px 8px 30px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#ffffff', fontSize: '0.82rem', outline: 'none' }}
                  />
                </div>
              </div>
            </div>

            {/* Facility & Players */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#a0a0a0', marginBottom: '4px' }}>Facility</label>
                <select
                  value={facilityId}
                  onChange={e => setFacilityId(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#ffffff', fontSize: '0.82rem', outline: 'none', cursor: 'pointer' }}
                >
                  {facilities.map((f: any) => (
                    <option key={f._id} value={f._id}>
                      {f.name} (Rs. {f.hourlyRate}/hr)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#a0a0a0', marginBottom: '4px' }}>Players</label>
                <div style={{ display: 'flex', alignItems: 'center', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '6px', overflow: 'hidden' }}>
                  <button
                    type="button"
                    onClick={() => setPersonCount(p => Math.max(1, p - 1))}
                    style={{ width: '32px', height: '34px', background: 'transparent', border: 'none', color: '#c0c0c0', fontSize: '1rem', cursor: 'pointer' }}
                  >
                    -
                  </button>
                  <span style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem', color: '#ffffff', fontWeight: 700 }}>
                    {personCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPersonCount(p => Math.min(10, p + 1))}
                    style={{ width: '32px', height: '34px', background: 'transparent', border: 'none', color: '#c0c0c0', fontSize: '1rem', cursor: 'pointer' }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Date & Time */}
            <div style={{ background: '#161616', border: '1px solid #222222', borderRadius: '10px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8b8b8b' }}>
                  Schedule
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setDate(todayStr)}
                    style={{ padding: '2px 8px', background: date === todayStr ? '#c0c0c020' : 'transparent', border: `1px solid ${date === todayStr ? '#c0c0c0' : '#2a2a2a'}`, borderRadius: '4px', fontSize: '0.68rem', color: date === todayStr ? '#ffffff' : '#8b8b8b', cursor: 'pointer' }}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setDate(tomorrowStr)}
                    style={{ padding: '2px 8px', background: date === tomorrowStr ? '#c0c0c020' : 'transparent', border: `1px solid ${date === tomorrowStr ? '#c0c0c0' : '#2a2a2a'}`, borderRadius: '4px', fontSize: '0.68rem', color: date === tomorrowStr ? '#ffffff' : '#8b8b8b', cursor: 'pointer' }}
                  >
                    Tomorrow
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#a0a0a0', marginBottom: '4px' }}>Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px 10px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#ffffff', fontSize: '0.82rem', outline: 'none', colorScheme: 'dark' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#a0a0a0', marginBottom: '4px' }}>Start Time (HH:mm)</label>
                  <input
                    type="text"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    placeholder="14:00"
                    required
                    style={{ width: '100%', padding: '8px 10px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#ffffff', fontSize: '0.82rem', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Duration Presets */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#a0a0a0', marginBottom: '6px' }}>Duration</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {DURATION_PRESETS.map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDuration(d)}
                      style={{
                        padding: '6px 10px',
                        background: duration === d ? '#c0c0c0' : '#0a0a0a',
                        color: duration === d ? '#000000' : '#c0c0c0',
                        border: `1px solid ${duration === d ? '#c0c0c0' : '#2a2a2a'}`,
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: duration === d ? 700 : 500,
                        cursor: 'pointer',
                      }}
                    >
                      {d}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview */}
              <div style={{ marginTop: '12px', padding: '8px 12px', background: '#0a0a0a', border: '1px solid #222222', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#a0a0a0' }}>
                <span>Scheduled Slot:</span>
                <strong style={{ color: '#ffffff' }}>{date || '—'} from {formattedStartTime} to {calculatedEndTime} ({duration} mins)</strong>
              </div>
            </div>

            {/* Total Amount & Price Calculation */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label style={{ fontSize: '0.72rem', color: '#a0a0a0' }}>Total Amount (Rs.)</label>
                <button
                  type="button"
                  onClick={calculateEstimatedPrice}
                  style={{ background: 'none', border: 'none', color: '#c0c0c0', fontSize: '0.7rem', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Recalculate Price
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <DollarSign size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6b6b6b' }} />
                <input
                  type="number"
                  value={total}
                  onChange={e => setTotal(e.target.value)}
                  placeholder="Total amount"
                  style={{ width: '100%', padding: '8px 10px 8px 30px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#ffffff', fontSize: '0.85rem', fontWeight: 700, outline: 'none' }}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#a0a0a0', marginBottom: '4px' }}>Special Requests / Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder="Optional notes or special instructions..."
                style={{ width: '100%', padding: '8px 10px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#ffffff', fontSize: '0.82rem', resize: 'vertical', outline: 'none' }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                type="button"
                disabled={isPending}
                onClick={onClose}
                style={{
                  padding: '9px 18px',
                  background: 'transparent',
                  border: '1px solid #2a2a2a',
                  borderRadius: '7px',
                  color: '#c0c0c0',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: isPending ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                style={{
                  padding: '9px 22px',
                  background: '#c0c0c0',
                  border: 'none',
                  borderRadius: '7px',
                  color: '#000000',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: isPending ? 'not-allowed' : 'pointer',
                  opacity: isPending ? 0.7 : 1,
                }}
              >
                {isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
