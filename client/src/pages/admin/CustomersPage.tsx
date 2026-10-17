import React, { useState } from 'react';
import { customersApi } from '@/api/customers';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const { data: res, isLoading } = useQuery({ 
    queryKey: ['customers', search], 
    queryFn: () => customersApi.list({ search }).then(r => r.data) 
  });
  const navigate = useNavigate();

  const customers = res?.data || [];

  return (
    <div style={{ padding: '24px', background: '#0a0a0a', minHeight: '100vh', color: '#ffffff', fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 8px 0' }}>Customers Database</h1>
        <p style={{ color: '#6b6b6b', margin: 0, fontSize: '0.9rem' }}>Manage your client profiles and histories</p>
      </div>

      <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '24px' }}>
        <div style={{ marginBottom: '16px', maxWidth: '400px' }}>
          <input 
            placeholder="Search by name or phone..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '7px', color: '#ffffff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        
        {isLoading ? (
          <div style={{ color: '#6b6b6b', padding: '20px', textAlign: 'center' }}>Loading...</div>
        ) : (
          <div style={{ overflowX: 'auto', border: '1px solid #2a2a2a', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#4b4b4b', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', background: '#0d0d0d', borderBottom: '1px solid #2a2a2a' }}>Name</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#4b4b4b', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', background: '#0d0d0d', borderBottom: '1px solid #2a2a2a' }}>Phone</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#4b4b4b', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', background: '#0d0d0d', borderBottom: '1px solid #2a2a2a' }}>Email</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#4b4b4b', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', background: '#0d0d0d', borderBottom: '1px solid #2a2a2a' }}>Total Bookings</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#4b4b4b', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', background: '#0d0d0d', borderBottom: '1px solid #2a2a2a' }}>Total Spent (Rs.)</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#4b4b4b', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', background: '#0d0d0d', borderBottom: '1px solid #2a2a2a' }}>Last Visit</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c: any) => (
                  <tr 
                    key={c._id} 
                    onClick={() => navigate(`/admin/customers/${c._id}`)}
                    style={{ cursor: 'pointer', borderBottom: '1px solid #2a2a2a' }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#161616'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 16px', color: '#ffffff' }}>{c.name}</td>
                    <td style={{ padding: '12px 16px', color: '#ffffff' }}>{c.phone}</td>
                    <td style={{ padding: '12px 16px', color: '#ffffff' }}>{c.email || 'N/A'}</td>
                    <td style={{ padding: '12px 16px', color: '#ffffff' }}>{c.totalBookings || 0}</td>
                    <td style={{ padding: '12px 16px', color: '#ffffff' }}>{c.totalSpent || 0}</td>
                    <td style={{ padding: '12px 16px', color: '#ffffff' }}>{c.lastVisit || 'N/A'}</td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#6b6b6b' }}>No customers found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
           <button style={{ padding: '6px 12px', background: '#161616', border: '1px solid #2a2a2a', borderRadius: '4px', color: '#ffffff', cursor: 'pointer' }}>Previous</button>
           <button style={{ padding: '6px 12px', background: '#161616', border: '1px solid #2a2a2a', borderRadius: '4px', color: '#ffffff', cursor: 'pointer' }}>Next</button>
        </div>
      </div>
    </div>
  );
}
