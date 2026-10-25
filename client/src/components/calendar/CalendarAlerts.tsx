import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle2, Clock, X, Volume2, VolumeX, Eye } from 'lucide-react';
import { format } from 'date-fns';

export interface BookingAlertItem {
  id: string;
  bookingId: string;
  type: '5min' | 'finished';
  facilityName: string;
  customerName: string;
  bookingNumber: string;
  timeRange: string;
  minutesRemaining?: number;
  timestamp: number;
  bookingData: any;
}

// Browser Web Audio chime synthesizer (zero dependencies, zero external files)
function playAlertChime(type: '5min' | 'finished') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    if (type === '5min') {
      // 2 gentle ascending tones (587Hz -> 880Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.16);
      gain2.gain.setValueAtTime(0.18, now + 0.16);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.16);
      osc2.stop(now + 0.5);
    } else {
      // 3 alert tones (880Hz -> 659Hz -> 880Hz)
      const freqs = [880, 659.25, 880];
      freqs.forEach((freq, idx) => {
        const t = now + idx * 0.14;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.25);
      });
    }
  } catch (err) {
    console.debug('Audio chime skipped:', err);
  }
}

interface CalendarAlertsProps {
  events: any[];
  onOpenBooking: (booking: any) => void;
}

export default function CalendarAlerts({ events, onOpenBooking }: CalendarAlertsProps) {
  const [activeAlerts, setActiveAlerts] = useState<BookingAlertItem[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const alertedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const checkBookings = () => {
      const now = new Date();
      const todayStr = format(now, 'yyyy-MM-dd');
      const nowMs = now.getTime();

      const newAlerts: BookingAlertItem[] = [];

      for (const ev of events || []) {
        const ext = ev.extendedProps || {};
        const b = ext.booking || {};
        const status = ext.status || b.status;

        // Only alert for active/confirmed/ongoing bookings
        if (status === 'cancelled' || status === 'no_show' || status === 'completed') {
          continue;
        }

        const dateStr = b.date || ev.start?.split('T')[0];
        const endTimeStr = b.endTime || ext.endTime;
        if (dateStr !== todayStr || !endTimeStr) {
          continue;
        }

        // Parse end time on today
        const endIso = `${dateStr}T${endTimeStr}:00`;
        const endMs = new Date(endIso).getTime();
        if (isNaN(endMs)) continue;

        const diffMinutes = (endMs - nowMs) / 60000;
        const bookingId = b._id || ev.id;
        const bookingNum = ext.bookingNumber || b.bookingNumber || 'ATR-Booking';
        const facilityName = ext.facility?.name || b.facility?.name || 'Station';
        const customerName = ext.customerName || ext.customer?.name || b.customer?.name || 'Walk-in Guest';
        const timeRange = `${b.startTime || ext.startTime || ''} – ${endTimeStr}`;

        // 1. 5-Minute Warning: between 0 and 5 minutes remaining
        if (diffMinutes > 0 && diffMinutes <= 5) {
          const alertKey = `${bookingId}_5min`;
          if (!alertedIdsRef.current.has(alertKey)) {
            alertedIdsRef.current.add(alertKey);
            const alertItem: BookingAlertItem = {
              id: alertKey,
              bookingId,
              type: '5min',
              facilityName,
              customerName,
              bookingNumber: bookingNum,
              timeRange,
              minutesRemaining: Math.ceil(diffMinutes),
              timestamp: Date.now(),
              bookingData: b._id ? b : { ...ext, id: bookingId },
            };
            newAlerts.push(alertItem);
            if (soundEnabled) playAlertChime('5min');
          }
        }

        // 2. Session Finished Alert: ended within the last 5 minutes (diffMinutes <= 0 && >= -5)
        if (diffMinutes <= 0 && diffMinutes >= -5) {
          const alertKey = `${bookingId}_finished`;
          if (!alertedIdsRef.current.has(alertKey)) {
            alertedIdsRef.current.add(alertKey);
            const alertItem: BookingAlertItem = {
              id: alertKey,
              bookingId,
              type: 'finished',
              facilityName,
              customerName,
              bookingNumber: bookingNum,
              timeRange,
              timestamp: Date.now(),
              bookingData: b._id ? b : { ...ext, id: bookingId },
            };
            newAlerts.push(alertItem);
            if (soundEnabled) playAlertChime('finished');
          }
        }
      }

      if (newAlerts.length > 0) {
        setActiveAlerts(prev => [...newAlerts, ...prev].slice(0, 5)); // Keep max 5 visible
      }
    };

    // Run check immediately, then every 10 seconds
    checkBookings();
    const interval = setInterval(checkBookings, 10000);
    return () => clearInterval(interval);
  }, [events, soundEnabled]);

  const dismissAlert = (id: string) => {
    setActiveAlerts(prev => prev.filter(a => a.id !== id));
  };

  if (activeAlerts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      maxWidth: '380px',
      width: 'calc(100vw - 48px)',
      pointerEvents: 'none',
    }}>
      {/* Sound toggle header */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        pointerEvents: 'auto',
      }}>
        <button
          type="button"
          onClick={() => setSoundEnabled(v => !v)}
          title={soundEnabled ? 'Mute alert chimes' : 'Enable alert chimes'}
          style={{
            background: '#161616',
            border: '1px solid #2a2a2a',
            borderRadius: '6px',
            padding: '4px 8px',
            color: soundEnabled ? '#c0c0c0' : '#6b6b6b',
            fontSize: '0.7rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
          <span>{soundEnabled ? 'Chime On' : 'Chime Muted'}</span>
        </button>
      </div>

      {activeAlerts.map(alert => {
        const is5Min = alert.type === '5min';
        const borderColor = is5Min ? '#d4a017' : '#ff453a';
        const bgColor = is5Min ? '#141108' : '#140909';
        const badgeBg = is5Min ? 'rgba(212, 160, 23, 0.15)' : 'rgba(255, 69, 58, 0.15)';
        const badgeText = is5Min ? '#f5b82e' : '#ff453a';

        return (
          <div
            key={alert.id}
            style={{
              background: bgColor,
              border: `1px solid ${borderColor}`,
              borderRadius: '12px',
              padding: '14px 16px',
              boxShadow: `0 8px 24px rgba(0,0,0,0.6), 0 0 14px ${is5Min ? 'rgba(212,160,23,0.25)' : 'rgba(255,69,58,0.25)'}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              pointerEvents: 'auto',
              animation: 'slideInRight 0.25s ease-out',
            }}
          >
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {is5Min ? (
                  <AlertTriangle size={18} color="#f5b82e" style={{ flexShrink: 0 }} />
                ) : (
                  <CheckCircle2 size={18} color="#ff453a" style={{ flexShrink: 0 }} />
                )}
                <span style={{
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  color: is5Min ? '#f5b82e' : '#ff6b61',
                  letterSpacing: '0.02em',
                }}>
                  {is5Min ? '5 Minutes Remaining!' : 'Session Time Finished!'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => dismissAlert(alert.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#6b6b6b',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Dismiss"
              >
                <X size={15} />
              </button>
            </div>

            {/* Content Details */}
            <div style={{
              background: '#0a0a0a',
              border: '1px solid #222222',
              borderRadius: '8px',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff' }}>
                  {alert.facilityName}
                </span>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: badgeBg,
                  color: badgeText,
                  letterSpacing: '0.04em',
                }}>
                  {is5Min ? `${alert.minutesRemaining || 5}m left` : 'Finished'}
                </span>
              </div>

              <div style={{ fontSize: '0.76rem', color: '#c0c0c0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{alert.customerName}</span>
                <span style={{ color: '#4b4b4b' }}>•</span>
                <span style={{ color: '#8b8b8b' }}>{alert.bookingNumber}</span>
              </div>

              <div style={{ fontSize: '0.72rem', color: '#6b6b6b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <Clock size={11} />
                <span>{alert.timeRange}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => dismissAlert(alert.id)}
                style={{
                  padding: '6px 12px',
                  background: 'transparent',
                  border: '1px solid #2a2a2a',
                  borderRadius: '6px',
                  color: '#8b8b8b',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenBooking(alert.bookingData);
                  dismissAlert(alert.id);
                }}
                style={{
                  padding: '6px 14px',
                  background: is5Min ? '#d4a017' : '#ff453a',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#000000',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <Eye size={12} />
                <span>View Details</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
