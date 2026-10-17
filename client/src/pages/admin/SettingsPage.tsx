import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '@/api/settings';
import {
  Clock,
  Save,
  Building,
  Calendar,
  DollarSign,
  Check,
  AlertCircle,
  Copy,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

const DAYS: { key: string; label: string; isWeekend?: boolean }[] = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday', isWeekend: true },
  { key: 'sunday', label: 'Sunday', isWeekend: true },
];

const DEFAULT_HOURS: Record<string, DayHours> = {
  monday: { open: '10:00', close: '22:00', closed: false },
  tuesday: { open: '10:00', close: '22:00', closed: false },
  wednesday: { open: '10:00', close: '22:00', closed: false },
  thursday: { open: '10:00', close: '22:00', closed: false },
  friday: { open: '10:00', close: '22:00', closed: false },
  saturday: { open: '10:00', close: '22:00', closed: false },
  sunday: { open: '11:00', close: '22:00', closed: false },
};

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [businessName, setBusinessName] = useState('Atrios Entertainment');
  const [tagline, setTagline] = useState('Play. Compete. Experience.');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');

  // Working Hours State
  const [hours, setHours] = useState<Record<string, DayHours>>(DEFAULT_HOURS);

  // Booking Settings State
  const [intervalMinutes, setIntervalMinutes] = useState(30);
  const [minDurationMinutes, setMinDurationMinutes] = useState(30);
  const [maxDurationMinutes, setMaxDurationMinutes] = useState(240);
  const [advanceBookingDays, setAdvanceBookingDays] = useState(30);

  // Financial Settings State
  const [currency, setCurrency] = useState('LKR');
  const [currencySymbol, setCurrencySymbol] = useState('Rs.');

  useEffect(() => {
    settingsApi
      .get()
      .then((res) => {
        const data = res.data?.data as any;
        if (data) {
          if (data.businessName) setBusinessName(data.businessName);
          if (data.websiteSettings?.heroSubtitle || data.tagline) {
            setTagline(data.websiteSettings?.heroSubtitle || data.tagline || '');
          }
          if (data.phone) setPhone(data.phone);
          if (data.email) setEmail(data.email);
          if (data.address) setAddress(data.address);
          if (data.website) setWebsite(data.website);

          // Working / Business Hours
          const rawHours = data.businessHours || data.workingHours || {};
          const merged: Record<string, DayHours> = {};
          DAYS.forEach(({ key }) => {
            const h = rawHours[key];
            merged[key] = {
              open: h?.open || DEFAULT_HOURS[key].open,
              close: h?.close || DEFAULT_HOURS[key].close,
              closed: Boolean(h?.closed),
            };
          });
          setHours(merged);

          // Booking Settings
          if (data.bookingSettings) {
            if (data.bookingSettings.intervalMinutes) setIntervalMinutes(data.bookingSettings.intervalMinutes);
            if (data.bookingSettings.minDurationMinutes) setMinDurationMinutes(data.bookingSettings.minDurationMinutes);
            if (data.bookingSettings.maxDurationMinutes) setMaxDurationMinutes(data.bookingSettings.maxDurationMinutes);
            if (data.bookingSettings.advanceBookingDays) setAdvanceBookingDays(data.bookingSettings.advanceBookingDays);
          }

          // Financial Settings
          if (data.financialSettings) {
            if (data.financialSettings.currency) setCurrency(data.financialSettings.currency);
            if (data.financialSettings.currencySymbol) setCurrencySymbol(data.financialSettings.currencySymbol);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load settings:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleUpdateHour = (day: string, field: 'open' | 'close' | 'closed', val: any) => {
    setHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: val,
      },
    }));
  };

  const handleCopyMondayToWeekdays = () => {
    const monday = hours['monday'];
    if (!monday) return;
    setHours((prev) => ({
      ...prev,
      tuesday: { ...monday },
      wednesday: { ...monday },
      thursday: { ...monday },
      friday: { ...monday },
    }));
    setStatusMessage({ type: 'success', text: "Copied Monday's schedule to Tuesday — Friday" });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleCopyMondayToAll = () => {
    const monday = hours['monday'];
    if (!monday) return;
    const updated: Record<string, DayHours> = {};
    DAYS.forEach(({ key }) => {
      updated[key] = { ...monday };
    });
    setHours(updated);
    setStatusMessage({ type: 'success', text: "Applied Monday's schedule to all 7 days" });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    setStatusMessage(null);

    const payload = {
      businessName,
      tagline,
      phone,
      email,
      address,
      website,
      // Provide both businessHours and workingHours so both schemas stay 100% synced
      businessHours: hours,
      workingHours: hours,
      bookingSettings: {
        intervalMinutes: Number(intervalMinutes) || 30,
        minDurationMinutes: Number(minDurationMinutes) || 30,
        maxDurationMinutes: Number(maxDurationMinutes) || 240,
        advanceBookingDays: Number(advanceBookingDays) || 30,
      },
      financialSettings: {
        currency: currency.trim() || 'LKR',
        currencySymbol: currencySymbol.trim() || 'Rs.',
      },
      websiteSettings: {
        heroSubtitle: tagline,
      },
    };

    try {
      await settingsApi.update(payload as any);
      // Invalidate queries so that availability calculations and navbar use fresh settings immediately
      await queryClient.invalidateQueries({ queryKey: ['settings'] });
      setStatusMessage({ type: 'success', text: '✓ Settings & working hours updated successfully!' });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to save settings. Please try again.';
      setStatusMessage({ type: 'error', text: errMsg });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '32px', color: '#6b6b6b', background: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Clock size={20} className="animate-spin" style={{ color: '#c0c0c0' }} />
          <span style={{ fontSize: '0.9rem', color: '#c0c0c0' }}>Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 24px 64px', background: '#0a0a0a', minHeight: '100vh', color: '#ffffff', maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '0.72rem', color: '#c0c0c0', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '4px' }}>
            System Configuration
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
            Business Settings
          </h1>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 28px',
            background: saving ? '#4b4b4b' : '#c0c0c0',
            border: 'none',
            borderRadius: '8px',
            color: '#000000',
            fontWeight: 800,
            cursor: saving ? 'wait' : 'pointer',
            fontSize: '0.85rem',
            letterSpacing: '0.04em',
            transition: 'all 0.15s ease',
            boxShadow: '0 4px 14px rgba(192, 192, 192, 0.2)',
          }}
        >
          <Save size={16} />
          {saving ? 'Saving Changes...' : 'Save Settings'}
        </button>
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: '10px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.88rem',
            fontWeight: 600,
            background: statusMessage.type === 'success' ? '#2d7a4f20' : '#b3393925',
            border: `1px solid ${statusMessage.type === 'success' ? '#2d7a4f60' : '#b3393960'}`,
            color: statusMessage.type === 'success' ? '#70db93' : '#ff8585',
          }}
        >
          {statusMessage.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

        {/* SECTION 1: WORKING & OPERATING HOURS */}
        <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '28px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={18} style={{ color: '#c0c0c0' }} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>Working & Operating Hours</h2>
                <p style={{ fontSize: '0.78rem', color: '#8b8b8b', margin: '2px 0 0' }}>
                  Set open and close times for each day. Available booking slots directly reflect these hours.
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleCopyMondayToWeekdays}
                style={{
                  padding: '7px 12px',
                  background: '#161616',
                  border: '1px solid #333333',
                  borderRadius: '6px',
                  color: '#c0c0c0',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Copy size={13} /> Copy Mon → Weekdays
              </button>
              <button
                type="button"
                onClick={handleCopyMondayToAll}
                style={{
                  padding: '7px 12px',
                  background: '#161616',
                  border: '1px solid #333333',
                  borderRadius: '6px',
                  color: '#c0c0c0',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Copy size={13} /> Copy Mon → All Days
              </button>
            </div>
          </div>

          <div style={{ marginTop: '20px', borderTop: '1px solid #1f1f1f', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {DAYS.map(({ key, label, isWeekend }) => {
              const dayHour = hours[key] || DEFAULT_HOURS[key];
              const isClosed = Boolean(dayHour.closed);

              return (
                <div
                  key={key}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '140px 100px 1fr 1fr',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '12px 16px',
                    background: isClosed ? '#0d0d0d' : '#141414',
                    border: `1px solid ${isClosed ? '#1c1c1c' : '#262626'}`,
                    borderRadius: '10px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Day Label */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isClosed ? '#6b6b6b' : '#ffffff' }}>
                      {label}
                    </span>
                    {isWeekend && (
                      <span style={{ fontSize: '0.62rem', padding: '1px 6px', background: '#222222', color: '#888888', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 700 }}>
                        Weekend
                      </span>
                    )}
                  </div>

                  {/* Status Toggle (Open / Closed) */}
                  <div>
                    <button
                      type="button"
                      onClick={() => handleUpdateHour(key, 'closed', !isClosed)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: 'none',
                        background: isClosed ? '#b3393925' : '#2d7a4f25',
                        color: isClosed ? '#ff7b7b' : '#5cd685',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {isClosed ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
                      {isClosed ? 'CLOSED' : 'OPEN'}
                    </button>
                  </div>

                  {/* Open Time */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.68rem', color: '#6b6b6b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                      Opening Time
                    </label>
                    <input
                      type="time"
                      disabled={isClosed}
                      value={dayHour.open || '10:00'}
                      onChange={(e) => handleUpdateHour(key, 'open', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: isClosed ? '#0a0a0a' : '#0e0e0e',
                        border: `1px solid ${isClosed ? '#1a1a1a' : '#2f2f2f'}`,
                        borderRadius: '8px',
                        color: isClosed ? '#4b4b4b' : '#ffffff',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        outline: 'none',
                        colorScheme: 'dark',
                        boxSizing: 'border-box',
                        cursor: isClosed ? 'not-allowed' : 'pointer',
                      }}
                    />
                  </div>

                  {/* Close Time */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.68rem', color: '#6b6b6b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                      Closing Time
                    </label>
                    <input
                      type="time"
                      disabled={isClosed}
                      value={dayHour.close || '22:00'}
                      onChange={(e) => handleUpdateHour(key, 'close', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: isClosed ? '#0a0a0a' : '#0e0e0e',
                        border: `1px solid ${isClosed ? '#1a1a1a' : '#2f2f2f'}`,
                        borderRadius: '8px',
                        color: isClosed ? '#4b4b4b' : '#ffffff',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        outline: 'none',
                        colorScheme: 'dark',
                        boxSizing: 'border-box',
                        cursor: isClosed ? 'not-allowed' : 'pointer',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: BUSINESS PROFILE */}
        <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '28px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building size={18} style={{ color: '#c0c0c0' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>Business Profile</h2>
              <p style={{ fontSize: '0.78rem', color: '#8b8b8b', margin: '2px 0 0' }}>
                Public company information displayed across the site, footer, and confirmations.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#8b8b8b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                Business Name
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  background: '#0a0a0a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#8b8b8b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                Tagline / Subtitle
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  background: '#0a0a0a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#8b8b8b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                Phone Number / WhatsApp
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+94 77 123 4567"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  background: '#0a0a0a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#8b8b8b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                Contact Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="info@atriosentertainment.com"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  background: '#0a0a0a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#8b8b8b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                Physical Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="No. 45, Galle Road, Colombo 03, Sri Lanka"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  background: '#0a0a0a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: BOOKING RULES */}
        <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '28px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={18} style={{ color: '#c0c0c0' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>Booking Rules</h2>
              <p style={{ fontSize: '0.78rem', color: '#8b8b8b', margin: '2px 0 0' }}>
                Configure slot intervals, minimum and maximum durations for sessions.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#8b8b8b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                Slot Interval (Minutes)
              </label>
              <input
                type="number"
                min={15}
                max={120}
                step={15}
                value={intervalMinutes}
                onChange={(e) => setIntervalMinutes(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  background: '#0a0a0a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#8b8b8b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                Min Duration (Minutes)
              </label>
              <input
                type="number"
                min={15}
                max={180}
                step={15}
                value={minDurationMinutes}
                onChange={(e) => setMinDurationMinutes(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  background: '#0a0a0a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#8b8b8b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                Max Duration (Minutes)
              </label>
              <input
                type="number"
                min={30}
                max={600}
                step={30}
                value={maxDurationMinutes}
                onChange={(e) => setMaxDurationMinutes(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  background: '#0a0a0a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#8b8b8b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                Advance Booking (Days)
              </label>
              <input
                type="number"
                min={1}
                max={90}
                value={advanceBookingDays}
                onChange={(e) => setAdvanceBookingDays(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  background: '#0a0a0a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: LOCALIZATION & CURRENCY */}
        <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '28px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={18} style={{ color: '#c0c0c0' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>Currency & Localization</h2>
              <p style={{ fontSize: '0.78rem', color: '#8b8b8b', margin: '2px 0 0' }}>
                Standard display currency and symbol used across invoices and public rates.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#8b8b8b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                Currency Code
              </label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="LKR"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  background: '#0a0a0a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#8b8b8b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                Currency Symbol
              </label>
              <input
                type="text"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                placeholder="Rs."
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  background: '#0a0a0a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        </div>

        {/* Bottom Save Action */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 36px',
              background: saving ? '#4b4b4b' : '#c0c0c0',
              border: 'none',
              borderRadius: '8px',
              color: '#000000',
              fontWeight: 800,
              cursor: saving ? 'wait' : 'pointer',
              fontSize: '0.9rem',
              letterSpacing: '0.04em',
              transition: 'all 0.15s ease',
              boxShadow: '0 4px 18px rgba(192, 192, 192, 0.25)',
            }}
          >
            <Save size={18} />
            {saving ? 'Saving Changes...' : 'Save Settings'}
          </button>
        </div>

      </div>
    </div>
  );
}
