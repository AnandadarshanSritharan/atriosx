import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { partnersApi } from '@/api/partners';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export default function PartnersPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', investmentAmount: '', joinDate: '' });

  const { data: partnersRes } = useQuery({
    queryKey: ['partners'],
    queryFn: () => partnersApi.list().then(res => res.data)
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => partnersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      setIsModalOpen(false);
    }
  });

  const partners = partnersRes?.data || [];
  const COLORS = ['#c0c0c0', '#888888', '#555555', '#333333', '#dddddd'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      investmentAmount: Number(formData.investmentAmount)
    });
  };

  return (
    <div style={{ padding: '32px', color: '#ffffff', minHeight: '100vh', background: '#0a0a0a' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', margin: 0 }}>Partners</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ padding: '10px 20px', background: '#c0c0c0', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}
        >
          Add Partner
        </button>
      </div>

      <div style={{ display: 'flex', gap: '32px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 60%', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {partners.map((p: any) => (
            <div key={p.id} style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 600, color: '#c0c0c0' }}>
                  {p.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>{p.name}</div>
                  <div style={{ fontSize: '0.85rem', color: '#6b6b6b' }}>{p.email}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#6b6b6b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Equity</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#c0c0c0' }}>{p.equity || 0}%</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#6b6b6b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Investment</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#ffffff' }}>${(p.investmentAmount || 0).toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#6b6b6b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Profit Share</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#c0c0c0' }}>${(p.profitShare || 0).toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#6b6b6b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Phone</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#ffffff' }}>{p.phone || 'N/A'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ flex: '1 1 30%', minWidth: '300px', background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '24px', height: 'fit-content' }}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: '1.1rem' }}>Equity Distribution</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={partners} dataKey="equity" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5}>
                  {partners.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: '8px' }} itemStyle={{ color: '#ffffff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '32px' }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '1.5rem' }}>Add Partner</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#c0c0c0', marginBottom: '8px' }}>Name</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '7px', color: '#ffffff', fontSize: '0.85rem', outline: 'none', colorScheme: 'dark' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#c0c0c0', marginBottom: '8px' }}>Email</label>
                <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '7px', color: '#ffffff', fontSize: '0.85rem', outline: 'none', colorScheme: 'dark' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#c0c0c0', marginBottom: '8px' }}>Phone</label>
                <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '7px', color: '#ffffff', fontSize: '0.85rem', outline: 'none', colorScheme: 'dark' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#c0c0c0', marginBottom: '8px' }}>Investment Amount ($)</label>
                <input type="number" required value={formData.investmentAmount} onChange={e => setFormData({...formData, investmentAmount: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '7px', color: '#ffffff', fontSize: '0.85rem', outline: 'none', colorScheme: 'dark' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#c0c0c0', marginBottom: '8px' }}>Join Date</label>
                <input type="date" required value={formData.joinDate} onChange={e => setFormData({...formData, joinDate: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '7px', color: '#ffffff', fontSize: '0.85rem', outline: 'none', colorScheme: 'dark' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#c0c0c0', fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 20px', background: '#c0c0c0', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}>Save Partner</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
