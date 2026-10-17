import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useDashboard } from '@/hooks/useDashboard';
import { useQuery } from '@tanstack/react-query';
import { bookingsApi } from '@/api/bookings';
import { reportsApi } from '@/api/reports';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Calendar, Users, TrendingUp, DollarSign, ClipboardList, AlertCircle, CheckCircle2, XCircle, Clock, Activity } from 'lucide-react';

const PERIOD_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
];

const STATUS_COLORS: Record<string, string> = {
  confirmed: '#3d85c8',
  pending: '#d4a017',
  completed: '#2d7a4f',
  cancelled: '#5a5a5a',
  'no-show': '#8b2020',
};

function StatCard({ title, value, icon: Icon, sub, color = '#c0c0c0', loading }: any) {
  return (
    <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.75rem', color: '#6b6b6b', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{title}</span>
        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color={color} />
        </div>
      </div>
      {loading ? (
        <div style={{ height: '36px', background: '#1a1a1a', borderRadius: '6px', animation: 'pulse 1.5s infinite' }} />
      ) : (
        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>{value ?? '—'}</div>
      )}
      {sub && <div style={{ fontSize: '0.75rem', color: '#6b6b6b' }}>{sub}</div>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '12px 16px', fontSize: '0.8rem' }}>
      <p style={{ color: '#6b6b6b', marginBottom: '6px' }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || '#c0c0c0', fontWeight: 700 }}>
          {p.name}: {typeof p.value === 'number' && p.name?.toLowerCase().includes('rev') ? `Rs. ${p.value.toLocaleString()}` : p.value}
        </p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const [period, setPeriod] = useState('today');
  const { data: stats, isLoading } = useDashboard(period);
  const navigate = useNavigate();

  const { data: revenueChartData } = useQuery({
    queryKey: ['revenue-chart-30d'],
    queryFn: () => reportsApi.revenue({ period: 'month' }).then(r => r.data.data?.daily || []),
  });

  const { data: recentBookings } = useQuery({
    queryKey: ['recent-bookings'],
    queryFn: () => bookingsApi.getAll({ limit: 8, sort: '-createdAt' }).then(r => r.data.data),
  });

  const { data: facilityPerf } = useQuery({
    queryKey: ['facility-performance'],
    queryFn: () => reportsApi.facilityPerformance({ period: 'month' }).then(r => r.data.data),
  });

  const fmt = (n: number | undefined) => n !== undefined ? `Rs. ${n.toLocaleString()}` : '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', marginBottom: '4px', letterSpacing: '-0.02em' }}>Dashboard</h1>
          <p style={{ color: '#6b6b6b', fontSize: '0.85rem' }}>Welcome back. Here's your business overview.</p>
        </div>
        <div style={{ display: 'flex', gap: '4px', background: '#111111', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '4px' }}>
          {PERIOD_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => setPeriod(opt.value)} style={{
              padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer',
              fontSize: '0.75rem', fontWeight: 600, transition: 'all 0.15s',
              background: period === opt.value ? '#c0c0c0' : 'transparent',
              color: period === opt.value ? '#000000' : '#6b6b6b',
            }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
        <StatCard title="Bookings" value={stats?.todayBookings} icon={Calendar} loading={isLoading} color="#3d85c8" sub={`${period === 'today' ? 'Today' : ''}`} />
        <StatCard title="Revenue" value={fmt(stats?.todayRevenue)} icon={DollarSign} loading={isLoading} color="#2d7a4f" />
        <StatCard title="Upcoming" value={stats?.upcomingBookings} icon={Clock} loading={isLoading} color="#d4a017" />
        <StatCard title="Completed" value={stats?.completedBookings} icon={CheckCircle2} loading={isLoading} color="#2d7a4f" />
        <StatCard title="No Shows" value={stats?.noShows} icon={XCircle} loading={isLoading} color="#8b2020" />
        <StatCard title="Pending" value={stats?.pendingBookings} icon={AlertCircle} loading={isLoading} color="#d4a017" />
        <StatCard title="Monthly Revenue" value={fmt(stats?.monthlyRevenue)} icon={TrendingUp} loading={isLoading} color="#c0c0c0" />
        <StatCard title="Net Profit" value={fmt(stats?.netProfit)} icon={Activity} loading={isLoading} color="#c0c0c0" />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        {/* Revenue chart */}
        <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '24px', minHeight: '300px' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff', marginBottom: '20px' }}>Revenue — Last 30 Days</h3>
          {revenueChartData && revenueChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c0c0c0" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#c0c0c0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis dataKey="date" tick={{ fill: '#6b6b6b', fontSize: 10 }} tickFormatter={(v) => v?.slice(5)} />
                <YAxis tick={{ fill: '#6b6b6b', fontSize: 10 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#c0c0c0" fill="url(#revGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b4b4b', fontSize: '0.85rem', border: '1px dashed #1f1f1f', borderRadius: '8px' }}>
              No revenue data yet
            </div>
          )}
        </div>

        {/* Facility performance */}
        <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '24px', minHeight: '300px' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff', marginBottom: '20px' }}>Facility Performance</h3>
          {facilityPerf && facilityPerf.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={facilityPerf} layout="vertical" margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#6b6b6b', fontSize: 10 }} />
                <YAxis type="category" dataKey="facility" tick={{ fill: '#c0c0c0', fontSize: 10 }} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="bookings" name="Bookings" fill="#3d85c8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b4b4b', fontSize: '0.85rem', border: '1px dashed #1f1f1f', borderRadius: '8px' }}>
              No performance data yet
            </div>
          )}
        </div>
      </div>

      {/* Recent Bookings */}
      <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>Recent Bookings</h3>
          <Link to="/admin/bookings" style={{ fontSize: '0.75rem', color: '#c0c0c0', textDecoration: 'none', fontWeight: 600, letterSpacing: '0.05em' }}>
            View All →
          </Link>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr>
                {['Booking #', 'Customer', 'Facility', 'Date', 'Time', 'Amount', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#4b4b4b', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid #1f1f1f' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentBookings?.map((b: any) => (
                <tr key={b._id} style={{ cursor: 'pointer', transition: 'background 0.1s' }}
                  onClick={() => navigate(`/admin/bookings/${b._id}`)}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#161616'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                  <td style={{ padding: '12px', color: '#c0c0c0', fontWeight: 700, fontFamily: 'monospace' }}>{b.bookingNumber}</td>
                  <td style={{ padding: '12px', color: '#ffffff' }}>{b.customer?.name || b.name}</td>
                  <td style={{ padding: '12px', color: '#8b8b8b' }}>{b.facility?.name || '—'}</td>
                  <td style={{ padding: '12px', color: '#8b8b8b' }}>{b.date}</td>
                  <td style={{ padding: '12px', color: '#8b8b8b' }}>{b.startTime} – {b.endTime}</td>
                  <td style={{ padding: '12px', color: '#ffffff', fontWeight: 600 }}>Rs. {b.totalAmount?.toLocaleString()}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700,
                      background: `${STATUS_COLORS[b.status] || '#2a2a2a'}22`,
                      color: STATUS_COLORS[b.status] || '#6b6b6b',
                      border: `1px solid ${STATUS_COLORS[b.status] || '#2a2a2a'}44`,
                      textTransform: 'capitalize',
                    }}>
                      {b.status === 'confirmed' ? 'Ongoing' : (b.status === 'no_show' ? 'No Show' : b.status)}
                    </span>
                  </td>
                </tr>
              ))}
              {!recentBookings?.length && (
                <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#4b4b4b' }}>No bookings yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
        {[
          { label: 'New Booking', href: '/admin/bookings/calendar', icon: Calendar },
          { label: 'View Bookings', href: '/admin/bookings', icon: ClipboardList },
          { label: 'Add Expense', href: '/admin/finance/expenses', icon: DollarSign },
          { label: 'Manage Facilities', href: '/admin/facilities', icon: Users },
        ].map(a => (
          <Link key={a.href} to={a.href} style={{
            display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px',
            background: '#111111', border: '1px solid #2a2a2a', borderRadius: '10px',
            textDecoration: 'none', color: '#c0c0c0', fontSize: '0.82rem', fontWeight: 600,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#c0c0c0'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2a2a'; (e.currentTarget as HTMLElement).style.color = '#c0c0c0'; }}>
            <a.icon size={16} />
            {a.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
