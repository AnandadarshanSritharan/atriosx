import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { facilitiesApi } from '@/api/facilities';
import { gamesApi } from '@/api/games';
import { useAvailabilityByCategory, useCreateBooking } from '@/hooks/useBookings';
import BookingConfirmation from './BookingConfirmation';
import { Users, Gamepad2, AlertCircle } from 'lucide-react';
import { validateName, validatePhone, validateEmail } from '@/utils/validation';


const STEPS = ['Experience', 'Date', 'Time & Duration', 'Details', 'Confirm'];

const BTN_PRIMARY = {
  padding: '12px 28px',
  background: '#c0c0c0',
  border: 'none',
  borderRadius: '8px',
  color: '#000',
  fontWeight: 700,
  fontSize: '0.85rem',
  cursor: 'pointer',
  letterSpacing: '0.04em',
} as React.CSSProperties;

const BTN_SECONDARY = {
  padding: '12px 24px',
  background: 'transparent',
  border: '1px solid #2a2a2a',
  borderRadius: '8px',
  color: '#c0c0c0',
  fontWeight: 600,
  fontSize: '0.85rem',
  cursor: 'pointer',
} as React.CSSProperties;

const INPUT_STYLE = {
  width: '100%',
  padding: '12px 14px',
  background: '#0a0a0a',
  border: '1px solid #2a2a2a',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '0.9rem',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
} as React.CSSProperties;

// Map category slug to emoji
const SLUG_TO_EMOJI: Record<string, string> = {
  'playstation': '🎮', 'playstation-5': '🎮', 'ps5': '🎮',
  'racing-cockpit': '🏎️', 'racing': '🏎️', 'cockpit': '🏎️',
  'table-tennis': '🏓', 'ping-pong': '🏓',
  'carrom': '🪀', 'carrom-board': '🪀',
  'bowling': '🎳', 'vr': '🥽', 'pool': '🎱', 'snooker': '🎱',
};

function getCategoryIcon(slug: string): string {
  return SLUG_TO_EMOJI[slug?.toLowerCase()] || '🎯';
}

