import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Printer, RotateCcw, Home } from 'lucide-react';

export default function BookingConfirmation({ booking, onReset }: { booking: any; onReset: () => void }) {
  const facilityName = booking.facility?.name || booking.facilityName || 'Entertainment Experience';
  const duration = booking.durationMinutes || booking.duration || 60;
  const customerName = booking.customer?.name || booking.customerName || booking.name || 'Valued Guest';
  const customerPhone = booking.customer?.phone || booking.customerPhone || booking.phone;

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', background: '#111111', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '40px 32px', textAlign: 'center', color: '#ffffff' }}>
      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#2d7a4f20', border: '1px solid #2d7a4f50', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <CheckCircle2 size={32} color="#2d7a4f" />
      </div>

      <div style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2d7a4f', marginBottom: '8px' }}>
        Booking Confirmed
      </div>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '8px' }}>
        You're All Set!
      </h2>
      <p style={{ color: '#8b8b8b', fontSize: '0.88rem', marginBottom: '32px' }}>
        Your booking has been reserved. Please show your reference on arrival.
      </p>

      {/* Booking Ticket Card */}
      <div style={{ background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '24px', textAlign: 'left', marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid #1a1a1a', marginBottom: '16px' }}>
          <span style={{ fontSize: '0.72rem', color: '#6b6b6b', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Reference No.</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#c0c0c0', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
            {booking.bookingNumber || 'ATR-CONFIRMED'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#4b4b4b', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Experience</div>
            <div style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 700 }}>{facilityName}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#4b4b4b', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Date & Time</div>
            <div style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 700 }}>{booking.date} at {booking.startTime}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#4b4b4b', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Duration</div>
            <div style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 700 }}>{duration} Minutes</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#4b4b4b', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Players / Group</div>
            <div style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 700 }}>
              {booking.personCount || 1} {Number(booking.personCount || 1) > 1 ? 'Players' : 'Player'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#4b4b4b', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Guest Name</div>
            <div style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 700 }}>{customerName}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#4b4b4b', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Estimated Total</div>
            <div style={{ fontSize: '0.9rem', color: '#2d7a4f', fontWeight: 800 }}>
              Rs. {(booking.total || booking.totalAmount || 0).toLocaleString()}
            </div>
          </div>
        </div>

        {booking.preferredGame && (
          <div style={{ paddingBottom: '16px', borderBottom: '1px solid #1a1a1a', marginBottom: '16px' }}>
            <div style={{ fontSize: '0.7rem', color: '#4b4b4b', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Preferred Game</div>
            <div style={{ fontSize: '0.9rem', color: '#c0c0c0', fontWeight: 700 }}>🎮 {booking.preferredGame}</div>
          </div>
        )}

        {customerPhone && (
          <div style={{ paddingBottom: '16px', borderBottom: '1px solid #1a1a1a', marginBottom: '16px' }}>
            <div style={{ fontSize: '0.7rem', color: '#4b4b4b', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Phone</div>
            <div style={{ fontSize: '0.85rem', color: '#c0c0c0' }}>{customerPhone}</div>
          </div>
        )}

        <div style={{ background: '#3d85c815', border: '1px solid #3d85c840', borderRadius: '8px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: '#3d85c8', fontWeight: 700 }}>Payment Method</span>
          <span style={{ fontSize: '0.78rem', color: '#3d85c8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pay at Venue</span>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => window.print()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '11px 20px',
            background: 'transparent',
            border: '1px solid #2a2a2a',
            borderRadius: '8px',
            color: '#c0c0c0',
            fontWeight: 600,
            fontSize: '0.82rem',
            cursor: 'pointer',
          }}
        >
          <Printer size={15} /> Print
        </button>

        <button
          onClick={onReset}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '11px 20px',
            background: '#161616',
            border: '1px solid #2a2a2a',
            borderRadius: '8px',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '0.82rem',
            cursor: 'pointer',
          }}
        >
          <RotateCcw size={15} /> Book Another
        </button>

        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '11px 24px',
            background: '#c0c0c0',
            border: 'none',
            borderRadius: '8px',
            color: '#000000',
            fontWeight: 700,
            fontSize: '0.82rem',
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          <Home size={15} /> Return Home
        </Link>
      </div>
    </div>
  );
}
