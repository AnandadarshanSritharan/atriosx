import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { partnersApi } from '@/api/partners';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

const COLORS = ['#c0c0c0', '#3d85c8', '#2d7a4f', '#d4a017', '#9b59b6', '#e67e22'];

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  initialInvestment: '',
  ownershipPercentage: '',
  percentageType: 'calculated' as 'calculated' | 'manual',
  notes: '',
  joinDate: new Date().toISOString().slice(0, 10),
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 14px',
  background: '#0a0a0a',
  border: '1px solid #2a2a2a',
  borderRadius: '7px',
  color: '#ffffff',
  fontSize: '0.85rem',
  outline: 'none',
  colorScheme: 'dark',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8rem',
  color: '#c0c0c0',
  marginBottom: '6px',
  fontWeight: 600,
};

export default function PartnersPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: partnersRes } = useQuery({
    queryKey: ['partners'],
    queryFn: () => partnersApi.list().then(res => res.data),
  });

  const partners: any[] = partnersRes?.data || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => partnersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      closeModal();
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || 'Failed to create partner');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => partnersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      closeModal();
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || 'Failed to update partner');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => partnersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      setDeleteConfirmId(null);
    },
  });

  const openAdd = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setError('');
    setIsModalOpen(true);
  };

  const openEdit = (p: any) => {
    setEditingId(p._id);
    setFormData({
      name: p.name || '',
      email: p.email || '',
      phone: p.phone || '',
      initialInvestment: String(p.initialInvestment ?? 0),
      ownershipPercentage: String(p.ownershipPercentage ?? 0),
      percentageType: p.percentageType || 'calculated',
      notes: p.notes || '',
      joinDate: p.joinDate ? String(p.joinDate).slice(0, 10) : new Date().toISOString().slice(0, 10),
    });
    setError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(emptyForm);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      initialInvestment: Number(formData.initialInvestment) || 0,
      ownershipPercentage: Number(formData.ownershipPercentage) || 0,
      percentageType: formData.percentageType,
      notes: formData.notes,
      joinDate: formData.joinDate,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Pie chart data — only partners with ownershipPercentage > 0
  const pieData = partners.filter(p => (p.ownershipPercentage || 0) > 0).map(p => ({
    name: p.name,
    value: Number(p.ownershipPercentage || 0),
  }));

  return (
    <div style={{ padding: '32px', color: '#ffffff', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', marginBottom: '4px', letterSpacing: '-0.02em' }}>Partners</h1>
          <p style={{ color: '#6b6b6b', fontSize: '0.85rem' }}>Manage equity partners and investment records</p>
        </div>
        <button
          onClick={openAdd}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#c0c0c0', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}
        >
          <Plus size={16} /> Add Partner
        </button>
      </div>

      <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Partner Cards */}
        <div style={{ flex: '1 1 60%', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {partners.length === 0 && (
            <div style={{ color: '#4b4b4b', fontSize: '0.9rem', gridColumn: '1/-1', padding: '40px', textAlign: 'center', border: '1px dashed #2a2a2a', borderRadius: '12px' }}>
              No partners yet. Click "Add Partner" to get started.
            </div>
          )}
          {partners.map((p: any) => (
            <div key={p._id} style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '24px', position: 'relative' }}>
              {/* Edit / Delete buttons */}
              <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => openEdit(p)}
                  style={{ width: '30px', height: '30px', borderRadius: '6px', background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#c0c0c0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Edit partner"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => setDeleteConfirmId(p._id)}
                  style={{ width: '30px', height: '30px', borderRadius: '6px', background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#8b2020', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Delete partner"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 700, color: '#c0c0c0', flexShrink: 0 }}>
                  {p.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', marginBottom: '2px' }}>{p.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6b6b6b' }}>{p.email || '—'}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#6b6b6b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Equity</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#c0c0c0' }}>{Number(p.ownershipPercentage || 0).toFixed(2)}%</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#6b6b6b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Total Investment</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>Rs. {Number(p.totalInvestment || 0).toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#6b6b6b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Initial Investment</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>Rs. {Number(p.initialInvestment || 0).toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#6b6b6b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Phone</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff' }}>{p.phone || '—'}</div>
                </div>
                {p.notes && (
                  <div style={{ gridColumn: '1/-1' }}>
                    <div style={{ fontSize: '0.68rem', color: '#6b6b6b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Notes</div>
                    <div style={{ fontSize: '0.82rem', color: '#8b8b8b' }}>{p.notes}</div>
                  </div>
                )}
              </div>

              {/* Equity type badge */}
              <div style={{ marginTop: '16px' }}>
                <span style={{
                  padding: '3px 10px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 700,
                  background: p.percentageType === 'manual' ? '#1e3a5f' : '#1a2a1a',
                  color: p.percentageType === 'manual' ? '#64b5f6' : '#4caf50',
                  border: `1px solid ${p.percentageType === 'manual' ? '#1e3a5f' : '#2d7a4f40'}`,
                }}>
                  {p.percentageType === 'manual' ? 'Manual equity' : 'Calculated equity'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Equity Distribution Chart */}
        <div style={{ flex: '1 1 280px', minWidth: '260px', background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '24px', height: 'fit-content' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>Equity Distribution</h3>
          {pieData.length === 0 ? (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b4b4b', fontSize: '0.82rem', textAlign: 'center' }}>
              Set ownership percentages<br />to see distribution
            </div>
          ) : (
            <div style={{ height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={4}>
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#ffffff', fontSize: '0.8rem' }}
                    formatter={(val: any) => [`${Number(val).toFixed(2)}%`, 'Equity']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          {/* Legend */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            {partners.map((p: any, i: number) => (
              <div key={p._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                  <span style={{ fontSize: '0.8rem', color: '#c0c0c0' }}>{p.name}</span>
                </div>
                <span style={{ fontSize: '0.8rem', color: '#6b6b6b', fontWeight: 600 }}>{Number(p.ownershipPercentage || 0).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '16px', width: '100%', maxWidth: '520px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>{editingId ? 'Edit Partner' : 'Add Partner'}</h2>
              <button onClick={closeModal} style={{ background: 'transparent', border: 'none', color: '#6b6b6b', cursor: 'pointer', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: '#1a0808', border: '1px solid #5a1a1a', borderRadius: '8px', color: '#ff6b6b', fontSize: '0.82rem', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={labelStyle}>Name *</label>
                  <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={inputStyle} placeholder="Partner name" />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={inputStyle} placeholder="email@example.com" />
                </div>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} style={inputStyle} placeholder="+94 77 ..." />
                </div>
                <div>
                  <label style={labelStyle}>Initial Investment (Rs.)</label>
                  <input type="number" min="0" value={formData.initialInvestment} onChange={e => setFormData({ ...formData, initialInvestment: e.target.value })} style={inputStyle} placeholder="0" />
                </div>
                <div>
                  <label style={labelStyle}>Join Date</label>
                  <input type="date" value={formData.joinDate} onChange={e => setFormData({ ...formData, joinDate: e.target.value })} style={{ ...inputStyle, colorScheme: 'dark' }} />
                </div>

                {/* Equity type */}
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={labelStyle}>Equity Type</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {(['calculated', 'manual'] as const).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({ ...formData, percentageType: type })}
                        style={{
                          flex: 1, padding: '9px', borderRadius: '7px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                          background: formData.percentageType === type ? '#2a2a2a' : 'transparent',
                          border: `1px solid ${formData.percentageType === type ? '#c0c0c0' : '#2a2a2a'}`,
                          color: formData.percentageType === type ? '#ffffff' : '#6b6b6b',
                        }}
                      >
                        {type === 'calculated' ? 'Auto-calculated from investment' : 'Manual percentage'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Manual equity percentage */}
                {formData.percentageType === 'manual' && (
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={labelStyle}>Ownership Percentage (%)</label>
                    <input type="number" min="0" max="100" step="0.01" value={formData.ownershipPercentage} onChange={e => setFormData({ ...formData, ownershipPercentage: e.target.value })} style={inputStyle} placeholder="e.g. 25" />
                  </div>
                )}

                <div style={{ gridColumn: '1/-1' }}>
                  <label style={labelStyle}>Notes</label>
                  <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Optional notes..." />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={closeModal} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#c0c0c0', fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem' }}>
                  Cancel
                </button>
                <button type="submit" disabled={isLoading} style={{ padding: '10px 20px', background: isLoading ? '#666' : '#c0c0c0', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer', fontSize: '0.82rem' }}>
                  {isLoading ? 'Saving...' : (editingId ? 'Update Partner' : 'Add Partner')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirmId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '32px', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⚠️</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#ffffff' }}>Delete Partner?</h3>
            <p style={{ color: '#6b6b6b', fontSize: '0.85rem', marginBottom: '24px' }}>
              This action is permanent and cannot be undone. All partner data will be removed.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => setDeleteConfirmId(null)} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#c0c0c0', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button
                onClick={() => deleteMutation.mutate(deleteConfirmId)}
                disabled={deleteMutation.isPending}
                style={{ padding: '10px 20px', background: '#8b2020', border: 'none', borderRadius: '8px', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
