import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditLogsApi } from '../../api/auditLogs';
import type { AuditLog } from '../../types';

export default function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const { data: logsRes, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => auditLogsApi.list().then(r => r.data),
  });

  const logs = logsRes?.data || [];
  const filteredLogs = logs.filter((log: AuditLog) => 
    log.action.toLowerCase().includes(search.toLowerCase()) || 
    (log.userName || '').toLowerCase().includes(search.toLowerCase()) || 
    log.entity.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '24px', background: '#0a0a0a', minHeight: '100vh', color: '#ffffff', fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 8px 0' }}>Audit Logs</h1>
        <p style={{ color: '#6b6b6b', margin: 0, fontSize: '0.9rem' }}>Track all administrative actions</p>
      </div>

      <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '24px' }}>
        <div style={{ marginBottom: '16px', maxWidth: '400px' }}>
          <input 
            placeholder="Search logs..." 
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
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#4b4b4b', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', background: '#0d0d0d', borderBottom: '1px solid #2a2a2a' }}>Timestamp</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#4b4b4b', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', background: '#0d0d0d', borderBottom: '1px solid #2a2a2a' }}>User</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#4b4b4b', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', background: '#0d0d0d', borderBottom: '1px solid #2a2a2a' }}>Action</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#4b4b4b', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', background: '#0d0d0d', borderBottom: '1px solid #2a2a2a' }}>Entity</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#4b4b4b', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', background: '#0d0d0d', borderBottom: '1px solid #2a2a2a' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log: AuditLog) => (
                  <tr key={log._id || Math.random()} style={{ borderBottom: '1px solid #2a2a2a' }}>
                    <td style={{ padding: '12px 16px', color: '#ffffff' }}>{new Date(log.createdAt).toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', color: '#ffffff' }}>{log.userName || (log.user as any)?.name || 'System'}</td>
                    <td style={{ padding: '12px 16px', color: '#ffffff' }}>{log.action}</td>
                    <td style={{ padding: '12px 16px', color: '#ffffff' }}>{log.entity}</td>
                    <td style={{ padding: '12px 16px', color: '#ffffff' }}>{log.description}</td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#6b6b6b' }}>No audit logs found.</td>
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
