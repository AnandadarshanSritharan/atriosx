import React from 'react';
import api from '../../api/client';

export default function ReportsPage() {
  const downloadReport = async (endpoint: string, filename: string) => {
    try {
      const res = await api.get(endpoint, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  return (
    <div style={{ padding: '24px', background: '#0a0a0a', minHeight: '100vh', color: '#ffffff', fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 8px 0' }}>Business Analytics & Reports</h1>
        <p style={{ color: '#6b6b6b', margin: 0, fontSize: '0.9rem' }}>Overview of available reports</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '24px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#c0c0c0', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '16px' }}>Quick Stats Summary</div>
          <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem' }}>Review daily performance metrics and track financial goals quickly.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
            <a href="/admin/finance" style={{ color: '#c0c0c0', textDecoration: 'underline', fontSize: '0.9rem' }}>Go to detailed finance pages</a>
          </div>
        </div>
      </div>

      <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 16px 0' }}>Data Exports</h3>
        <p style={{ color: '#6b6b6b', fontSize: '0.9rem', marginBottom: '24px' }}>Download official Excel spreadsheets for your records.</p>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <button 
            style={{ padding: '10px 20px', background: '#161616', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#ffffff', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}
            onClick={() => downloadReport('/reports/export/bookings', 'Bookings-Report')}
          >
            Export Bookings (Excel)
          </button>
          <button 
            style={{ padding: '10px 20px', background: '#161616', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#ffffff', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}
            onClick={() => downloadReport('/reports/export/expenses', 'Expenses-Report')}
          >
            Export Expenses (Excel)
          </button>
          <button 
            style={{ padding: '10px 20px', background: '#161616', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#ffffff', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}
            onClick={() => downloadReport('/reports/export/profit', 'Profit-Distribution')}
          >
            Export Profit Distribution (Excel)
          </button>
        </div>
      </div>
    </div>
  );
}
