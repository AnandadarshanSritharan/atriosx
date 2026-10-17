import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../../api/users';
import type { User as UserType } from '../../types';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
  });

  const { data: usersRes, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => usersApi.list().then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'staff' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const users = usersRes?.data || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) return;
    createMutation.mutate(formData);
  };

  return (
    <div style={{ padding: '24px', background: '#0a0a0a', minHeight: '100vh', color: '#ffffff', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 8px 0' }}>Admin User Management</h1>
          <p style={{ color: '#6b6b6b', margin: 0, fontSize: '0.9rem' }}>Manage role-based access</p>
        </div>
        <button 
          style={{ padding: '10px 20px', background: '#c0c0c0', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}
          onClick={() => setIsModalOpen(true)}
        >
          Add User
        </button>
      </div>

      <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '24px' }}>
        {isLoading ? (
          <div style={{ color: '#6b6b6b', padding: '20px', textAlign: 'center' }}>Loading...</div>
        ) : (
          <div style={{ overflowX: 'auto', border: '1px solid #2a2a2a', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#4b4b4b', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', background: '#0d0d0d', borderBottom: '1px solid #2a2a2a' }}>Name</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#4b4b4b', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', background: '#0d0d0d', borderBottom: '1px solid #2a2a2a' }}>Email</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#4b4b4b', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', background: '#0d0d0d', borderBottom: '1px solid #2a2a2a' }}>Role</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#4b4b4b', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', background: '#0d0d0d', borderBottom: '1px solid #2a2a2a' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#4b4b4b', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', background: '#0d0d0d', borderBottom: '1px solid #2a2a2a' }}>Last Login</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#4b4b4b', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', background: '#0d0d0d', borderBottom: '1px solid #2a2a2a' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: UserType) => (
                  <tr key={u._id} style={{ borderBottom: '1px solid #2a2a2a' }}>
                    <td style={{ padding: '12px 16px', color: '#ffffff' }}>{u.name}</td>
                    <td style={{ padding: '12px 16px', color: '#ffffff' }}>{u.email}</td>
                    <td style={{ padding: '12px 16px', color: '#ffffff', textTransform: 'capitalize' }}>{u.role}</td>
                    <td style={{ padding: '12px 16px', color: '#ffffff' }}>Active</td>
                    <td style={{ padding: '12px 16px', color: '#ffffff' }}>{u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}</td>
                    <td style={{ padding: '12px 16px', color: '#ffffff' }}>
                      <button 
                        style={{ padding: '4px 8px', background: 'transparent', border: '1px solid #6b6b6b', borderRadius: '4px', color: '#ff6b6b', cursor: 'pointer' }}
                        onClick={() => {
                          if (confirm(`Remove access for ${u.name}?`)) deleteMutation.mutate(u._id);
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#6b6b6b' }}>No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px', width: '100%', maxWidth: '400px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 16px 0', color: '#ffffff' }}>Create Admin Account</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: '#6b6b6b' }}>Name</label>
                <input 
                  required
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  style={{ width: '100%', padding: '10px 14px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '7px', color: '#ffffff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: '#6b6b6b' }}>Email</label>
                <input 
                  type="email"
                  required
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  style={{ width: '100%', padding: '10px 14px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '7px', color: '#ffffff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: '#6b6b6b' }}>Password</label>
                <input 
                  type="password"
                  required
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  style={{ width: '100%', padding: '10px 14px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '7px', color: '#ffffff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: '#6b6b6b' }}>Role</label>
                <select 
                  value={formData.role} 
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  style={{ width: '100%', padding: '10px 14px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '7px', color: '#ffffff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#ffffff', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={createMutation.isPending} style={{ padding: '8px 16px', background: '#c0c0c0', border: 'none', borderRadius: '6px', color: '#000', fontWeight: 700, cursor: 'pointer' }}>
                  {createMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
