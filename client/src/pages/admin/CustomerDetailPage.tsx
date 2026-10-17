import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { customersApi } from '../../api/customers';
import type { Booking } from '../../types';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: res, isLoading } = useQuery({
    queryKey: ['customer-detail', id],
    queryFn: () => customersApi.get(id!).then(r => r.data),
    enabled: !!id,
  });

  const customer = res?.data?.customer;
  const bookings = res?.data?.bookings || [];

  if (isLoading) {
    return <div style={{ padding: '24px', color: '#6b6b6b', background: '#0a0a0a', minHeight: '100vh' }}>Loading...</div>;
  }

  if (!customer) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#6b6b6b', background: '#0a0a0a', minHeight: '100vh' }}>
        Customer profile not found.
        <div style={{ marginTop: '16px' }}>
          <button style={{ padding: '10px 20px', background: '#c0c0c0', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }} onClick={() => navigate('/admin/customers')}>Back</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', background: '#0a0a0a', minHeight: '100vh', color: '#ffffff', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 8px 0' }}>{customer.name}</h1>
          <p style={{ color: '#6b6b6b', margin: 0, fontSize: '0.9rem' }}>Registered Customer</p>
        </div>
        <button style={{ padding: '10px 20px', background: '#111111', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#ffffff', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }} onClick={() => navigate('/admin/customers')}>
          Back to Customers
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '24px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#c0c0c0', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '16px' }}>Customer Info</div>
          <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem' }}><strong>Phone:</strong> {customer.phone}</p>
          <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem' }}><strong>Email:</strong> {customer.email || 'N/A'}</p>
          <p style={{ margin: 0, fontSize: '0.9rem' }}><strong>Notes:</strong> {customer.notes || 'None'}</p>
        </div>
        <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '24px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#c0c0c0', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '16px' }}>Stats</div>
          <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem' }}><strong>Total Bookings:</strong> {customer.totalBookings || bookings.length}</p>
          <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem' }}><strong>Total Spent:</strong> Rs. {customer.totalSpent || 0}</p>
          <p style={{ margin: 0, fontSize: '0.9rem' }}><strong>Favorite Facility:</strong> {customer.favoriteFacility || 'N/A'}</p>
        </div>
      </div>

      <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 16px 0' }}>Booking History</h3>
        <div style={{ overflowX: 'auto', border: '1px solid #2a2a2a', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#4b4b4b', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', background: '#0d0d0d', borderBottom: '1px solid #2a2a2a' }}>Booking #</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#4b4b4b', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', background: '#0d0d0d', borderBottom: '1px solid #2a2a2a' }}>Facility</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#4b4b4b', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', background: '#0d0d0d', borderBottom: '1px solid #2a2a2a' }}>Date</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#4b4b4b', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', background: '#0d0d0d', borderBottom: '1px solid #2a2a2a' }}>Time</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#4b4b4b', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', background: '#0d0d0d', borderBottom: '1px solid #2a2a2a' }}>Amount</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#4b4b4b', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', background: '#0d0d0d', borderBottom: '1px solid #2a2a2a' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b: Booking) => (
                <tr key={b._id} style={{ borderBottom: '1px solid #2a2a2a' }}>
                  <td style={{ padding: '12px 16px', color: '#ffffff' }}>{b.bookingNumber}</td>
                  <td style={{ padding: '12px 16px', color: '#ffffff' }}>{(b.facility as any)?.name || 'Facility'}</td>
                  <td style={{ padding: '12px 16px', color: '#ffffff' }}>{b.date}</td>
                  <td style={{ padding: '12px 16px', color: '#ffffff' }}>{b.startTime} - {b.endTime}</td>
                  <td style={{ padding: '12px 16px', color: '#ffffff' }}>Rs. {b.total}</td>
                  <td style={{ padding: '12px 16px', color: '#ffffff', textTransform: 'capitalize' }}>{b.status === 'confirmed' ? 'Ongoing' : (b.status === 'no_show' ? 'No Show' : b.status)}</td>
                </tr>
              ))}
              {!bookings.length && (
                <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#6b6b6b' }}>No booking history recorded.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
