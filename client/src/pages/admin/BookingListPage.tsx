import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from '@/api/bookings';
import { facilitiesApi } from '@/api/facilities';
import { Search, Download, Calendar, ChevronLeft, ChevronRight, Eye, Trash2, AlertTriangle, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { EditBookingModal } from '@/components/booking/EditBookingModal';

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  confirmed:  { bg: '#3d85c815', text: '#3d85c8', border: '#3d85c840' },
  pending:    { bg: '#d4a01715', text: '#d4a017', border: '#d4a01740' },
  completed:  { bg: '#2d7a4f15', text: '#2d7a4f', border: '#2d7a4f40' },
  cancelled:  { bg: '#5a5a5a15', text: '#5a5a5a', border: '#5a5a5a40' },
  no_show:    { bg: '#8b202015', text: '#8b2020', border: '#8b202040' },
  'no-show':  { bg: '#8b202015', text: '#8b2020', border: '#8b202040' },
};

export default function BookingListPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [facilityId, setFacilityId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const { data: facilitiesData } = useQuery({
    queryKey: ['facilities-select'],
    queryFn: () => facilitiesApi.getAll().then(r => r.data.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', { search, status, facilityId, dateFrom, dateTo, page }],
    queryFn: () => bookingsApi.getAll({
      search: search || undefined,
      status: status || undefined,
      facilityId: facilityId || undefined,
      facility: facilityId || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      page,
      limit: PAGE_SIZE,
    }).then(r => r.data),
    placeholderData: (prev) => prev,
  });

  const [bookingToDelete, setBookingToDelete] = useState<any | null>(null);
  const [bookingToEdit, setBookingToEdit] = useState<any | null>(null);

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => bookingsApi.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['calendar'] });
    },
  });

  const { mutate: deleteBooking, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => bookingsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['calendar'] });
      setBookingToDelete(null);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Failed to delete booking');
    },
  });

  const bookings = data?.data || [];
  const total = data?.pagination?.total || data?.total || bookings.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleExport = async () => {
    try {
      const res = await bookingsApi.exportExcel({ search, status, facilityId, dateFrom, dateTo });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bookings-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) { console.error('Export failed', e); }
  };

  const SC = (s: string) => STATUS_COLORS[s] || { bg: '#2a2a2a', text: '#6b6b6b', border: '#2a2a2a' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', marginBottom: '4px', letterSpacing: '-0.02em' }}>Bookings</h1>
          <p style={{ color: '#6b6b6b', fontSize: '0.85rem' }}>{total} total booking{total !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => navigate('/admin/bookings/calendar')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#111111', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#c0c0c0', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
            <Calendar size={15} /> Calendar View
          </button>
          <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#111111', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#c0c0c0', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
            <Download size={15} /> Export Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b6b6b' }} />
          <input
            placeholder="Search customer, phone, booking#..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ width: '100%', paddingLeft: '34px', padding: '9px 12px 9px 34px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '7px', color: '#ffffff', fontSize: '0.82rem', outline: 'none' }}
          />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          style={{ padding: '9px 12px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '7px', color: status ? '#ffffff' : '#6b6b6b', fontSize: '0.82rem', outline: 'none', cursor: 'pointer' }}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Ongoing</option>
          <option value="completed">Completed</option>
          <option value="no_show">No Show</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={facilityId} onChange={e => { setFacilityId(e.target.value); setPage(1); }}
          style={{ padding: '9px 12px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '7px', color: facilityId ? '#ffffff' : '#6b6b6b', fontSize: '0.82rem', outline: 'none', cursor: 'pointer' }}>
          <option value="">All Facilities</option>
          {facilitiesData?.map((f: any) => <option key={f._id} value={f._id}>{f.name}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
          style={{ padding: '9px 12px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '7px', color: dateFrom ? '#ffffff' : '#6b6b6b', fontSize: '0.82rem', outline: 'none', colorScheme: 'dark' }} />
        <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
          style={{ padding: '9px 12px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '7px', color: dateTo ? '#ffffff' : '#6b6b6b', fontSize: '0.82rem', outline: 'none', colorScheme: 'dark' }} />
        {(search || status || facilityId || dateFrom || dateTo) && (
          <button onClick={() => { setSearch(''); setStatus(''); setFacilityId(''); setDateFrom(''); setDateTo(''); setPage(1); }}
            style={{ padding: '9px 14px', background: 'transparent', border: '1px solid #3a3a3a', borderRadius: '7px', color: '#8b8b8b', fontSize: '0.8rem', cursor: 'pointer' }}>
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1f1f1f' }}>
                {['Booking #', 'Customer', 'Phone', 'Facility', 'Date', 'Time', 'Duration', 'Amount', 'Status', 'Source', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#4b4b4b', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap', background: '#0d0d0d' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}><td colSpan={11} style={{ padding: '12px 16px' }}><div style={{ height: '20px', background: '#1a1a1a', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} /></td></tr>
                ))
              ) : bookings.length === 0 ? (
                <tr><td colSpan={11} style={{ padding: '60px', textAlign: 'center', color: '#4b4b4b' }}>No bookings found</td></tr>
              ) : bookings.map((b: any) => {
                const c = SC(b.status);
                const durationVal = b.durationMinutes ?? b.duration ?? 60;
                const totalVal = b.total ?? b.totalAmount ?? 0;
                const sourceVal = b.bookingSource || b.source || 'website';
                return (
                  <tr key={b._id} onClick={() => navigate(`/admin/bookings/${b._id}`)}
                    style={{ cursor: 'pointer', borderBottom: '1px solid #141414', transition: 'background 0.1s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#161616'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                    <td style={{ padding: '12px 16px', color: '#c0c0c0', fontWeight: 700, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{b.bookingNumber}</td>
                    <td style={{ padding: '12px 16px', color: '#ffffff', fontWeight: 600, whiteSpace: 'nowrap' }}>{b.customer?.name || b.name}</td>
                    <td style={{ padding: '12px 16px', color: '#8b8b8b', whiteSpace: 'nowrap' }}>{b.customer?.phone || b.phone}</td>
                    <td style={{ padding: '12px 16px', color: '#8b8b8b', whiteSpace: 'nowrap' }}>{b.facility?.name || '—'}</td>
                    <td style={{ padding: '12px 16px', color: '#8b8b8b', whiteSpace: 'nowrap' }}>{b.date}</td>
                    <td style={{ padding: '12px 16px', color: '#8b8b8b', whiteSpace: 'nowrap' }}>{b.startTime}–{b.endTime}</td>
                    <td style={{ padding: '12px 16px', color: '#8b8b8b', whiteSpace: 'nowrap' }}>{durationVal} min</td>
                    <td style={{ padding: '12px 16px', color: '#ffffff', fontWeight: 700, whiteSpace: 'nowrap' }}>Rs. {Number(totalVal).toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                      <select
                        value={b.status === 'no-show' ? 'no_show' : b.status}
                        onChange={e => updateStatus({ id: b._id, status: e.target.value })}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: c.bg,
                          color: c.text,
                          border: `1px solid ${c.border}`,
                          outline: 'none',
                          cursor: 'pointer',
                          textTransform: 'capitalize',
                        }}
                      >
                        <option value="pending" style={{ background: '#111111', color: '#ffffff' }}>Pending</option>
                        <option value="confirmed" style={{ background: '#111111', color: '#ffffff' }}>Ongoing</option>
                        <option value="completed" style={{ background: '#111111', color: '#ffffff' }}>Completed</option>
                        <option value="no_show" style={{ background: '#111111', color: '#ffffff' }}>No Show</option>
                        <option value="cancelled" style={{ background: '#111111', color: '#ffffff' }}>Cancelled</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#6b6b6b', fontSize: '0.72rem', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{sourceVal}</td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={() => navigate(`/admin/bookings/${b._id}`)}
                          title="View Details"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#6b6b6b',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            borderRadius: '4px',
                            transition: 'color 0.15s',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ffffff'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#6b6b6b'; }}
                        >
                          <Eye size={15} />
                        </button>
                        {(b.status === 'pending' || b.status === 'confirmed') && (
                          <button
                            onClick={() => setBookingToEdit(b)}
                            title="Edit Booking"
                            style={{
                              background: '#c0c0c015',
                              border: '1px solid #c0c0c030',
                              color: '#c0c0c0',
                              cursor: 'pointer',
                              padding: '4px 8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => {
                              (e.currentTarget as HTMLElement).style.background = '#c0c0c0';
                              (e.currentTarget as HTMLElement).style.color = '#000000';
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLElement).style.background = '#c0c0c015';
                              (e.currentTarget as HTMLElement).style.color = '#c0c0c0';
                            }}
                          >
                            <Pencil size={12} />
                            <span>Edit</span>
                          </button>
                        )}
                        {b.status === 'cancelled' && (
                          <button
                            onClick={() => setBookingToDelete(b)}
                            title="Delete Cancelled Booking"
                            style={{
                              background: 'rgba(239, 68, 68, 0.12)',
                              border: '1px solid rgba(239, 68, 68, 0.28)',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: '4px 8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
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
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderTop: '1px solid #1f1f1f' }}>
            <span style={{ fontSize: '0.8rem', color: '#6b6b6b' }}>
              Showing {((page-1)*PAGE_SIZE)+1}–{Math.min(page*PAGE_SIZE, total)} of {total}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                style={{ padding: '6px 12px', background: '#161616', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#c0c0c0', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}>
                <ChevronLeft size={14} />
              </button>
              <span style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#ffffff' }}>{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
                style={{ padding: '6px 12px', background: '#161616', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#c0c0c0', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1 }}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {bookingToDelete && (
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
          onClick={() => !isDeleting && setBookingToDelete(null)}
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
                <AlertTriangle size={20} color="#ef4444" />
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

            <div style={{
              background: '#161616',
              border: '1px solid #222222',
              borderRadius: '10px',
              padding: '14px 16px',
              marginBottom: '20px',
              fontSize: '0.8rem',
              lineHeight: 1.6,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#6b6b6b' }}>Booking ID:</span>
                <span style={{ color: '#ffffff', fontWeight: 700, fontFamily: 'monospace' }}>
                  {bookingToDelete.bookingNumber || bookingToDelete._id}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#6b6b6b' }}>Customer:</span>
                <span style={{ color: '#ffffff', fontWeight: 600 }}>
                  {bookingToDelete.customer?.name || bookingToDelete.name || '—'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#6b6b6b' }}>Date & Time:</span>
                <span style={{ color: '#ffffff' }}>
                  {bookingToDelete.date} ({bookingToDelete.startTime}–{bookingToDelete.endTime})
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b6b6b' }}>Status:</span>
                <span style={{ color: '#ef4444', fontWeight: 700, textTransform: 'capitalize' }}>
                  {bookingToDelete.status}
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#a0a0a0', marginBottom: '24px', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete this cancelled booking from the database?
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                disabled={isDeleting}
                onClick={() => setBookingToDelete(null)}
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
                onClick={() => deleteBooking(bookingToDelete._id)}
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

      {/* Edit Booking Modal */}
      {bookingToEdit && (
        <EditBookingModal
          isOpen={!!bookingToEdit}
          booking={bookingToEdit}
          facilities={facilitiesData}
          onClose={() => setBookingToEdit(null)}
        />
      )}
    </div>
  );
}
