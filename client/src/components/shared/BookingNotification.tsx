import { useEffect, useRef, useState, useCallback } from 'react';
import { bookingsApi } from '@/api/bookings';
import { useAuth } from '@/hooks/useAuth';
import { X, Bell } from 'lucide-react';

interface NewBookingToast {
  id: string;
  bookingNumber: string;
  customerName: string;
  facilityName: string;
  date: string;
  startTime: string;
}

// Generate a pleasant 3-tone chime using Web Audio API
function playBookingChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 major chord arpeggio

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.18);

      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.18);
      gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + i * 0.18 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.5);

      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 0.55);
    });

    // Second wave — louder repeat after 0.7s
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + 0.7 + i * 0.18);

      gain.gain.setValueAtTime(0, ctx.currentTime + 0.7 + i * 0.18);
      gain.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 0.7 + i * 0.18 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7 + i * 0.18 + 0.6);

      osc.start(ctx.currentTime + 0.7 + i * 0.18);
      osc.stop(ctx.currentTime + 0.7 + i * 0.18 + 0.65);
    });

    // Auto-close context after sound finishes
    setTimeout(() => ctx.close(), 3000);
  } catch {
    // Silently ignore if AudioContext not supported
  }
}

const POLL_INTERVAL = 10_000; // 10 seconds

export function BookingNotificationProvider() {
  const { isAuthenticated } = useAuth();
  const lastKnownIdRef = useRef<string | null>(null);
  const initializedRef = useRef(false);
  const [toasts, setToasts] = useState<NewBookingToast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const poll = useCallback(async () => {
    try {
      const res = await bookingsApi.getLatestBooking();
      const data = res.data?.data;
      if (!data) return;

      const id = String(data._id);

      // First poll — just record current latest, don't notify
      if (!initializedRef.current) {
        lastKnownIdRef.current = id;
        initializedRef.current = true;
        return;
      }

      // New booking detected
      if (id !== lastKnownIdRef.current) {
        lastKnownIdRef.current = id;
        playBookingChime();

        const toast: NewBookingToast = {
          id: `${id}-${Date.now()}`,
          bookingNumber: data.bookingNumber,
          customerName: data.customerName,
          facilityName: data.facilityName,
          date: data.date,
          startTime: data.startTime,
        };

        setToasts(prev => [toast, ...prev].slice(0, 5)); // max 5 toasts

        // Auto-dismiss after 8 seconds
        setTimeout(() => dismissToast(toast.id), 8000);
      }
    } catch {
      // silently ignore poll errors (e.g. token expired)
    }
  }, [dismissToast]);

  useEffect(() => {
    if (!isAuthenticated) return;

    poll(); // immediate first call
    const interval = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [isAuthenticated, poll]);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      pointerEvents: 'none',
    }}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          style={{
            pointerEvents: 'all',
            background: '#111111',
            border: '1px solid #2a2a2a',
            borderLeft: '4px solid #c0c0c0',
            borderRadius: '12px',
            padding: '16px 20px',
            minWidth: '320px',
            maxWidth: '380px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(192,192,192,0.1)',
            animation: 'slideInRight 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
            display: 'flex',
            gap: '14px',
            alignItems: 'flex-start',
          }}
        >
          {/* Bell icon */}
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(192,192,192,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Bell size={20} color="#c0c0c0" />
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: '#c0c0c0',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '4px',
            }}>
              🎮 New Booking!
            </div>
            <div style={{
              fontSize: '0.95rem',
              fontWeight: 800,
              color: '#ffffff',
              marginBottom: '4px',
            }}>
              {toast.bookingNumber}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#8b8b8b', lineHeight: 1.5 }}>
              <span style={{ color: '#c0c0c0', fontWeight: 600 }}>{toast.customerName}</span>
              <br />
              {toast.facilityName} · {toast.date} at {toast.startTime}
            </div>
          </div>

          {/* Dismiss */}
          <button
            onClick={() => dismissToast(toast.id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#4b4b4b',
              padding: '2px',
              flexShrink: 0,
              lineHeight: 1,
            }}
          >
            <X size={16} />
          </button>
        </div>
      ))}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