function formatDurationLabel(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} Mins`;
  if (m === 0) return `${h} ${h === 1 ? 'Hour' : 'Hours'}`;
  if (m === 30) return `${h}.5 Hours`;
  return `${h}h ${m}m`;
}

function GameIconTile({ game }: { game: any }) {
  const [hovered, setHovered] = useState(false);
  const gameTitle = game.title || game.name;
  const cover = game.coverImage || game.imageUrl || game.image;

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          width: '54px',
          height: '54px',
          borderRadius: '10px',
          border: hovered ? '1px solid #c0c0c0' : '1px solid #2a2a2a',
          background: '#161616',
          overflow: 'hidden',
          cursor: 'default',
          transform: hovered ? 'scale(1.12) translateY(-2px)' : 'scale(1)',
          boxShadow: hovered ? '0 8px 20px rgba(0,0,0,0.7)' : 'none',
          transition: 'all 0.18s cubic-bezier(0.2, 0, 0, 1)',
        }}
      >
        {cover ? (
          <img src={cover} alt={gameTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
            🎮
          </div>
        )}
      </div>

      {/* Hover tooltip with title */}
      {hovered && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#141414',
          border: '1px solid #3a3a3a',
          borderRadius: '8px',
          padding: '6px 12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.9)',
          zIndex: 60,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
        }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#ffffff' }}>{gameTitle}</span>
          {game.category && (
            <span style={{ fontSize: '0.65rem', color: '#c0c0c0', fontWeight: 600 }}>{game.category}</span>
          )}
          <div style={{
            position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid #3a3a3a',
          }} />
        </div>
      )}
    </div>
  );
}


export default function BookingWizard() {
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');

  const [step, setStep] = useState(1);
  const [data, setData] = useState<any>({ duration: 60, personCount: 1 });
  const [successData, setSuccessData] = useState<any>(null);
  const [error, setError] = useState('');

  // Fetch all active facilities with their categories
  const { data: facilitiesRes, isLoading: loadingFacilities } = useQuery({
    queryKey: ['facilities-public'],
    queryFn: () => facilitiesApi.list().then(r => r.data),
  });

  // Fetch all categories
  const { data: categoriesRes, isLoading: loadingCategories } = useQuery({
    queryKey: ['facility-categories'],
    queryFn: () => facilitiesApi.categories.list().then(r => r.data),
  });

  // Group facilities by category to get pricing info per category
  const categoryGroups = useMemo(() => {
    const facilities = (facilitiesRes?.data as any[]) ?? [];
    const categories = (categoriesRes?.data as any[]) ?? [];
    const groups: Record<string, { category: any; facilities: any[]; minRate: number; maxRate: number }> = {};

    facilities.forEach(f => {
      const cat = f.category;
      if (!cat) return;
      const catId = cat._id || cat;
      if (!groups[catId]) {
        const fullCat = categories.find(c => c._id === catId) || cat;
        groups[catId] = { category: fullCat, facilities: [], minRate: Infinity, maxRate: 0 };
      }
      groups[catId].facilities.push(f);
      if (f.hourlyRate < groups[catId].minRate) groups[catId].minRate = f.hourlyRate;
      if (f.hourlyRate > groups[catId].maxRate) groups[catId].maxRate = f.hourlyRate;
    });

    return Object.values(groups).filter(g => g.facilities.length > 0);
  }, [facilitiesRes, categoriesRes]);

  const handleSelectCategory = (group: any) => {
    const cat = group.category;
    const facs = group.facilities || [];

    // Aggregate pricing tiers across facilities in this category (e.g. PS5 controller tiers)
    const tiersMap = new Map<number, { persons: number; hourlyRate: number; halfHourRate?: number }>();
    facs.forEach((f: any) => {
      if (f.pricingTiers && f.pricingTiers.length > 0) {
        f.pricingTiers.forEach((pt: any) => {
          if (!tiersMap.has(pt.persons)) {
            tiersMap.set(pt.persons, pt);
          }
        });
      }
    });

    const tiers = Array.from(tiersMap.values()).sort((a, b) => a.persons - b.persons);
    const defaultPerson = tiers[0]?.persons || 1;

    setData({
      ...data,
      categoryId: cat._id,
      categoryName: cat.name,
      categorySlug: cat.slug,
      categoryIcon: cat.icon,
      minRate: group.minRate === Infinity ? 0 : group.minRate,
      maxRate: group.maxRate,
      halfHourRate: facs[0]?.halfHourRate || (group.minRate !== Infinity ? Math.round(group.minRate * 0.5) : 0),
      unitCount: group.facilities.length,
      pricingTiers: tiers,
      personCount: defaultPerson,
      duration: 60,
    });
    handleNext();
  };

  // Pre-select category if passed in URL query e.g. /book?category=xxx
  // Use setData + setStep directly to avoid stale closure issues with handleNext
  useEffect(() => {
    if (!categoryParam || categoryGroups.length === 0 || data.categoryId || step !== 1) return;

    const match = categoryGroups.find(
      g => g.category._id === categoryParam || g.category.slug === categoryParam
    );
    if (!match) return;

    const cat = match.category;
    const facs = match.facilities || [];

    // Aggregate pricing tiers
    const tiersMap = new Map<number, { persons: number; hourlyRate: number; halfHourRate?: number }>();
    facs.forEach((f: any) => {
      if (f.pricingTiers && f.pricingTiers.length > 0) {
        f.pricingTiers.forEach((pt: any) => {
          if (!tiersMap.has(pt.persons)) tiersMap.set(pt.persons, pt);
        });
      }
    });
    const tiers = Array.from(tiersMap.values()).sort((a, b) => a.persons - b.persons);

    setData((prev: any) => ({
      ...prev,
      categoryId: cat._id,
      categoryName: cat.name,
      categorySlug: cat.slug,
      categoryIcon: cat.icon,
      minRate: match.minRate === Infinity ? 0 : match.minRate,
      maxRate: match.maxRate,
      halfHourRate: facs[0]?.halfHourRate || (match.minRate !== Infinity ? Math.round(match.minRate * 0.5) : 0),
      unitCount: facs.length,
      pricingTiers: tiers,
      personCount: tiers[0]?.persons || 1,
      duration: 60,
    }));
    setStep(2);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryParam, categoryGroups]);

  // Category-based availability (Step 3)
  const { data: availData, isLoading: loadingAvailability } = useAvailabilityByCategory(
    data.categoryId, data.date
  );

  // Fetch games associated with this experience category
  const { data: categoryGamesRes, isLoading: loadingGames } = useQuery({
    queryKey: ['games-category-booking', data.categoryId],
    queryFn: () => gamesApi.list({ facilityCategory: data.categoryId, active: true }).then(r => r.data.data),
    enabled: !!data.categoryId,
  });
  const categoryGames = categoryGamesRes || [];

  const getTodayDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Scroll to top whenever step changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [step]);

  const [detailsTouched, setDetailsTouched] = useState<Record<string, boolean>>({});
  const [detailsErrors, setDetailsErrors] = useState<Record<string, string | null>>({});

  const validateDetailsField = (field: string, value: string) => {
    let err: string | null = null;
    if (field === 'name') err = validateName(value);
    if (field === 'phone') err = validatePhone(value);
    if (field === 'email') err = validateEmail(value, false);
    setDetailsErrors(prev => ({ ...prev, [field]: err }));
    return err;
  };

  const handleDetailsBlur = (field: string) => {
    setDetailsTouched(prev => ({ ...prev, [field]: true }));
    validateDetailsField(field, (data as any)[field] || '');
  };

  const handleDetailsChange = (field: string, value: string) => {
    setData((prev: any) => ({ ...prev, [field]: value }));
    if (detailsTouched[field]) {
      validateDetailsField(field, value);
    }
  };

  const { mutate: createBooking, isPending } = useCreateBooking();

  const handleNext = () => {
    if (step === 1) {
      if (!data.categoryId) {
        setError('Please select an experience category to proceed.');
        return;
      }
    }
    if (step === 2) {
      const todayStr = getTodayDateString();
      if (!data.date || data.date < todayStr) {
        setError('Please select today or an upcoming date to proceed.');
        return;
      }
    }
    if (step === 3) {
      if (!data.startTime) {
        setError('Please select an available start time slot to proceed.');
        return;
      }
    }
    if (step === 4) {
      setDetailsTouched({ name: true, phone: true, email: true });
      const nameErr = validateName(data.name || '');
      const phoneErr = validatePhone(data.phone || '');
      const emailErr = validateEmail(data.email || '', false);
      setDetailsErrors({ name: nameErr, phone: phoneErr, email: emailErr });
      if (nameErr || phoneErr || emailErr) {
        setError(nameErr || phoneErr || emailErr || 'Please fill in your details correctly.');
        return;
      }
    }
    setError('');
    setStep(s => s + 1);
  };
  const handleBack = () => { setError(''); setStep(s => s - 1); };

  // Determine active rate and total based on selected controllers/tier and duration
  const activeTier = useMemo(() => {
    if (!data.pricingTiers || data.pricingTiers.length === 0) return null;
    return data.pricingTiers.find((t: any) => t.persons === (data.personCount || 1)) || data.pricingTiers[0];
  }, [data.pricingTiers, data.personCount]);

  const activeHourlyRate = activeTier?.hourlyRate || data.minRate || 1000;

  const estimatedTotal = useMemo(() => {
    const duration = data.duration || 60;
    if (activeTier) {
      if (duration === 30 && activeTier.halfHourRate) {
        return activeTier.halfHourRate;
      }
      return Math.round(activeTier.hourlyRate * (duration / 60));
    }
    if (data.minRate) {
      if (duration === 30 && data.halfHourRate) {
        return data.halfHourRate;
      }
      return Math.round((data.minRate / 60) * duration);
    }
    return 0;
  }, [activeTier, data.duration, data.minRate, data.halfHourRate]);

  const handleSubmit = () => {
    setError('');
    const nameErr = validateName(data.name || '');
    const phoneErr = validatePhone(data.phone || '');
    const emailErr = validateEmail(data.email || '', false);
    if (nameErr || phoneErr || emailErr) {
      setStep(4);
      setDetailsTouched({ name: true, phone: true, email: true });
      setDetailsErrors({ name: nameErr, phone: phoneErr, email: emailErr });
      setError(nameErr || phoneErr || emailErr || 'Please check your details.');
      return;
    }
    if (!data.date || data.date < getTodayDateString()) {
      setStep(2);
      setError('Please select a valid upcoming date.');
      return;
    }
    if (!data.startTime) {
      setStep(3);
      setError('Please choose a session start time.');
      return;
    }
    const fullNotes = [
      data.preferredGame ? `Preferred Game: ${data.preferredGame}` : '',
      data.notes || '',
    ].filter(Boolean).join(' | ');

    const payload = {
      categoryId: data.categoryId,
      date: data.date,
      startTime: data.startTime,
      durationMinutes: Number(data.duration || 60),
      duration: Number(data.duration || 60),
      personCount: Number(data.personCount || 1),
      customerName: data.name,
      customerPhone: data.phone,
      customerEmail: data.email || undefined,
      name: data.name,
      phone: data.phone,
      email: data.email || undefined,
      notes: fullNotes || undefined,
      source: 'website',
      bookingSource: 'website',
    };

    createBooking(payload, {
      onSuccess: (res: any) => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        setSuccessData(res.data?.data || res.data || {
          ...payload,
          categoryName: data.categoryName,
          preferredGame: data.preferredGame,
          total: estimatedTotal,
        });
      },
      onError: (err: any) => {
        setError(err.response?.data?.message || err.message || 'Failed to complete booking. Please try again.');
      }
    });
  };

  if (successData) {
    return (
      <BookingConfirmation
        booking={{
          ...successData,
          categoryName: data.categoryName,
          personCount: data.personCount,
          preferredGame: data.preferredGame,
          total: successData.total || estimatedTotal,
        }}
        onReset={() => {
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
          setStep(1);
          setData({ duration: 60, personCount: 1 });
          setSuccessData(null);
        }}
      />
    );
  }

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', background: '#111111', border: '1px solid #2a2a2a', borderRadius: '16px', overflow: 'hidden' }}>

      {/* Step Header */}
      <div style={{ padding: '24px 32px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto' }}>
        {STEPS.map((label, i) => (
          <React.Fragment key={i}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <div style={{
                width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: step >= i + 1 ? '#c0c0c0' : '#1a1a1a',
                color: step >= i + 1 ? '#000' : '#4b4b4b',
                fontSize: '0.72rem', fontWeight: 800,
              }}>{i + 1}</div>
              <span style={{ fontSize: '0.78rem', fontWeight: step === i + 1 ? 700 : 500, color: step >= i + 1 ? '#ffffff' : '#4b4b4b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && <div style={{ flex: 1, minWidth: '16px', height: '1px', background: step > i + 1 ? '#c0c0c0' : '#2a2a2a', flexShrink: 0 }} />}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <div style={{ padding: '32px' }}>

        {/* STEP 1 — Choose Experience */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginBottom: '6px' }}>Choose Experience</h2>
            <p style={{ fontSize: '0.85rem', color: '#6b6b6b', marginBottom: '28px' }}>
              Select the experience you want to book. We'll assign the best available station for you.
            </p>
            {(loadingFacilities || loadingCategories) ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{ height: '140px', background: '#161616', borderRadius: '12px' }} />
                ))}
              </div>
            ) : categoryGroups.length === 0 ? (
              <p style={{ color: '#6b6b6b', textAlign: 'center', padding: '40px' }}>No experiences available right now. Please check back later.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                {categoryGroups.map((group) => {
                  const cat = group.category;
                  const isSelected = data.categoryId === cat._id;
                  const icon = getCategoryIcon(cat.slug);
                  const image = cat.image || group.facilities.find(f => f.images?.[0])?.images?.[0];

                  return (
                    <div
                      key={cat._id}
                      onClick={() => handleSelectCategory(group)}
                      style={{
                        background: isSelected ? '#c0c0c010' : '#161616',
                        border: `1px solid ${isSelected ? '#c0c0c0' : '#2a2a2a'}`,
                        borderRadius: '12px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = '#3a3a3a'; }}
                      onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = '#2a2a2a'; }}
                    >
                      <div style={{ height: '110px', background: '#0a0a0a', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {image ? (
                          <img src={image} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '2.5rem', opacity: 0.45 }}>{icon}</span>
                        )}
                        {isSelected && (
                          <div style={{ position: 'absolute', top: '8px', right: '8px', background: '#c0c0c0', color: '#000', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900 }}>
                            ✓
                          </div>
                        )}
                      </div>
                      <div style={{ padding: '16px' }}>
                        <h3 style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.95rem', marginBottom: '4px' }}>{cat.name}</h3>
                        <p style={{ fontSize: '0.7rem', color: '#4b4b4b', margin: 0 }}>
                          {group.facilities.length} {group.facilities.length === 1 ? 'unit' : 'units'} available
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STEP 2 — Select Date */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginBottom: '6px' }}>Select Date</h2>
            <p style={{ fontSize: '0.85rem', color: '#6b6b6b', marginBottom: '20px' }}>
              Choose the date for your <strong style={{ color: '#c0c0c0' }}>{data.categoryName}</strong> session.
            </p>

            {/* Quick date shortcuts for mobile/iPhone tap */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  const todayStr = getTodayDateString();
                  setError('');
                  setData({ ...data, date: todayStr, startTime: '' });
                }}
                style={{
                  padding: '8px 16px',
                  background: data.date === getTodayDateString() ? '#c0c0c0' : '#181818',
                  color: data.date === getTodayDateString() ? '#000000' : '#c0c0c0',
                  border: `1px solid ${data.date === getTodayDateString() ? '#c0c0c0' : '#2a2a2a'}`,
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                Today
              </button>

              <button
                type="button"
                onClick={() => {
                  const tom = new Date();
                  tom.setDate(tom.getDate() + 1);
                  const y = tom.getFullYear();
                  const m = String(tom.getMonth() + 1).padStart(2, '0');
                  const d = String(tom.getDate()).padStart(2, '0');
                  const tomStr = `${y}-${m}-${d}`;
                  setError('');
                  setData({ ...data, date: tomStr, startTime: '' });
                }}
                style={{
                  padding: '8px 16px',
                  background: (() => {
                    const tom = new Date();
                    tom.setDate(tom.getDate() + 1);
                    const tomStr = `${tom.getFullYear()}-${String(tom.getMonth() + 1).padStart(2, '0')}-${String(tom.getDate()).padStart(2, '0')}`;
                    return data.date === tomStr ? '#c0c0c0' : '#181818';
                  })(),
                  color: (() => {
                    const tom = new Date();
                    tom.setDate(tom.getDate() + 1);
                    const tomStr = `${tom.getFullYear()}-${String(tom.getMonth() + 1).padStart(2, '0')}-${String(tom.getDate()).padStart(2, '0')}`;
                    return data.date === tomStr ? '#000000' : '#c0c0c0';
                  })(),
                  border: `1px solid ${(() => {
                    const tom = new Date();
                    tom.setDate(tom.getDate() + 1);
                    const tomStr = `${tom.getFullYear()}-${String(tom.getMonth() + 1).padStart(2, '0')}-${String(tom.getDate()).padStart(2, '0')}`;
                    return data.date === tomStr ? '#c0c0c0' : '#2a2a2a';
                  })()}`,
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                Tomorrow
              </button>
            </div>

            <input
              type="date"
              min={getTodayDateString()}
              max={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              value={data.date || ''}
              onChange={e => {
                const selected = e.target.value;
                const todayStr = getTodayDateString();
                if (!selected) {
                  setData({ ...data, date: '', startTime: '' });
                  return;
                }
                if (selected < todayStr) {
                  setError('Previous dates cannot be selected. Please choose today or an upcoming date.');
                  setData({ ...data, date: todayStr, startTime: '' });
                  return;
                }
                setError('');
                setData({ ...data, date: selected, startTime: '' });
              }}
              onBlur={e => {
                const selected = e.target.value;
                const todayStr = getTodayDateString();
                if (selected && selected < todayStr) {
                  setError('Previous dates cannot be selected. Reset to today.');
                  setData({ ...data, date: todayStr, startTime: '' });
                }
              }}
              style={{
                display: 'block',
                padding: '14px 18px',
                background: '#0a0a0a',
                border: '1px solid #3a3a3a',
                borderRadius: '10px',
                color: '#ffffff',
                fontSize: '1.1rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
                colorScheme: 'dark',
                marginBottom: '12px',
              }}
            />

            {error && step === 2 && (
              <div style={{ background: '#8b202020', border: '1px solid #8b202050', borderRadius: '8px', padding: '10px 14px', color: '#ff8080', fontSize: '0.82rem', marginBottom: '14px' }}>
                {error}
              </div>
            )}

            {data.date && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#c0c0c010', border: '1px solid #c0c0c030', borderRadius: '8px', padding: '8px 14px', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: '#c0c0c0', fontWeight: 700 }}>
                  {new Date(data.date + 'T00:00:00').toLocaleDateString('en-LK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
            )}

            {/* INCLUDED GAMES IN THIS CATEGORY — DISPLAY ONLY */}
            {categoryGames.length > 0 && (
              <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid #1f1f1f' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <Gamepad2 size={16} style={{ color: '#c0c0c0' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Games Available on {data.categoryName || 'this setup'}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#6b6b6b', marginLeft: '4px' }}>
                    · Hover to see titles
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '12px',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  padding: '8px 2px',
                }}>
                  {categoryGames.map((game: any) => (
                    <GameIconTile
                      key={game._id || game.id}
                      game={game}
                    />
                  ))}
                </div>
              </div>
            )}


            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
              <button onClick={handleBack} style={BTN_SECONDARY}>Back</button>
              <button
                disabled={!data.date || data.date < getTodayDateString()}
                onClick={handleNext}
                style={{
                  ...BTN_PRIMARY,
                  background: (data.date && data.date >= getTodayDateString()) ? '#c0c0c0' : '#2a2a2a',
                  color: (data.date && data.date >= getTodayDateString()) ? '#000' : '#4b4b4b',
                  cursor: (data.date && data.date >= getTodayDateString()) ? 'pointer' : 'not-allowed',
                }}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Select Time & Duration */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginBottom: '6px' }}>Time & Duration</h2>
            <p style={{ fontSize: '0.85rem', color: '#6b6b6b', marginBottom: '20px' }}>
              {data.pricingTiers && data.pricingTiers.length > 1
                ? 'Select your session time, duration, and number of controllers.'
                : 'Select your session time and duration.'}
            </p>

            {/* CONTROLLER COUNT SELECTOR (Only shown for multi-controller experiences like PS5) */}
            {data.pricingTiers && data.pricingTiers.length > 1 && (
              <div style={{ marginBottom: '28px', background: '#0a0a0a', border: '1px solid #242424', borderRadius: '12px', padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Gamepad2 size={16} style={{ color: '#c0c0c0' }} />
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                    How many controllers?
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {data.pricingTiers.map((tier: any) => {
                    const isSelected = (data.personCount || 1) === tier.persons;
                    return (
                      <button
                        key={tier.persons}
                        type="button"
                        onClick={() => setData({ ...data, personCount: tier.persons })}
                        style={{
                          padding: '12px 18px',
                          background: isSelected ? '#c0c0c0' : '#161616',
                          border: `1px solid ${isSelected ? '#c0c0c0' : '#2a2a2a'}`,
                          borderRadius: '8px',
                          color: isSelected ? '#000000' : '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                          minWidth: '110px',
                          transition: 'all 0.15s',
                        }}
                      >
                        <span style={{ fontWeight: 800 }}>
                          {tier.persons === 1 ? '1 Controller' : `${tier.persons} Controllers`}
                        </span>
                        <span style={{ fontSize: '0.72rem', opacity: isSelected ? 0.85 : 0.6, fontWeight: 600 }}>
                          Rs. {tier.hourlyRate.toLocaleString()}/hr
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Duration selector */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#8b8b8b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px', display: 'block' }}>
                Session Duration
              </label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {(() => {
                  const min = Math.max(30, availData?.minDuration || 30);
                  const max = Math.max(min, availData?.maxDuration || 240);
                  // Clean standard 30-minute intervals (30 Mins, 1 Hour, 1.5 Hours, 2 Hours, etc.)
                  const opts: number[] = [];
                  for (let d = min; d <= max; d += 30) {
                    opts.push(d);
                  }
                  const finalOpts = opts.length ? opts : [30, 60, 90, 120, 180, 240];
                  return finalOpts.map((d: number) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setData({ ...data, duration: d, startTime: '' })}
                      style={{
                        padding: '10px 18px',
                        background: data.duration === d ? '#c0c0c0' : '#161616',
                        border: `1px solid ${data.duration === d ? '#c0c0c0' : '#2a2a2a'}`,
                        borderRadius: '8px',
                        color: data.duration === d ? '#000000' : '#c0c0c0',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {formatDurationLabel(d)}
                    </button>
                  ));
                })()}
              </div>
            </div>

            {/* Time slots — from category availability */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#8b8b8b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px', display: 'block' }}>
                Available Times
                {availData?.totalUnits && (
                  <span style={{ marginLeft: '8px', color: '#4b4b4b', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>
                    ({availData.totalUnits} station{availData.totalUnits > 1 ? 's' : ''} available)
                  </span>
                )}
              </label>
              {loadingAvailability ? (
                <div style={{ height: '80px', background: '#161616', borderRadius: '8px' }} />
              ) : !availData?.slots?.length ? (
                <p style={{ color: '#6b6b6b', fontSize: '0.85rem' }}>No time slots available for this date. Please try another day.</p>
              ) : (
                (() => {
                  // Compute close boundary from availData
                  const [ch, cm] = (availData?.closeTime || '23:59').split(':').map(Number);
                  const closeMinutes = ch * 60 + cm;
                  const selectedDuration = data.duration || 60;

                  // Augment each slot: also mark unavailable if it would exceed closing time
                  const slotsWithClose = availData.slots.map((slot: any) => {
                    const [sh, sm] = slot.time.split(':').map(Number);
                    const slotStartMins = sh * 60 + sm;
                    const exceedsClosing = slotStartMins + selectedDuration > closeMinutes;
                    return { ...slot, available: slot.available && !exceedsClosing };
                  });

                  const allUnavailable = slotsWithClose.every((s: any) => !s.available);

                  return (
                    <>
                      {allUnavailable && (
                        <div style={{
                          background: '#b3393918',
                          border: '1px solid #b3393950',
                          borderRadius: '8px',
                          padding: '12px 16px',
                          marginBottom: '16px',
                          color: '#ff8585',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                        }}>
                          All session slots for this date have already passed or are fully booked. Please go back to Step 2 and choose an upcoming date.
                        </div>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))', gap: '10px' }}>
                        {slotsWithClose.map((slot: any, i: number) => (
                          <button key={i} disabled={!slot.available} onClick={() => setData({ ...data, startTime: slot.time })}
                            style={{
                              padding: '11px 0', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, cursor: slot.available ? 'pointer' : 'not-allowed',
                              background: data.startTime === slot.time ? '#c0c0c0' : slot.available ? '#161616' : '#0d0d0d',
                              border: `1px solid ${data.startTime === slot.time ? '#c0c0c0' : slot.available ? '#2a2a2a' : '#1a1a1a'}`,
                              color: data.startTime === slot.time ? '#000' : slot.available ? '#c0c0c0' : '#3a3a3a',
                              textDecoration: !slot.available ? 'line-through' : 'none',
                            }}>
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    </>
                  );
                })()
              )}
            </div>

            {/* Estimated rate & total box */}
            <div style={{ background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '14px 18px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ color: '#6b6b6b', fontSize: '0.75rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {data.pricingTiers && data.pricingTiers.length > 1
                    ? `Rate (${data.personCount || 1} Controller${Number(data.personCount || 1) > 1 ? 's' : ''})`
                    : 'Session Rate'}
                </span>
                <span style={{ color: '#c0c0c0', fontWeight: 700, fontSize: '0.88rem' }}>
                  Rs. {activeHourlyRate.toLocaleString()}/hr
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: '#6b6b6b', fontSize: '0.75rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Total for {formatDurationLabel(data.duration || 60)}
                </span>
                <span style={{ color: '#ffffff', fontWeight: 900, fontSize: '1.2rem' }}>
                  Rs. {estimatedTotal.toLocaleString()}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button onClick={handleBack} style={BTN_SECONDARY}>Back</button>
              <button disabled={!data.startTime} onClick={handleNext}
                style={{ ...BTN_PRIMARY, background: data.startTime ? '#c0c0c0' : '#2a2a2a', color: data.startTime ? '#000' : '#4b4b4b', cursor: data.startTime ? 'pointer' : 'not-allowed' }}>
                Next →
              </button>
            </div>
          </div>
        )}

        {/* STEP 4 — Your Details */}
        {step === 4 && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginBottom: '6px' }}>Your Details</h2>
            <p style={{ fontSize: '0.85rem', color: '#6b6b6b', marginBottom: '24px' }}>No account needed. Just your name and phone number.</p>
            <div style={{ maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Full Name */}
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#8b8b8b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px', display: 'block' }}>
                  Full Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  placeholder="e.g. John Perera"
                  value={data.name || ''}
                  onChange={e => handleDetailsChange('name', e.target.value)}
                  onBlur={() => handleDetailsBlur('name')}
                  style={{
                    ...INPUT_STYLE,
                    borderColor: detailsTouched.name && detailsErrors.name ? '#ef4444' : detailsTouched.name && !detailsErrors.name && data.name ? '#22c55e60' : '#2a2a2a',
                  }}
                />
                {detailsTouched.name && detailsErrors.name && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', color: '#ff8080', fontSize: '0.78rem', fontWeight: 600 }}>
                    <AlertCircle size={14} style={{ flexShrink: 0 }} />
                    <span>{detailsErrors.name}</span>
                  </div>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#8b8b8b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px', display: 'block' }}>
                  Phone Number <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  placeholder="077 XXX XXXX"
                  value={data.phone || ''}
                  onChange={e => handleDetailsChange('phone', e.target.value)}
                  onBlur={() => handleDetailsBlur('phone')}
                  style={{
                    ...INPUT_STYLE,
                    borderColor: detailsTouched.phone && detailsErrors.phone ? '#ef4444' : detailsTouched.phone && !detailsErrors.phone && data.phone ? '#22c55e60' : '#2a2a2a',
                  }}
                />
                {detailsTouched.phone && detailsErrors.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', color: '#ff8080', fontSize: '0.78rem', fontWeight: 600 }}>
                    <AlertCircle size={14} style={{ flexShrink: 0 }} />
                    <span>{detailsErrors.phone}</span>
                  </div>
                )}
              </div>

              {/* Email (Optional) */}
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#8b8b8b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px', display: 'block' }}>
                  Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={data.email || ''}
                  onChange={e => handleDetailsChange('email', e.target.value)}
                  onBlur={() => handleDetailsBlur('email')}
                  style={{
                    ...INPUT_STYLE,
                    borderColor: detailsTouched.email && detailsErrors.email ? '#ef4444' : detailsTouched.email && !detailsErrors.email && data.email ? '#22c55e60' : '#2a2a2a',
                  }}
                />
                {detailsTouched.email && detailsErrors.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', color: '#ff8080', fontSize: '0.78rem', fontWeight: 600 }}>
                    <AlertCircle size={14} style={{ flexShrink: 0 }} />
                    <span>{detailsErrors.email}</span>
                  </div>
                )}
              </div>

              {/* Special Requests (Optional) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#8b8b8b', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block' }}>
                    Special Requests (Optional)
                  </label>
                  <span style={{ fontSize: '0.7rem', color: '#6b6b6b', fontFamily: 'monospace' }}>
                    {(data.notes || '').length}/500
                  </span>
                </div>
                <textarea
                  placeholder="Anything we should know? (e.g. birthday setup, preferred games, controller count)"
                  rows={3}
                  maxLength={500}
                  value={data.notes || ''}
                  onChange={e => setData({ ...data, notes: e.target.value })}
                  style={{ ...INPUT_STYLE, resize: 'vertical' } as React.CSSProperties}
                />
              </div>
            </div>

            {error && step === 4 && (
              <div style={{ background: '#8b202020', border: '1px solid #8b202050', borderRadius: '8px', padding: '10px 14px', color: '#ff8080', fontSize: '0.82rem', marginTop: '16px' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
              <button onClick={handleBack} style={BTN_SECONDARY}>Back</button>
              <button
                onClick={handleNext}
                style={{
                  ...BTN_PRIMARY,
                  background: (data.name && data.phone && !detailsErrors.name && !detailsErrors.phone) ? '#c0c0c0' : '#2a2a2a',
                  color: (data.name && data.phone && !detailsErrors.name && !detailsErrors.phone) ? '#000' : '#6b6b6b',
                  cursor: 'pointer',
                }}
              >
                Review Booking →
              </button>
            </div>
          </div>
        )}

        {/* STEP 5 — Confirm */}
        {step === 5 && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginBottom: '6px' }}>Confirm Your Booking</h2>
            <p style={{ fontSize: '0.85rem', color: '#6b6b6b', marginBottom: '24px' }}>Review your details before we secure your spot.</p>
            <div style={{ background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
              {[
                { label: 'Experience', value: data.categoryName },
                ...(data.pricingTiers && data.pricingTiers.length > 1 ? [
                  { label: 'Controllers', value: `${data.personCount || 1} Controller${Number(data.personCount || 1) > 1 ? 's' : ''}` }
                ] : []),
                { label: 'Rate Applied', value: `Rs. ${activeHourlyRate.toLocaleString()}/hr` },
                { label: 'Date', value: data.date ? new Date(data.date + 'T00:00:00').toLocaleDateString('en-LK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '' },
                { label: 'Time', value: data.startTime },
                { label: 'Duration', value: formatDurationLabel(data.duration || 60) },
                { label: 'Name', value: data.name },
                { label: 'Phone', value: data.phone },
                { label: 'Estimated Total', value: `Rs. ${estimatedTotal.toLocaleString()}` },
              ].map((row: any, i, arr) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '13px 0', borderBottom: i < arr.length - 1 ? '1px solid #1a1a1a' : 'none' }}>
                  <span style={{ fontSize: '0.82rem', color: '#6b6b6b' }}>{row.label}</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: row.label === 'Estimated Total' ? '#2d7a4f' : '#ffffff' }}>{row.value}</span>
                </div>
              ))}
            </div>
            <div style={{ background: '#3d85c810', border: '1px solid #3d85c840', borderRadius: '10px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <span style={{ fontSize: '1.1rem' }}>💳</span>
              <div>
                <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#3d85c8', marginBottom: '2px' }}>Payment: Pay at Venue</p>
                <p style={{ fontSize: '0.75rem', color: '#6b6b6b' }}>No online payment required. Pay on arrival at Atrios.</p>
              </div>
            </div>
            {error && (
              <div style={{ background: '#8b202020', border: '1px solid #8b202050', borderRadius: '8px', padding: '12px 16px', color: '#ff8080', fontSize: '0.85rem', marginBottom: '16px' }}>
                {error}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={handleBack} style={BTN_SECONDARY}>Back</button>
              <button onClick={handleSubmit} disabled={isPending}
                style={{ ...BTN_PRIMARY, opacity: isPending ? 0.7 : 1, cursor: isPending ? 'wait' : 'pointer' }}>
                {isPending ? 'Securing your spot...' : '✓ Confirm Booking'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
