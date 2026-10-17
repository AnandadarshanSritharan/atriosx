import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/api/reports';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, Calendar, DollarSign, Activity } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';

export default function RevenuePage() {
  const [period, setPeriod] = useState('month');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: revenueRes, isLoading: loadingRevenue } = useQuery({
    queryKey: ['reports', 'revenue', period, dateFrom, dateTo],
    queryFn: () => reportsApi.revenue({ period, dateFrom, dateTo }).then(res => res.data)
  });

  const { data: facilityRes, isLoading: loadingFacilities } = useQuery({
    queryKey: ['reports', 'facility', period, dateFrom, dateTo],
    queryFn: () => reportsApi.facilityPerformance({ period, dateFrom, dateTo }).then(res => res.data)
  });

  const handleExport = async () => {
    try {
      const response = await reportsApi.exportBookings({ period, dateFrom, dateTo });
      const blob = new Blob([response.data as any], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `revenue-report-${period}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const revenueData = revenueRes?.data;
  const totalRevenue = revenueData?.total ?? 0;
  const bookingsList = revenueData?.bookings ?? [];
  const bookingCount = bookingsList.length;
  const avgPerBooking = bookingCount > 0 ? Math.round(totalRevenue / bookingCount) : 0;
  const chartData = revenueData?.chartData ?? [];
  const highestDayRevenue = chartData.length > 0 ? Math.max(...chartData.map((d: any) => d.revenue || 0)) : 0;

  const facilityPerformanceList = facilityRes?.data ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', color: '#ffffff' }}>
      <PageHeader
        title="Revenue & Performance"
        subtitle="Track lounge revenue, transaction trends, and facility yield"
        actions={
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={period}
              onChange={e => { setPeriod(e.target.value); setDateFrom(''); setDateTo(''); }}
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
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="last_month">Last Month</option>
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              style={{
                padding: '9px 14px',
                background: '#161616',
                border: '1px solid #2a2a2a',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '0.85rem',
                outline: 'none',
                colorScheme: 'dark',
              }}
            />
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              style={{
                padding: '9px 14px',
                background: '#161616',
                border: '1px solid #2a2a2a',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '0.85rem',
                outline: 'none',
                colorScheme: 'dark',
              }}
            />
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

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '0.72rem', color: '#6b6b6b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
            Total Revenue
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff' }}>
            Rs. {totalRevenue.toLocaleString()}
          </div>
          <p style={{ fontSize: '0.75rem', color: '#4b4b4b', marginTop: '6px' }}>For selected period</p>
        </div>

        <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '0.72rem', color: '#6b6b6b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
            Bookings Count
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff' }}>
            {bookingCount}
          </div>
          <p style={{ fontSize: '0.75rem', color: '#4b4b4b', marginTop: '6px' }}>Paid / Confirmed reservations</p>
        </div>

        <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '0.72rem', color: '#6b6b6b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
            Avg Per Booking
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff' }}>
            Rs. {avgPerBooking.toLocaleString()}
          </div>
          <p style={{ fontSize: '0.75rem', color: '#4b4b4b', marginTop: '6px' }}>Average ticket value</p>
        </div>

        <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '0.72rem', color: '#6b6b6b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
            Peak Day Revenue
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff' }}>
            Rs. {highestDayRevenue.toLocaleString()}
          </div>
          <p style={{ fontSize: '0.75rem', color: '#4b4b4b', marginTop: '6px' }}>Highest single day intake</p>
        </div>
      </div>

      {/* Daily Revenue Area Chart */}
      <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', marginBottom: '20px' }}>
          Revenue Trend
        </h3>
        {loadingRevenue ? (
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b6b6b' }}>
            Loading trend data...
          </div>
        ) : chartData.length === 0 ? (
          <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b4b4b', fontSize: '0.85rem' }}>
            No revenue recorded for the selected period.
          </div>
        ) : (
          <div style={{ height: '320px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222222" />
                <XAxis dataKey="date" stroke="#6b6b6b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b6b6b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={val => `Rs.${val}`} />
                <Tooltip
                  contentStyle={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#ffffff' }}
                  formatter={(val: any) => [`Rs. ${Number(val).toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#c0c0c0" fill="#c0c0c0" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Facility Performance Table */}
      <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>
          Revenue by Facility
        </h3>
        {loadingFacilities ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#6b6b6b' }}>Loading facilities...</div>
        ) : facilityPerformanceList.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#4b4b4b', fontSize: '0.85rem' }}>
            No facility data available for this range.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1f1f1f', color: '#6b6b6b', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.08em' }}>
                  <th style={{ padding: '12px 14px' }}>Facility</th>
                  <th style={{ padding: '12px 14px' }}>Total Bookings</th>
                  <th style={{ padding: '12px 14px' }}>Completed</th>
                  <th style={{ padding: '12px 14px' }}>Revenue (Rs.)</th>
                  <th style={{ padding: '12px 14px' }}>Total Hours</th>
                  <th style={{ padding: '12px 14px' }}>Utilization</th>
                </tr>
              </thead>
              <tbody>
                {facilityPerformanceList.map((item: any, i: number) => {
                  const facilityName = item.facility?.name || item.name || 'Facility';
                  const facilityColor = item.facility?.color || '#3d85c8';
                  const bookingsTotal = item.totalBookings ?? item.bookingCount ?? item.count ?? 0;
                  const completedTotal = item.completedBookings ?? 0;
                  const rev = item.revenue ?? 0;
                  const hours = Math.round((item.totalHours ?? 0) * 10) / 10;
                  const util = Math.round(item.utilization ?? 0);

                  return (
                    <tr key={item.facility?._id || i} style={{ borderBottom: '1px solid #161616' }}>
                      <td style={{ padding: '14px', color: '#ffffff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: facilityColor }} />
                        {facilityName}
                      </td>
                      <td style={{ padding: '14px', color: '#c0c0c0' }}>{bookingsTotal}</td>
                      <td style={{ padding: '14px', color: '#2d7a4f', fontWeight: 600 }}>{completedTotal}</td>
                      <td style={{ padding: '14px', color: '#ffffff', fontWeight: 700 }}>
                        Rs. {Number(rev).toLocaleString()}
                      </td>
                      <td style={{ padding: '14px', color: '#8b8b8b' }}>{hours} hrs</td>
                      <td style={{ padding: '14px', color: util > 50 ? '#2d7a4f' : '#c0c0c0' }}>{util}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
