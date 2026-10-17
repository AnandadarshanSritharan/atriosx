import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { facilitiesApi } from '@/api/facilities';
import { gamesApi } from '@/api/games';
import { useAvailabilityByCategory, useCreateBooking } from '@/hooks/useBookings';
import BookingConfirmation from './BookingConfirmation';
import { Users, Gamepad2 } from 'lucide-react';


const STEPS = ['Experience', 'Date', 'Time & Players', 'Details', 'Confirm'];

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

    // Aggregate person pricing tiers across facilities in this category
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

    let tiers = Array.from(tiersMap.values()).sort((a, b) => a.persons - b.persons);

    // If no explicit tiers defined, generate default tiers
    if (tiers.length === 0) {
      const minP = Math.min(...facs.map((f: any) => f.minPersons || 1));
      const maxP = Math.max(...facs.map((f: any) => f.maxPersons || 4));
      for (let p = minP; p <= maxP; p++) {
        tiers.push({
          persons: p,
          hourlyRate: group.minRate,
          halfHourRate: Math.round(group.minRate * 0.6),
        });
      }
    }

    const defaultPerson = tiers[0]?.persons || 1;

    setData({
      ...data,
      categoryId: cat._id,
      categoryName: cat.name,
      categorySlug: cat.slug,
      categoryIcon: cat.icon,
      minRate: group.minRate === Infinity ? 0 : group.minRate,
      maxRate: group.maxRate,
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
    let tiers = Array.from(tiersMap.values()).sort((a, b) => a.persons - b.persons);
    if (tiers.length === 0) {
      const minP = Math.min(...facs.map((f: any) => f.minPersons || 1));
      const maxP = Math.max(...facs.map((f: any) => f.maxPersons || 4));
      for (let p = minP; p <= maxP; p++) {
        tiers.push({ persons: p, hourlyRate: match.minRate, halfHourRate: Math.round(match.minRate * 0.6) });
      }
    }

    setData((prev: any) => ({
      ...prev,
      categoryId: cat._id,
      categoryName: cat.name,
      categorySlug: cat.slug,
      categoryIcon: cat.icon,
      minRate: match.minRate === Infinity ? 0 : match.minRate,
      maxRate: match.maxRate,
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

  const { mutate: createBooking, isPending } = useCreateBooking();

  const handleNext = () => { setError(''); setStep(s => s + 1); };
  const handleBack = () => { setError(''); setStep(s => s - 1); };

  // Determine active rate and total based on selected personCount and duration
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
      return Math.round((data.minRate / 60) * duration);
    }
    return 0;
  }, [activeTier, data.duration, data.minRate]);

  const handleSubmit = () => {
    setError('');
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
        onReset={() => { setStep(1); setData({ duration: 60, personCount: 1 }); setSuccessData(null); }}
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                {categoryGroups.map((group) => {
                  const cat = group.category;
                  const isSelected = data.categoryId === cat._id;
                  const icon = getCategoryIcon(cat.slug);
                  const priceLabel = group.minRate === group.maxRate
                    ? `Rs. ${group.minRate.toLocaleString()}/hr`
                    : `From Rs. ${group.minRate.toLocaleString()}/hr`;

                  return (
                    <div
                      key={cat._id}
                      onClick={() => handleSelectCategory(group)}
                      style={{
                        background: isSelected ? '#c0c0c010' : '#161616',
                        border: `1px solid ${isSelected ? '#c0c0c0' : '#2a2a2a'}`,
                        borderRadius: '12px',
                        padding: '24px 20px',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = '#3a3a3a'; }}
                      onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = '#2a2a2a'; }}
                    >
                      <div style={{ fontSize: '2rem', marginBottom: '12px' }}>{icon}</div>
                      <h3 style={{ fontWeight: 800, color: '#ffffff', fontSize: '1rem', marginBottom: '6px' }}>{cat.name}</h3>
                      <p style={{ fontSize: '0.75rem', color: '#c0c0c0', fontWeight: 600, marginBottom: '4px' }}>{priceLabel}</p>
                      <p style={{ fontSize: '0.7rem', color: '#4b4b4b' }}>
                        {group.facilities.length} {group.facilities.length === 1 ? 'unit' : 'units'} available
                      </p>
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
            <p style={{ fontSize: '0.85rem', color: '#6b6b6b', marginBottom: '24px' }}>
              Choose the date for your <strong style={{ color: '#c0c0c0' }}>{data.categoryName}</strong> session.
            </p>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              max={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              value={data.date || ''}
              onChange={e => setData({ ...data, date: e.target.value })}
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
              <button disabled={!data.date} onClick={handleNext}
                style={{ ...BTN_PRIMARY, background: data.date ? '#c0c0c0' : '#2a2a2a', color: data.date ? '#000' : '#4b4b4b', cursor: data.date ? 'pointer' : 'not-allowed' }}>
                Next →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Select Time, Duration & Players */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginBottom: '6px' }}>Time, Duration & Players</h2>
            <p style={{ fontSize: '0.85rem', color: '#6b6b6b', marginBottom: '20px' }}>
              Configure your group size and session time. Rates update dynamically.
            </p>




            {/* PERSON / PLAYER COUNT SELECTOR */}
            {data.pricingTiers && data.pricingTiers.length > 0 && (
              <div style={{ marginBottom: '28px', background: '#0a0a0a', border: '1px solid #242424', borderRadius: '12px', padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Users size={16} style={{ color: '#c0c0c0' }} />
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                    How many people are playing?
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
                          minWidth: '100px',
                          transition: 'all 0.15s',
                        }}
                      >
                        <span style={{ fontWeight: 800 }}>
                          {tier.persons === 1 ? '1 Person' : `${tier.persons} Persons`}
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
                      onClick={() => setData({ ...data, duration: d })}
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
                <>
                  {availData.slots.every((s: any) => !s.available) && (
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
                  {availData.slots.map((slot: any, i: number) => (
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
              )}
            </div>

            {/* Estimated rate & total box */}
            <div style={{ background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '14px 18px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ color: '#6b6b6b', fontSize: '0.75rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Rate ({data.personCount || 1} {Number(data.personCount || 1) > 1 ? 'Persons' : 'Person'})
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
            <div style={{ maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#8b8b8b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px', display: 'block' }}>Full Name *</label>
                <input placeholder="e.g. John Perera" value={data.name || ''} onChange={e => setData({ ...data, name: e.target.value })} style={INPUT_STYLE} />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#8b8b8b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px', display: 'block' }}>Phone Number *</label>
                <input placeholder="077 XXX XXXX" value={data.phone || ''} onChange={e => setData({ ...data, phone: e.target.value })} style={INPUT_STYLE} />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#8b8b8b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px', display: 'block' }}>Email (Optional)</label>
                <input type="email" placeholder="john@example.com" value={data.email || ''} onChange={e => setData({ ...data, email: e.target.value })} style={INPUT_STYLE} />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#8b8b8b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px', display: 'block' }}>Special Requests (Optional)</label>
                <textarea placeholder="Anything we should know?" rows={3} value={data.notes || ''} onChange={e => setData({ ...data, notes: e.target.value })}
                  style={{ ...INPUT_STYLE, resize: 'vertical' } as React.CSSProperties} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
              <button onClick={handleBack} style={BTN_SECONDARY}>Back</button>
              <button disabled={!data.name || !data.phone} onClick={handleNext}
                style={{ ...BTN_PRIMARY, background: (data.name && data.phone) ? '#c0c0c0' : '#2a2a2a', color: (data.name && data.phone) ? '#000' : '#4b4b4b', cursor: (data.name && data.phone) ? 'pointer' : 'not-allowed' }}>
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
                { label: 'Group Size', value: `${data.personCount || 1} ${Number(data.personCount || 1) > 1 ? 'Persons' : 'Person'}` },

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
