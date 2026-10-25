import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useCreateBooking } from '@/hooks/useBookings';
import { Zap, Clock, AlertCircle, X } from 'lucide-react';
import { format } from 'date-fns';

interface AdminBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
  facilities: any[];
}

// Clean and normalize any time string (e.g. "8.27", "8:27", "827", "08:27") into "HH:mm"
export function normalizeTimeString(val: string): string {
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
  if (parts.length === 1 && !isNaN(parseInt(parts[0], 10))) {
    const h = Math.min(23, Math.max(0, parseInt(parts[0], 10) || 0));
    return `${String(h).padStart(2, '0')}:00`;
  }
  return val;
}

export function AdminBookingModal({ isOpen, onClose, initialData, facilities = [] }: AdminBookingModalProps) {
  const [facilityId, setFacilityId] = useState('');
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [timeInput, setTimeInput] = useState(() => format(new Date(), 'HH:mm'));
  const [duration, setDuration] = useState(60);
  const [personCount, setPersonCount] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [status, setStatus] = useState('confirmed');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const { mutate: createBooking, isPending } = useCreateBooking();

  const prevIsOpenRef = useRef(false);

  // Populate from initialData ONLY when modal opens (transitions from closed to open)
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setError('');
      const defaultFacility = initialData?.facilityId || (facilities[0]?._id ?? '');
      setFacilityId(defaultFacility);
      setDate(initialData?.date || format(new Date(), 'yyyy-MM-dd'));
      setTimeInput(normalizeTimeString(initialData?.startTime || format(new Date(), 'HH:mm')));
      setDuration(Number(initialData?.duration || 60));
      setPersonCount(Number(initialData?.personCount || 1));
      setCustomerName(initialData?.name || initialData?.customerName || '');
      setCustomerPhone(initialData?.phone || initialData?.customerPhone || '');
      setStatus(initialData?.status || 'confirmed');
      setNotes(initialData?.notes || '');
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialData, facilities]);

  // If facilities was empty when modal opened, set initial facility once facilities are available
  useEffect(() => {
    if (isOpen && !facilityId && facilities.length > 0) {
      setFacilityId(initialData?.facilityId || facilities[0]._id);
    }
  }, [isOpen, facilities, facilityId, initialData?.facilityId]);

  // Selected facility object
  const selectedFacility = useMemo(() => {
    return facilities.find(f => f._id === facilityId) || facilities[0];
  }, [facilities, facilityId]);

  const hasMultiTiers = useMemo(() => {
    return Boolean(selectedFacility?.pricingTiers && selectedFacility.pricingTiers.length > 1);
  }, [selectedFacility]);

  // Normalized start time
  const formattedStartTime = useMemo(() => {
    return normalizeTimeString(timeInput) || '09:00';
  }, [timeInput]);

  // Calculate live end time
  const calculatedEndTime = useMemo(() => {
    const [h, m] = formattedStartTime.split(':').map(Number);
    const startMins = (h || 0) * 60 + (m || 0);
    const endMins = startMins + Number(duration || 60);
    const endH = Math.floor(endMins / 60);
    const endM = endMins % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  }, [formattedStartTime, duration]);

  // Estimated total price
  const estimatedPrice = useMemo(() => {
    if (!selectedFacility) return 0;
    const hours = (duration || 60) / 60;
    if (selectedFacility.pricingTiers && selectedFacility.pricingTiers.length > 0) {
      const tier = selectedFacility.pricingTiers.find((t: any) => t.persons === personCount) || selectedFacility.pricingTiers[0];
      if (tier) {
        if (duration === 30 && tier.halfHourRate) return tier.halfHourRate;
        return Math.round(tier.hourlyRate * hours);
      }
    }
    if (duration === 30 && selectedFacility.halfHourRate) return selectedFacility.halfHourRate;
    return Math.round((selectedFacility.hourlyRate || 800) * hours);
  }, [selectedFacility, duration, personCount]);

  if (!isOpen) return null;

  const handleSetNow = () => {
    setTimeInput(format(new Date(), 'HH:mm'));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const targetFacId = facilityId || facilities[0]?._id;
    if (!targetFacId) {
      setError('Please select or add at least one facility first.');
      return;
    }

    const payload = {
      facilityId: targetFacId,
      date: date || format(new Date(), 'yyyy-MM-dd'),
      startTime: formattedStartTime,
      durationMinutes: Number(duration || 60),
      duration: Number(duration || 60),
      personCount: Number(personCount || 1),
      customerName: customerName.trim() || 'Walk-in Guest',
      name: customerName.trim() || 'Walk-in Guest',
      customerPhone: customerPhone.trim() || undefined,
      phone: customerPhone.trim() || undefined,
      status: status || 'confirmed',
      notes: notes.trim() || undefined,
      source: 'walk_in',
      bookingSource: 'walk_in',
    };

    createBooking(payload, {
      onSuccess: () => {
        onClose();
      },
      onError: (err: any) => {
        const msg = err.response?.data?.message || err.message || 'Failed to create booking.';
        setError(msg.replace('BOOKING_CONFLICT: ', ''));
      },
    });
  };

  const DURATION_PRESETS = [15, 30, 45, 60, 90, 120, 180];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.85)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: '#111111',
        border: '1px solid #2a2a2a',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '520px',
        padding: '28px',
        maxHeight: '92vh',
        overflowY: 'auto',
        boxShadow: '0 20px 50px rgba(0,0,0,0.9)',
        position: 'relative',
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
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

        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#c0c0c015', border: '1px solid #c0c0c030', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={18} color="#c0c0c0" />
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
            Quick Walk-in Booking
          </h2>
        </div>
        <p style={{ fontSize: '0.78rem', color: '#6b6b6b', marginBottom: '20px' }}>
          All fields are optional. Enter any start time (e.g. 8.27) and duration.
        </p>

        {/* Error Alert */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            background: '#8b202020',
            border: '1px solid #8b202060',
            borderRadius: '8px',
            padding: '12px 14px',
            marginBottom: '18px',
            color: '#ff8b8b',
            fontSize: '0.8rem',
            lineHeight: 1.4,
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Station / Facility */}
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#8b8b8b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
              Station / Facility (Optional)
            </label>
            <select
              value={facilityId}
              onChange={e => {
                const newId = e.target.value;
                setFacilityId(newId);
                const fac = facilities.find(f => f._id === newId);
                if (fac?.pricingTiers && fac.pricingTiers.length > 1) {
                  setPersonCount(fac.pricingTiers[0].persons || 1);
                } else {
                  setPersonCount(1);
                }
              }}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: '#0a0a0a',
                border: '1px solid #2a2a2a',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '0.88rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {facilities.map((f: any) => (
                <option key={f._id} value={f._id} style={{ background: '#111111', color: '#ffffff' }}>
                  {f.name} ({f.category?.name || 'General'})
                </option>
              ))}
            </select>
          </div>

          {/* Date & Start Time */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#8b8b8b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                Date (Optional)
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#0a0a0a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none',
                  colorScheme: 'dark',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#8b8b8b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Start Time
                </label>
                <button
                  type="button"
                  onClick={handleSetNow}
                  style={{
                    background: '#222222',
                    border: '1px solid #333333',
                    borderRadius: '4px',
                    color: '#c0c0c0',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '2px 6px',
                    cursor: 'pointer',
                  }}
                >
                  ⚡ Now
                </button>
              </div>
              <input
                type="text"
                placeholder="e.g. 8.27 or 14:15"
                value={timeInput}
                onChange={e => setTimeInput(e.target.value)}
                onBlur={() => setTimeInput(normalizeTimeString(timeInput))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#0a0a0a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Duration Selector */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#8b8b8b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Duration ({duration} minutes)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="number"
                  min="5"
                  max="480"
                  step="5"
                  value={duration}
                  onChange={e => setDuration(Math.max(5, parseInt(e.target.value, 10) || 30))}
                  style={{
                    width: '60px',
                    padding: '3px 6px',
                    background: '#0a0a0a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    textAlign: 'center',
                    outline: 'none',
                  }}
                />
                <span style={{ fontSize: '0.7rem', color: '#6b6b6b' }}>mins</span>
              </div>
            </div>

            {/* Quick duration buttons */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {DURATION_PRESETS.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: duration === d ? 800 : 500,
                    background: duration === d ? '#c0c0c0' : '#161616',
                    color: duration === d ? '#000000' : '#8b8b8b',
                    border: `1px solid ${duration === d ? '#c0c0c0' : '#2a2a2a'}`,
                    cursor: 'pointer',
                    transition: 'all 0.1s',
                  }}
                >
                  {d < 60 ? `${d}m` : d === 60 ? '1h' : `${d / 60}h`}
                </button>
              ))}
            </div>
          </div>

          {/* Live Schedule Banner */}
          <div style={{
            background: '#161616',
            border: '1px solid #2a2a2a',
            borderRadius: '10px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={16} color="#c0c0c0" />
              <div>
                <span style={{ fontSize: '0.7rem', color: '#6b6b6b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' }}>
                  Scheduled Window
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff' }}>
                  {formattedStartTime} → {calculatedEndTime}
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.7rem', color: '#6b6b6b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' }}>
                Est. Total
              </span>
              <span style={{ fontSize: '1rem', fontWeight: 900, color: '#c0c0c0' }}>
                Rs. {estimatedPrice.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Customer Name & Phone (Optional) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#8b8b8b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                Customer Name (Optional)
              </label>
              <input
                placeholder="Walk-in Guest"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#0a0a0a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#8b8b8b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                Phone Number (Optional)
              </label>
              <input
                placeholder="Optional contact"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#0a0a0a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Controllers (PS5 only) & Status */}
          {hasMultiTiers ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#8b8b8b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                  Controllers
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {selectedFacility.pricingTiers.map((tier: any) => {
                    const isSelected = (personCount || 1) === tier.persons;
                    return (
                      <button
                        key={tier.persons}
                        type="button"
                        onClick={() => setPersonCount(tier.persons)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: isSelected ? 800 : 500,
                          background: isSelected ? '#c0c0c0' : '#161616',
                          color: isSelected ? '#000000' : '#8b8b8b',
                          border: `1px solid ${isSelected ? '#c0c0c0' : '#2a2a2a'}`,
                          cursor: 'pointer',
                          transition: 'all 0.1s',
                        }}
                      >
                        {tier.persons === 1 ? '1 Controller' : `${tier.persons} Controllers`} (Rs. {tier.hourlyRate}/hr)
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#8b8b8b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                  Status
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#0a0a0a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                >
                  <option value="confirmed" style={{ background: '#111111', color: '#ffffff' }}>Ongoing</option>
                  <option value="completed" style={{ background: '#111111', color: '#ffffff' }}>Completed</option>
                  <option value="pending" style={{ background: '#111111', color: '#ffffff' }}>Pending</option>
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#8b8b8b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#0a0a0a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              >
                <option value="confirmed" style={{ background: '#111111', color: '#ffffff' }}>Ongoing</option>
                <option value="completed" style={{ background: '#111111', color: '#ffffff' }}>Completed</option>
                <option value="pending" style={{ background: '#111111', color: '#ffffff' }}>Pending</option>
              </select>
            </div>
          )}

          {/* Notes (Optional) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#8b8b8b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
              Notes (Optional)
            </label>
            <input
              placeholder="e.g. FC25 tournament, paid cash Rs. 1000"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: '#0a0a0a',
                border: '1px solid #2a2a2a',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '0.85rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '11px 20px',
                background: 'transparent',
                border: '1px solid #2a2a2a',
                borderRadius: '8px',
                color: '#8b8b8b',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              style={{
                padding: '11px 24px',
                background: isPending ? '#555555' : '#c0c0c0',
                border: 'none',
                borderRadius: '8px',
                color: '#000000',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: isPending ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Zap size={15} />
              {isPending ? 'Booking...' : '⚡ Quick Book Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
