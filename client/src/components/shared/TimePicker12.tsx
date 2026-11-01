import React from 'react';

interface TimePicker12Props {
  value: string; // "HH:mm" (24-hour format)
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
}

// Convert "HH:mm" (24-hour) to { hour12: number, minute: number, period: 'AM' | 'PM' }
export function parse24To12(time24: string): { hour12: number; minute: number; period: 'AM' | 'PM' } {
  if (!time24 || !time24.includes(':')) {
    return { hour12: 12, minute: 0, period: 'PM' };
  }
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = Math.min(59, Math.max(0, parseInt(mStr, 10) || 0));
  if (isNaN(h)) h = 12;

  const period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;

  return { hour12, minute: m, period };
}

// Convert { hour12: number, minute: number, period: 'AM' | 'PM' } to "HH:mm" (24-hour)
export function format12To24(hour12: number, minute: number, period: 'AM' | 'PM'): string {
  let h24 = hour12 % 12;
  if (period === 'PM') h24 += 12;
  const m = Math.min(59, Math.max(0, minute || 0));
  return `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function TimePicker12({ value, onChange, label, disabled = false }: TimePicker12Props) {
  const { hour12, minute, period } = parse24To12(value);

  const handleHourChange = (newHour: number) => {
    onChange(format12To24(newHour, minute, period));
  };

  const handleMinuteChange = (newMin: number) => {
    const clamped = Math.min(59, Math.max(0, newMin || 0));
    onChange(format12To24(hour12, clamped, period));
  };

  const handlePeriodChange = (newPeriod: 'AM' | 'PM') => {
    onChange(format12To24(hour12, minute, newPeriod));
  };

  const selectStyle: React.CSSProperties = {
    background: '#0a0a0a',
    border: '1px solid #2a2a2a',
    borderRadius: '7px',
    color: '#ffffff',
    fontSize: '0.85rem',
    fontWeight: 700,
    padding: '8px 10px',
    outline: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    colorScheme: 'dark',
  };

  return (
    <div>
      {label && (
        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#8b8b8b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
          {label}
        </label>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {/* Hour selector */}
        <select
          disabled={disabled}
          value={hour12}
          onChange={e => handleHourChange(parseInt(e.target.value, 10))}
          style={{ ...selectStyle, minWidth: '58px' }}
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
            <option key={h} value={h}>
              {String(h).padStart(2, '0')}
            </option>
          ))}
        </select>

        <span style={{ color: '#6b6b6b', fontWeight: 800, fontSize: '0.9rem' }}>:</span>

        {/* Minute input/select */}
        <input
          type="number"
          min="0"
          max="59"
          disabled={disabled}
          value={String(minute).padStart(2, '0')}
          onChange={e => handleMinuteChange(parseInt(e.target.value, 10))}
          style={{
            ...selectStyle,
            width: '54px',
            textAlign: 'center',
          }}
        />

        {/* AM / PM Toggle buttons */}
        <div style={{ display: 'flex', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '7px', padding: '2px' }}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => handlePeriodChange('AM')}
            style={{
              padding: '6px 10px',
              borderRadius: '5px',
              border: 'none',
              background: period === 'AM' ? '#c0c0c0' : 'transparent',
              color: period === 'AM' ? '#000000' : '#8b8b8b',
              fontWeight: 800,
              fontSize: '0.72rem',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            AM
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => handlePeriodChange('PM')}
            style={{
              padding: '6px 10px',
              borderRadius: '5px',
              border: 'none',
              background: period === 'PM' ? '#c0c0c0' : 'transparent',
              color: period === 'PM' ? '#000000' : '#8b8b8b',
              fontWeight: 800,
              fontSize: '0.72rem',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            PM
          </button>
        </div>
      </div>
    </div>
  );
}
