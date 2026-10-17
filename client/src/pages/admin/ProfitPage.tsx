import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/api/reports';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Download, Users, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';

const PARTNER_COLORS = ['#c0c0c0', '#3d85c8', '#2d7a4f', '#d4a017', '#9b59b6', '#e67e22'];

export default function ProfitPage() {
  const [period, setPeriod] = useState('month');

  const { data: profitRes, isLoading } = useQuery({
    queryKey: ['reports', 'profit', period],
    queryFn: () => reportsApi.profit({ period }).then(res => res.data)
  });

  const handleExport = async () => {
    try {
      const response = await reportsApi.exportProfit({ period });
      const blob = new Blob([response.data as any], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `profit-report-${period}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const reportData = profitRes?.data;
  const grossRevenue = reportData?.revenue ?? reportData?.grossRevenue ?? 0;
  const totalExpenses = reportData?.expenses ?? reportData?.totalExpenses ?? 0;
  const netProfit = reportData?.netProfit ?? (grossRevenue - totalExpenses);

  // Safely extract distribution array from response
  const rawDistribution = reportData?.distribution;
  const partnersList: any[] = Array.isArray(rawDistribution)
    ? rawDistribution
    : [];

  const formattedPartners = partnersList.map((p: any, index: number) => {
    const name = p.name || p.partner?.name || `Partner ${index + 1}`;
    const equityPct = p.percentage ?? p.equity ?? 0;
    const shareVal = p.share ?? p.shareAmount ?? 0;
    const investmentVal = p.investment ?? 0;
    return {
      name,
      equity: equityPct,
      share: shareVal,
      investment: investmentVal,
      color: PARTNER_COLORS[index % PARTNER_COLORS.length],
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', color: '#ffffff' }}>
      <PageHeader
        title="Profit & Partner Distribution"
        subtitle="Review lounge net profit calculations and equity distributions"
        actions={
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select
              value={period}
              onChange={e => setPeriod(e.target.value)}
              style={{
                padding: '9px 14px',
                background: '#161616',
                border: '1px solid #2a2a2a',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="week">This Week</option>
              <option value="today">Today</option>
            </select>
            <button
              onClick={handleExport}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                background: '#c0c0c0',
                border: 'none',
                borderRadius: '8px',
                color: '#000000',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.82rem',
              }}
            >
              <Download size={15} /> Export Excel
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.72rem', color: '#6b6b6b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Gross Revenue
            </span>
            <ArrowUpRight size={16} color="#2d7a4f" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff' }}>
            Rs. {grossRevenue.toLocaleString()}
          </div>
          <p style={{ fontSize: '0.75rem', color: '#4b4b4b', marginTop: '6px' }}>Total earnings before expenses</p>
        </div>

        <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.72rem', color: '#6b6b6b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Operating Expenses
            </span>
            <ArrowDownRight size={16} color="#8b2020" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ff6b6b' }}>
            Rs. {totalExpenses.toLocaleString()}
          </div>
          <p style={{ fontSize: '0.75rem', color: '#4b4b4b', marginTop: '6px' }}>Facility operational costs</p>
        </div>

        <div style={{ background: '#111111', border: `1px solid ${netProfit >= 0 ? '#2d7a4f40' : '#8b202040'}`, borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.72rem', color: netProfit >= 0 ? '#2d7a4f' : '#ff6b6b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Net Profit
            </span>
            <TrendingUp size={16} color={netProfit >= 0 ? '#2d7a4f' : '#ff6b6b'} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: netProfit >= 0 ? '#ffffff' : '#ff6b6b' }}>
            Rs. {netProfit.toLocaleString()}
          </div>
          <p style={{ fontSize: '0.75rem', color: '#4b4b4b', marginTop: '6px' }}>
            Available for partner distribution
          </p>
        </div>
      </div>

      {/* Main Section: Distribution Table + Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {/* Distribution Table */}
        <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>
            Partner Payout Breakdown
          </h3>
          {isLoading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#6b6b6b' }}>Loading partner distribution...</div>
          ) : formattedPartners.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#4b4b4b', fontSize: '0.85rem' }}>
              No active partners found.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1f1f1f', color: '#6b6b6b', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.08em' }}>
                    <th style={{ padding: '12px 14px' }}>Partner</th>
                    <th style={{ padding: '12px 14px' }}>Equity</th>
                    <th style={{ padding: '12px 14px' }}>Investment</th>
                    <th style={{ padding: '12px 14px' }}>Payout Share</th>
                  </tr>
                </thead>
                <tbody>
                  {formattedPartners.map((p, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #161616' }}>
                      <td style={{ padding: '14px', color: '#ffffff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color }} />
                        {p.name}
                      </td>
                      <td style={{ padding: '14px', color: '#c0c0c0' }}>{p.equity}%</td>
                      <td style={{ padding: '14px', color: '#8b8b8b' }}>Rs. {p.investment.toLocaleString()}</td>
                      <td style={{ padding: '14px', color: p.share > 0 ? '#2d7a4f' : '#ffffff', fontWeight: 700 }}>
                        Rs. {p.share.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Distribution Chart */}
        <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>
            Share Distribution Chart
          </h3>
          {isLoading ? (
            <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b6b6b' }}>
              Loading chart...
            </div>
          ) : formattedPartners.length === 0 ? (
            <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b4b4b', fontSize: '0.85rem' }}>
              No distribution data to graph.
            </div>
          ) : (
            <div style={{ height: '280px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedPartners}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222222" />
                  <XAxis dataKey="name" stroke="#6b6b6b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b6b6b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={val => `Rs.${val}`} />
                  <Tooltip
                    contentStyle={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#ffffff' }}
                    formatter={(val: any) => [`Rs. ${Number(val).toLocaleString()}`, 'Profit Share']}
                  />
                  <Bar dataKey="share" radius={[4, 4, 0, 0]}>
                    {formattedPartners.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
