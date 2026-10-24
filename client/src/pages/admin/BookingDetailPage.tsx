import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from '@/api/bookings';
import { useState } from 'react';
import { ArrowLeft, Phone, Mail, Calendar, Clock, DollarSign, User, CheckCircle2, XCircle, AlertCircle, Edit2, Trash2 } from 'lucide-react';

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  confirmed:  { bg: '#3d85c815', text: '#3d85c8', border: '#3d85c840' },
  pending:    { bg: '#d4a01715', text: '#d4a017', border: '#d4a01740' },
  completed:  { bg: '#2d7a4f15', text: '#2d7a4f', border: '#2d7a4f40' },
  cancelled:  { bg: '#5a5a5a15', text: '#5a5a5a', border: '#5a5a5a40' },
  no_show:    { bg: '#8b202015', text: '#8b2020', border: '#8b202040' },
  'no-show':  { bg: '#8b202015', text: '#8b2020', border: '#8b202040' },
};

const ALL_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];

function InfoRow({ label, value, icon: Icon }: { label: string; value: any; icon?: any }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 0', borderBottom: '1px solid #1a1a1a' }}>
      {Icon && <Icon size={15} color="#6b6b6b" style={{ marginTop: '2px', flexShrink: 0 }} />}
      <div>
        <div style={{ fontSize: '0.7rem', color: '#4b4b4b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 600 }}>{value || '—'}</div>
      </div>
    </div>
  );
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [notes, setNotes] = useState('');
  const [editNotes, setEditNotes] = useState(false);

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingsApi.getById(id!).then(r => r.data.data),
    enabled: !!id,
  });

  const { mutate: updateStatus, isPending: updatingStatus } = useMutation({
    mutationFn: ({ status }: { status: string }) => bookingsApi.updateStatus(id!, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['booking', id] }); qc.invalidateQueries({ queryKey: ['bookings'] }); },
  });

  const { mutate: checkIn } = useMutation({
    mutationFn: () => bookingsApi.checkIn(id!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['booking', id] }),
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { mutate: deleteBooking, isPending: isDeleting } = useMutation({
    mutationFn: () => bookingsApi.delete(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['calendar'] });
      navigate('/admin/bookings');
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Failed to delete booking');
    },
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {[1,2,3].map(i => <div key={i} style={{ height: '120px', background: '#111111', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />)}
      </div>
    );
  }

  if (!booking) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px', color: '#6b6b6b' }}>
        <p style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Booking not found</p>
        <button onClick={() => navigate(-1)} style={{ color: '#c0c0c0', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>← Go Back</button>
      </div>
    );
  }

  const SC = STATUS_COLORS[booking.status] || { bg: '#2a2a2a', text: '#6b6b6b', border: '#2a2a2a' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1100px' }}>
      {/* Back + Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#111111', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#8b8b8b', padding: '8px 14px', cursor: 'pointer', fontSize: '0.8rem' }}>
          <ArrowLeft size={14} /> Back
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', fontFamily: 'monospace' }}>{booking.bookingNumber}</h1>
            <span style={{ padding: '4px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, background: SC.bg, color: SC.text, border: `1px solid ${SC.border}`, textTransform: 'capitalize' }}>{booking.status === 'confirmed' ? 'Ongoing' : booking.status.replace(/[-_]/g, ' ')}</span>
          </div>
          <p style={{ color: '#6b6b6b', fontSize: '0.8rem', marginTop: '4px' }}>Created: {booking.createdAt ? new Date(booking.createdAt).toLocaleString('en-LK') : '—'}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
        {/* Main Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Customer */}
          <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#c0c0c0', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '16px' }}>Customer Details</h3>
            <InfoRow label="Full Name" value={booking.customer?.name || booking.name} icon={User} />
            <InfoRow label="Phone" value={booking.customer?.phone || booking.phone} icon={Phone} />
            {(booking.customer?.email || booking.email) && <InfoRow label="Email" value={booking.customer?.email || booking.email} icon={Mail} />}
            {(booking.bookingSource || booking.source) && <InfoRow label="Booking Source" value={<span style={{ textTransform: 'capitalize' }}>{booking.bookingSource || booking.source}</span>} />}
          </div>

          {/* Booking */}
          <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#c0c0c0', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '16px' }}>Booking Details</h3>
            <InfoRow label="Facility" value={booking.facility?.name} icon={CheckCircle2} />
            <InfoRow label="Date" value={booking.date} icon={Calendar} />
            <InfoRow label="Time" value={`${booking.startTime} – ${booking.endTime}`} icon={Clock} />
            <InfoRow label="Duration" value={`${booking.durationMinutes ?? booking.duration} minutes`} />
            <InfoRow label="Rate (at booking)" value={`Rs. ${booking.rateSnapshot?.toLocaleString() || booking.facility?.hourlyRate?.toLocaleString()}/hr`} icon={DollarSign} />
            <InfoRow label="Total Amount" value={<span style={{ fontSize: '1.1rem', color: '#ffffff', fontWeight: 800 }}>Rs. {(booking.total ?? booking.totalAmount ?? 0).toLocaleString()}</span>} icon={DollarSign} />
            <InfoRow label="Payment" value={<span style={{ background: '#3d85c815', color: '#3d85c8', border: '1px solid #3d85c840', padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700 }}>Pay at Venue</span>} />
          </div>

          {/* Notes */}
          <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#c0c0c0', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Notes</h3>
              {!editNotes && <button onClick={() => { setNotes(booking.notes || ''); setEditNotes(true); }} style={{ background: 'none', border: 'none', color: '#8b8b8b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}><Edit2 size={12} /> Edit</button>}
            </div>
            {editNotes ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
                  style={{ width: '100%', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '10px 12px', color: '#ffffff', fontSize: '0.85rem', resize: 'vertical', outline: 'none' }} />
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button onClick={() => setEditNotes(false)} style={{ padding: '7px 14px', background: 'transparent', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#8b8b8b', cursor: 'pointer', fontSize: '0.8rem' }}>Cancel</button>
                  <button onClick={async () => { await bookingsApi.update(id!, { notes }); qc.invalidateQueries({ queryKey: ['booking', id] }); setEditNotes(false); }}
                    style={{ padding: '7px 14px', background: '#c0c0c0', border: 'none', borderRadius: '6px', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>Save</button>
                </div>
              </div>
            ) : (
              <p style={{ color: booking.notes ? '#c0c0c0' : '#4b4b4b', fontSize: '0.85rem', lineHeight: 1.7 }}>{booking.notes || 'No notes added.'}</p>
            )}
          </div>
        </div>

        {/* Sidebar — Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#c0c0c0', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '16px' }}>Update Status</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {ALL_STATUSES.map(s => {
                const sc = STATUS_COLORS[s];
                const isCurrentStatus = booking.status === s;
                return (
                  <button key={s} onClick={() => !isCurrentStatus && updateStatus({ status: s })}
                    disabled={isCurrentStatus || updatingStatus}
                    style={{
                      padding: '10px 16px', borderRadius: '8px', border: `1px solid ${isCurrentStatus ? sc.border : '#2a2a2a'}`,
                      background: isCurrentStatus ? sc.bg : 'transparent',
                      color: isCurrentStatus ? sc.text : '#8b8b8b',
                      fontWeight: isCurrentStatus ? 700 : 500, fontSize: '0.82rem',
                      textTransform: 'capitalize', cursor: isCurrentStatus ? 'default' : 'pointer',
                      textAlign: 'left', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (!isCurrentStatus) { (e.currentTarget as HTMLElement).style.borderColor = sc.border; (e.currentTarget as HTMLElement).style.color = sc.text; } }}
                    onMouseLeave={e => { if (!isCurrentStatus) { (e.currentTarget as HTMLElement).style.borderColor = '#2a2a2a'; (e.currentTarget as HTMLElement).style.color = '#8b8b8b'; } }}>
                    {isCurrentStatus ? '✓ ' : ''}{s === 'confirmed' ? 'Ongoing' : s.replace(/[-_]/g, ' ')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Check In */}
          {booking.status === 'confirmed' && !booking.checkedInAt && (
            <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '24px' }}>
              <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#c0c0c0', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '12px' }}>Check In</h3>
              <button onClick={() => checkIn()} style={{ width: '100%', padding: '12px', background: '#2d7a4f', border: 'none', borderRadius: '8px', color: '#ffffff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                ✓ Mark as Checked In
              </button>
            </div>
          )}

          {booking.checkedInAt && (
            <div style={{ background: '#2d7a4f15', border: '1px solid #2d7a4f40', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
              <CheckCircle2 size={20} color="#2d7a4f" style={{ margin: '0 auto 8px' }} />
              <p style={{ color: '#2d7a4f', fontSize: '0.8rem', fontWeight: 700 }}>Checked In</p>
              <p style={{ color: '#6b6b6b', fontSize: '0.72rem', marginTop: '4px' }}>{new Date(booking.checkedInAt).toLocaleString('en-LK')}</p>
            </div>
          )}

          {/* Facility Color */}
          {booking.facility?.calendarColor && (
            <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: booking.facility.calendarColor, flexShrink: 0 }} />
              <span style={{ fontSize: '0.8rem', color: '#8b8b8b' }}>{booking.facility.name}</span>
            </div>
          )}

          {/* Delete Cancelled Booking */}
          {booking.status === 'cancelled' && (
            <div style={{ background: '#111111', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
                Delete Cancelled Booking
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#8b8b8b', marginBottom: '14px', lineHeight: 1.5 }}>
                This booking is cancelled and can be permanently removed from the database.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                style={{
                  width: '100%',
                  padding: '9px 14px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: '7px',
                  color: '#ef4444',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = '#ef4444';
                  (e.currentTarget as HTMLElement).style.color = '#ffffff';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(239, 68, 68, 0.12)';
                  (e.currentTarget as HTMLElement).style.color = '#ef4444';
                }}
              >
                <Trash2 size={14} /> Delete Booking
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={() => !isDeleting && setShowDeleteModal(false)}
        >
          <div
            style={{
              background: '#111111',
              border: '1px solid #2a2a2a',
              borderRadius: '16px',
              maxWidth: '440px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.85)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Trash2 size={20} color="#ef4444" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Confirm Delete
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#8b8b8b', margin: '3px 0 0 0' }}>
                  This action cannot be undone
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.84rem', color: '#c0c0c0', marginBottom: '20px', lineHeight: 1.6 }}>
              Are you sure you want to permanently delete booking <strong style={{ color: '#ffffff', fontFamily: 'monospace' }}>{booking.bookingNumber}</strong> ({booking.customer?.name || booking.name || 'Customer'} on {booking.date})?
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                style={{
                  padding: '9px 16px',
                  background: 'transparent',
                  border: '1px solid #2a2a2a',
                  borderRadius: '7px',
                  color: '#c0c0c0',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={() => deleteBooking()}
                style={{
                  padding: '9px 18px',
                  background: '#dc2626',
                  border: 'none',
                  borderRadius: '7px',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: isDeleting ? 0.7 : 1,
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
