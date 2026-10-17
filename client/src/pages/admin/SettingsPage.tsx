import React, { useState, useEffect } from 'react';
import { settingsApi } from '@/api/settings';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    settingsApi.get().then(res => { setSettings(res.data.data || {}); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleSave = () => {
    settingsApi.update(settings).then(() => alert('Saved successfully'));
  };

  if (loading) return <div style={{ padding: '24px', color: '#6b6b6b', background: '#0a0a0a', minHeight: '100vh' }}>Loading...</div>;

  return (
    <div style={{ padding: '24px', background: '#0a0a0a', minHeight: '100vh', color: '#ffffff', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 8px 0' }}>Business Settings</h1>
        </div>
        <button 
          style={{ padding: '10px 20px', background: '#c0c0c0', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}
          onClick={handleSave}
        >
          Save Settings
        </button>
      </div>

      <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '24px', maxWidth: '800px' }}>
        <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#c0c0c0', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '16px' }}>Business Profile</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: '#6b6b6b' }}>Business Name</label>
            <input 
              value={settings.businessName || ''} 
              onChange={e => setSettings({...settings, businessName: e.target.value})}
              style={{ width: '100%', padding: '10px 14px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '7px', color: '#ffffff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: '#6b6b6b' }}>Tagline</label>
            <input 
              value={settings.tagline || ''} 
              onChange={e => setSettings({...settings, tagline: e.target.value})}
              style={{ width: '100%', padding: '10px 14px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '7px', color: '#ffffff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: '#6b6b6b' }}>Phone</label>
            <input 
              value={settings.phone || ''} 
              onChange={e => setSettings({...settings, phone: e.target.value})}
              style={{ width: '100%', padding: '10px 14px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '7px', color: '#ffffff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: '#6b6b6b' }}>Email</label>
            <input 
              value={settings.email || ''} 
              onChange={e => setSettings({...settings, email: e.target.value})}
              style={{ width: '100%', padding: '10px 14px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '7px', color: '#ffffff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: '#6b6b6b' }}>Address</label>
            <input 
              value={settings.address || ''} 
              onChange={e => setSettings({...settings, address: e.target.value})}
              style={{ width: '100%', padding: '10px 14px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '7px', color: '#ffffff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#c0c0c0', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '16px' }}>Localization</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: '#6b6b6b' }}>Currency</label>
            <input 
              value={settings.currency || ''} 
              onChange={e => setSettings({...settings, currency: e.target.value})}
              style={{ width: '100%', padding: '10px 14px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '7px', color: '#ffffff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: '#6b6b6b' }}>Timezone</label>
            <input 
              value={settings.timezone || ''} 
              onChange={e => setSettings({...settings, timezone: e.target.value})}
              style={{ width: '100%', padding: '10px 14px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '7px', color: '#ffffff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#c0c0c0', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '16px' }}>Booking Rules</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: '#6b6b6b' }}>Min Advance Booking (Hours)</label>
            <input 
              type="number"
              value={settings.bookingSettings?.minAdvanceHours || 0} 
              onChange={e => setSettings({...settings, bookingSettings: {...settings.bookingSettings, minAdvanceHours: Number(e.target.value)}})}
              style={{ width: '100%', padding: '10px 14px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '7px', color: '#ffffff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: '#6b6b6b' }}>Slot Interval (Mins)</label>
            <input 
              type="number"
              value={settings.bookingSettings?.slotIntervalMinutes || 30} 
              onChange={e => setSettings({...settings, bookingSettings: {...settings.bookingSettings, slotIntervalMinutes: Number(e.target.value)}})}
              style={{ width: '100%', padding: '10px 14px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '7px', color: '#ffffff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#c0c0c0', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '16px' }}>Working Hours (Mon-Sun)</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
            <div key={day} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr', gap: '16px', alignItems: 'center' }}>
              <div style={{ textTransform: 'capitalize', fontSize: '0.85rem' }}>{day}</div>
              <input 
                type="time" 
                value={settings.workingHours?.[day]?.open || '09:00'} 
                onChange={e => setSettings({...settings, workingHours: {...settings.workingHours, [day]: { ...settings.workingHours?.[day], open: e.target.value }}})}
                style={{ width: '100%', padding: '10px 14px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '7px', color: '#ffffff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
              />
              <input 
                type="time" 
                value={settings.workingHours?.[day]?.close || '21:00'} 
                onChange={e => setSettings({...settings, workingHours: {...settings.workingHours, [day]: { ...settings.workingHours?.[day], close: e.target.value }}})}
                style={{ width: '100%', padding: '10px 14px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '7px', color: '#ffffff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
