import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      login(res.data.token, res.data.data);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-silver-dark via-silver to-silver-dark"></div>
        <div className="flex flex-col items-center mb-8">
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#161616', border: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#ffffff' }}>A</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Atrios Admin</h2>
          <p className="text-muted text-sm mt-1">Sign in to manage your lounge</p>
        </div>
        
        {error && <div className="mb-6 p-3 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-sm text-center">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-background" />
          </div>
          <div>
            <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-background" />
          </div>
          <Button type="submit" className="w-full h-11 text-base font-semibold mt-2" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>


      </div>
    </div>
  );
}
