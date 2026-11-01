import React, { useState, useEffect, useMemo } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { bookingsApi } from '@/api/bookings';
import { BookingStatusBadge } from '@/components/shared/BookingStatusBadge';
import { useCheckIn } from '@/hooks/useBookings';
import { TimePicker12 } from '@/components/shared/TimePicker12';
import { Clock, Zap, ArrowRight, CheckCircle, AlertTriangle, X, Play } from 'lucide-react';
import { format } from 'date-fns';

interface BookingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onSwitchStation?: (booking: any, newStartTime: string) => void;
}

export function BookingDetailsModal({ isOpen, onClose, booking, onSwitchStation }: BookingDetailsModalProps) {
  const queryClient = useQueryClient();
  const [showEndSession, setShowEndSession] = useState(false);
  const [customEndTime, setCustomEndTime] = useState('');
  const [customPrice, setCustomPrice] = useState<string>('');
  const [priceOverride, setPriceOverride] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { mutate: checkIn, isPending: checkingIn } = useCheckIn();

  // Reset states when booking opens
  useEffect(() => {
    if (booking) {
      setShowEndSession(false);
      setErrorMsg('');
      setPriceOverride(false);
      // Pre-fill end time with now if today, or original endTime
      const nowStr = format(new Date(), 'HH:mm');
      setCustomEndTime(nowStr);
      setCustomPrice('');
    }
  }, [booking]);

  // General booking update mutation (for adjusting duration, endTime, total)
  const updateBookingMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => bookingsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const totalDisplay = booking?.totalAmount ?? booking?.total ?? 0;
  const durationDisplay = booking?.durationMinutes ?? booking?.duration ?? 60;
  const customerName = booking?.customer?.name || booking?.name || 'Walk-in Customer';
  const customerPhone = booking?.customer?.phone || booking?.phone || 'N/A';
  const facilityName = booking?.facility?.name || 'Assigned Facility';
  const hourlyRate = booking?.facility?.hourlyRate || booking?.rateSnapshot || 600;

  // Calculate actual duration in minutes based on booking.startTime and customEndTime
  const calculatedDuration = useMemo(() => {
    if (!booking?.startTime || !customEndTime) return durationDisplay;
    const [sH, sM] = booking.startTime.split(':').map(Number);
    const [eH, eM] = customEndTime.split(':').map(Number);
    const startMins = (sH || 0) * 60 + (sM || 0);
    let endMins = (eH || 0) * 60 + (eM || 0);
    if (endMins < startMins) {
      // Crossed midnight or invalid
      endMins += 24 * 60;
    }
    const diff = endMins - startMins;
    return Math.max(1, diff);
  }, [booking?.startTime, customEndTime, durationDisplay]);

  // Calculate proportional price based on actual minutes
  const autoCalculatedPrice = useMemo(() => {
    // Pro-rata per minute calculation, rounded to nearest 5 or 10 rupees
    const ratePerMin = hourlyRate / 60;
    const raw = calculatedDuration * ratePerMin;
    return Math.max(50, Math.round(raw / 10) * 10);
  }, [calculatedDuration, hourlyRate]);

  // The active price to be saved
  const finalPriceToSave = priceOverride && customPrice !== '' ? (Number(customPrice) || 0) : autoCalculatedPrice;

  // Don't render modal DOM if closed or no booking selected
  if (!isOpen || !booking) return null;

  // Handler: Set customEndTime to current time (⚡ Now)
  const handleSetEndNow = () => {
    const nowStr = format(new Date(), 'HH:mm');
    setCustomEndTime(nowStr);
    setPriceOverride(false);
  };


  // Handler: Check in
  const handleCheckIn = () => {
    checkIn(booking._id, { onSuccess: () => onClose() });
  };

  // Handler: End Session Early (Finish or Switch)
  const handleEndSessionSubmit = async (switchStation: boolean = false) => {
    setErrorMsg('');
    try {
      await updateBookingMutation.mutateAsync({
        id: booking._id,
        data: {
          endTime: customEndTime,
          durationMinutes: calculatedDuration,
          total: finalPriceToSave,
          status: 'completed',
          notes: booking.notes
            ? `${booking.notes} (Session ended early at ${customEndTime}, ${calculatedDuration}m)`
            : `Session ended early at ${customEndTime} (${calculatedDuration}m)`,
        },
      });

      if (switchStation && onSwitchStation) {
        onSwitchStation(booking, customEndTime);
      } else {
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to update booking session');
    }
  };

  const isSaving = updateBookingMutation.isPending;

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
      overflowY: 'auto',
    }}>
      <div style={{
        background: '#111111',
        border: '1px solid #2a2a2a',
        borderRadius: '16px',
        padding: '28px',
        width: '100%',
        maxWidth: '480px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.7)',
        position: 'relative',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Booking {booking.bookingNumber}
              </h2>
            </div>
            <p style={{ color: '#6b6b6b', fontSize: '0.8rem', margin: '4px 0 0 0' }}>
              {facilityName} · {booking.date}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookingStatusBadge status={booking.status} />
            <button
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: '#6b6b6b', cursor: 'pointer', padding: '4px' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {errorMsg && (
          <div style={{ padding: '10px 14px', background: '#2a0e0e', border: '1px solid #6b1f1f', borderRadius: '8px', color: '#ff6b6b', fontSize: '0.82rem', marginBottom: '16px' }}>
            {errorMsg}
          </div>
        )}

        {/* Booking Info Card */}
        <div style={{
          background: '#161616',
          border: '1px solid #222222',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          fontSize: '0.84rem',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#6b6b6b' }}>Customer:</span>
            <span style={{ color: '#ffffff', fontWeight: 700 }}>{customerName} <span style={{ color: '#8b8b8b', fontWeight: 400 }}>({customerPhone})</span></span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#6b6b6b' }}>Scheduled Time:</span>
            <span style={{ color: '#ffffff', fontWeight: 700 }}>
              {booking.startTime} – {booking.endTime || '—'} ({durationDisplay}m)
            </span>
          </div>
          {booking.personCount && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b6b6b' }}>Unit / Players:</span>
              <span style={{ color: '#ffffff', fontWeight: 600 }}>{booking.personCount}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid #222222' }}>
            <span style={{ color: '#6b6b6b', fontWeight: 600 }}>Current Total:</span>
            <span style={{ color: '#c0c0c0', fontWeight: 800, fontSize: '1rem' }}>
              Rs. {Number(totalDisplay).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Early End / Switch Station Section */}
        {!showEndSession ? (
          <div style={{ marginBottom: '20px' }}>
            <button
              type="button"
              onClick={() => {
                setShowEndSession(true);
                handleSetEndNow();
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'linear-gradient(90deg, #182838 0%, #111111 100%)',
                border: '1px solid #1e3a5f',
                borderRadius: '10px',
                color: '#64b5f6',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color="#64b5f6" />
                <span>Customer Ending Early / Switching Station?</span>
              </div>
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <div style={{
            background: '#141414',
            border: '1px solid #2a3b4c',
            borderRadius: '12px',
            padding: '18px',
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64b5f6', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={15} /> End Session & Recalculate
              </span>
              <button
                type="button"
                onClick={handleSetEndNow}
                style={{
                  background: '#1a2a3a',
                  border: '1px solid #2a4a6a',
                  borderRadius: '6px',
                  color: '#90caf9',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '4px 10px',
                  cursor: 'pointer',
                }}
              >
                ⚡ Set to Right Now
              </button>
            </div>

            {/* 12-Hour Time Picker for End Time */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.72rem', color: '#8b8b8b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Session End Time (12-Hour AM/PM)
              </label>
              <TimePicker12
                value={customEndTime}
                onChange={val => {
                  setCustomEndTime(val);
                  setPriceOverride(false);
                }}
              />
            </div>

            {/* Played Duration & Recalculated Bill Banner */}
            <div style={{
              background: '#0d1a24',
              border: '1px solid #1e3a5f',
              borderRadius: '8px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#6b6b6b', textTransform: 'uppercase', display: 'block' }}>
                  Actual Duration
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff' }}>
                  {calculatedDuration} minutes
                </span>
                <span style={{ fontSize: '0.72rem', color: '#8b8b8b', display: 'block' }}>
                  ({booking.startTime} → {customEndTime})
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.7rem', color: '#6b6b6b', textTransform: 'uppercase', display: 'block' }}>
                  Calculated Price
                </span>
                <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#64b5f6' }}>
                  Rs. {autoCalculatedPrice.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Price Override Toggle & Input */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.72rem', color: '#8b8b8b', fontWeight: 600 }}>
                  Need to charge a custom amount?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setPriceOverride(!priceOverride);
                    if (!priceOverride) setCustomPrice(String(autoCalculatedPrice));
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: priceOverride ? '#64b5f6' : '#8b8b8b',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  {priceOverride ? 'Use Auto Calculation' : 'Enter Custom Price'}
                </button>
              </div>
              {priceOverride && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#c0c0c0', fontWeight: 700 }}>Rs.</span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    placeholder="Enter final price"
                    value={customPrice}
                    onChange={e => setCustomPrice(e.target.value)}
                    style={{
                      flex: 1,
                      background: '#0a0a0a',
                      border: '1px solid #2a2a2a',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      outline: 'none',
                    }}
                  />
                </div>
              )}
            </div>

            {/* Action Buttons for Early End */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleEndSessionSubmit(false)}
                style={{
                  padding: '11px 16px',
                  background: '#c0c0c0',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#000000',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <CheckCircle size={16} />
                {isSaving ? 'Updating...' : `End Booking Now (Bill Rs. ${finalPriceToSave.toLocaleString()})`}
              </button>

              {onSwitchStation && (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleEndSessionSubmit(true)}
                  style={{
                    padding: '11px 16px',
                    background: '#1e3a5f',
                    border: '1px solid #3d85c8',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <Zap size={16} />
                  Switch
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowEndSession(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#6b6b6b',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  padding: '6px',
                  textAlign: 'center',
                }}
              >
                Cancel Early End
              </button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px' }}>
          {!booking.checkedIn && booking.status !== 'completed' && booking.status !== 'cancelled' && (
            <button
              onClick={handleCheckIn}
              disabled={checkingIn}
              style={{
                padding: '11px',
                background: '#1e3a5f',
                border: 'none',
                borderRadius: '8px',
                color: '#64b5f6',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: checkingIn ? 'not-allowed' : 'pointer',
              }}
            >
              {checkingIn ? 'Checking in...' : 'Check In Customer'}
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              padding: '10px',
              background: 'transparent',
              border: '1px solid #2a2a2a',
              borderRadius: '8px',
              color: '#8b8b8b',
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}
