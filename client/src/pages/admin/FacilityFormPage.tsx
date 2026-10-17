import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { facilitiesApi } from '@/api/facilities';
import { useCreateFacility, useUpdateFacility } from '@/hooks/useFacilities';
import { PageHeader } from '@/components/shared/PageHeader';
import { ArrowLeft, Save, Plus, Trash2, Users } from 'lucide-react';
import type { FacilityCategory } from '@/types';

const SLUG_TO_EMOJI: Record<string, string> = {
  'playstation': '🎮', 'playstation-5': '🎮', 'ps5': '🎮',
  'racing-cockpit': '🏎️', 'racing': '🏎️', 'cockpit': '🏎️',
  'table-tennis': '🏓', 'ping-pong': '🏓',
  'carrom': '🪀', 'carrom-board': '🪀',
  'bowling': '🎳', 'vr': '🥽', 'pool': '🎱', 'snooker': '🎱',
};

const COLOR_PRESETS = [
  '#3d85c8', // Blue (PS5)
  '#d4a017', // Gold
  '#2d7a4f', // Green
  '#8b2020', // Red (Racing)
  '#9c27b0', // Purple
  '#ff9800', // Orange
  '#00bcd4', // Cyan
  '#795548', // Brown
];

const CARD_STYLE: React.CSSProperties = {
  background: '#111111',
  border: '1px solid #2a2a2a',
  borderRadius: '14px',
  padding: '28px',
};

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  background: '#0a0a0a',
  border: '1px solid #2a2a2a',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '0.9rem',
  outline: 'none',
  boxSizing: 'border-box',
};

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  fontSize: '0.72rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: '#8b8b8b',
  marginBottom: '6px',
};

export default function FacilityFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<any>({
    name: '',
    category: '',
    hourlyRate: 800,
    halfHourRate: 500,
    pricingTiers: [
      { persons: 1, hourlyRate: 800, halfHourRate: 500 },
      { persons: 2, hourlyRate: 1000, halfHourRate: 600 },
      { persons: 3, hourlyRate: 1200, halfHourRate: 700 },
      { persons: 4, hourlyRate: 1400, halfHourRate: 800 },
    ],
    minPersons: 1,
    maxPersons: 4,
    color: '#3d85c8',
    calendarColor: '#3d85c8',
    active: true,
    bookingEnabled: true,
    minDurationMinutes: 30,
    maxDurationMinutes: 180,
    description: '',
  });

  const [loadingInitial, setLoadingInitial] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch categories
  const { data: catRes, isLoading: loadingCategories } = useQuery({
    queryKey: ['facility-categories-admin'],
    queryFn: () => facilitiesApi.categories.list().then(r => r.data),
  });

  const categories: FacilityCategory[] = (catRes?.data as any) || [];

  const { mutate: create, isPending: creating } = useCreateFacility();
  const { mutate: update, isPending: updating } = useUpdateFacility();

  useEffect(() => {
    if (id) {
      setLoadingInitial(true);
      facilitiesApi.get(id)
        .then(res => {
          const fac = res.data.data;
          const categoryId = typeof fac.category === 'object' ? fac.category?._id : fac.category;
          setFormData({
            ...fac,
            category: categoryId || '',
            color: fac.calendarColor || fac.color || '#3d85c8',
            calendarColor: fac.calendarColor || fac.color || '#3d85c8',
            pricingTiers: fac.pricingTiers && fac.pricingTiers.length > 0 ? fac.pricingTiers : [
              { persons: 1, hourlyRate: fac.hourlyRate || 800, halfHourRate: fac.halfHourRate || 500 },
            ],
            minPersons: fac.minPersons || 1,
            maxPersons: fac.maxPersons || 4,
          });
        })
        .catch(err => {
          setErrorMsg(err.response?.data?.message || 'Failed to load facility');
        })
        .finally(() => setLoadingInitial(false));
    }
  }, [id]);

  // Set default category for new facility once categories load
  useEffect(() => {
    if (!id && !formData.category && categories.length > 0) {
      setFormData((prev: any) => ({ ...prev, category: categories[0]._id }));
    }
  }, [categories, id, formData.category]);

  const handleAddTier = () => {
    const currentTiers = formData.pricingTiers || [];
    const nextPerson = currentTiers.length > 0 ? Math.max(...currentTiers.map((t: any) => t.persons)) + 1 : 1;
    const lastRate = currentTiers.length > 0 ? currentTiers[currentTiers.length - 1].hourlyRate + 200 : formData.hourlyRate || 800;
    setFormData({
      ...formData,
      pricingTiers: [...currentTiers, { persons: nextPerson, hourlyRate: lastRate, halfHourRate: Math.round(lastRate * 0.6) }]
    });
  };

  const handleRemoveTier = (index: number) => {
    const updated = (formData.pricingTiers || []).filter((_: any, i: number) => i !== index);
    setFormData({ ...formData, pricingTiers: updated });
  };

  const handleTierChange = (index: number, field: string, val: number) => {
    const updated = [...(formData.pricingTiers || [])];
    updated[index] = { ...updated[index], [field]: val };
    // If updating 1 person hourlyRate, sync to base hourlyRate
    const baseSync = updated[0]?.persons === 1 ? updated[0].hourlyRate : formData.hourlyRate;
    setFormData({ ...formData, pricingTiers: updated, hourlyRate: baseSync });
  };

  const applyPreset = (preset: string) => {
    if (preset === 'ps5') {
      setFormData({
        ...formData,
        minPersons: 1,
        maxPersons: 4,
        hourlyRate: 800,
        pricingTiers: [
          { persons: 1, hourlyRate: 800, halfHourRate: 500 },
          { persons: 2, hourlyRate: 1000, halfHourRate: 600 },
          { persons: 3, hourlyRate: 1200, halfHourRate: 700 },
          { persons: 4, hourlyRate: 1400, halfHourRate: 800 },
        ],
      });
    } else if (preset === 'duo-quad') {
      setFormData({
        ...formData,
        minPersons: 2,
        maxPersons: 4,
        hourlyRate: 800,
        pricingTiers: [
          { persons: 2, hourlyRate: 800, halfHourRate: 500 },
          { persons: 4, hourlyRate: 1200, halfHourRate: 700 },
        ],
      });
    } else if (preset === 'carrom') {
      setFormData({
        ...formData,
        minPersons: 2,
        maxPersons: 4,
        hourlyRate: 500,
        pricingTiers: [
          { persons: 2, hourlyRate: 500, halfHourRate: 300 },
          { persons: 4, hourlyRate: 800, halfHourRate: 500 },
        ],
      });
    } else if (preset === 'single') {
      setFormData({
        ...formData,
        minPersons: 1,
        maxPersons: 1,
        hourlyRate: 1500,
        pricingTiers: [
          { persons: 1, hourlyRate: 1500, halfHourRate: 900 },
        ],
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name?.trim()) {
      setErrorMsg('Facility name is required');
      return;
    }
    if (!formData.category) {
      setErrorMsg('Please select a category for this facility');
      return;
    }

    // Sort tiers by persons ascending
    const sortedTiers = (formData.pricingTiers || []).slice().sort((a: any, b: any) => a.persons - b.persons);

    const baseHourly = sortedTiers.length > 0 ? sortedTiers[0].hourlyRate : Number(formData.hourlyRate);

    const payload = {
      ...formData,
      category: typeof formData.category === 'object' ? formData.category?._id : formData.category,
      hourlyRate: baseHourly,
      halfHourRate: sortedTiers[0]?.halfHourRate || formData.halfHourRate || undefined,
      pricingTiers: sortedTiers,
      minPersons: Number(formData.minPersons || 1),
      maxPersons: Number(formData.maxPersons || 4),
      minDurationMinutes: Number(formData.minDurationMinutes || 30),
      maxDurationMinutes: Number(formData.maxDurationMinutes || 180),
      calendarColor: formData.color,
    };

    if (id) {
      update({ id, data: payload }, {
        onSuccess: () => navigate('/admin/facilities'),
        onError: (err: any) => setErrorMsg(err.response?.data?.message || 'Failed to update facility'),
      });
    } else {
      create(payload, {
        onSuccess: () => navigate('/admin/facilities'),
        onError: (err: any) => setErrorMsg(err.response?.data?.message || 'Failed to create facility'),
      });
    }
  };

  const isSaving = creating || updating;

  if (loadingInitial) {
    return (
      <div style={{ maxWidth: '680px', margin: '40px auto', padding: '24px', color: '#6b6b6b', textAlign: 'center' }}>
        Loading facility details...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title={id ? `Edit ${formData.name || 'Facility'}` : 'New Facility Unit'}
        subtitle={id ? "Change unit name, category, or player rates" : "Add an individual unit (e.g. PS5 3, Cockpit 2) and configure person-based pricing"}
        actions={
          <button
            type="button"
            onClick={() => navigate('/admin/facilities')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              background: 'transparent',
              border: '1px solid #2a2a2a',
              borderRadius: '8px',
              color: '#c0c0c0',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={15} /> Cancel
          </button>
        }
      />

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {errorMsg && (
          <div style={{ background: '#8b202020', border: '1px solid #8b202050', borderRadius: '8px', padding: '12px 16px', color: '#ff8080', fontSize: '0.85rem' }}>
            {errorMsg}
          </div>
        )}

        {/* UNIT & CATEGORY */}
        <div style={CARD_STYLE}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', marginBottom: '20px', letterSpacing: '0.04em' }}>
            Unit & Category
          </h3>

          {/* Unit Name */}
          <div style={{ marginBottom: '20px' }}>
            <label style={LABEL_STYLE}>Facility Unit Name *</label>
            <input
              type="text"
              placeholder="e.g. PS5 1, PS5 2, PS5 3, Cockpit 1, Carrom Board 2"
              value={formData.name || ''}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              style={INPUT_STYLE}
              required
            />
            <p style={{ fontSize: '0.72rem', color: '#4b4b4b', marginTop: '6px' }}>
              Customers book by category — the system will automatically assign this specific unit.
            </p>
          </div>

          {/* CATEGORY SELECTOR */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ ...LABEL_STYLE, marginBottom: 0 }}>Category (Experience Group) *</label>
              <button
                type="button"
                onClick={() => navigate('/admin/categories')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#c0c0c0',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: 0,
                }}
              >
                <Plus size={12} /> New Category
              </button>
            </div>

            {loadingCategories ? (
              <div style={{ height: '44px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '8px' }} />
            ) : categories.length === 0 ? (
              <div style={{ padding: '12px', background: '#8b202015', border: '1px solid #8b202040', borderRadius: '8px', fontSize: '0.82rem', color: '#ff8080' }}>
                No categories found. Please create a category first in Categories Management.
              </div>
            ) : (
              <select
                value={formData.category || ''}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                style={{
                  ...INPUT_STYLE,
                  cursor: 'pointer',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23c0c0c0%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 14px top 50%',
                  backgroundSize: '10px auto',
                  paddingRight: '36px',
                }}
                required
              >
                <option value="" disabled style={{ background: '#111', color: '#666' }}>-- Select Category --</option>
                {categories.map(cat => {
                  const emoji = SLUG_TO_EMOJI[cat.slug?.toLowerCase()] || cat.icon || '🎮';
                  return (
                    <option key={cat._id} value={cat._id} style={{ background: '#111', color: '#fff' }}>
                      {emoji} {cat.name}
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {/* Description */}
          <div>
            <label style={LABEL_STYLE}>Description</label>
            <textarea
              placeholder="e.g. Sony PS5 with 4K 120Hz display and DualSense wireless controllers."
              rows={3}
              value={formData.description || ''}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              style={{ ...INPUT_STYLE, resize: 'vertical' }}
            />
          </div>
        </div>

        {/* PRICING PER PERSON / TIER PRICING */}
        <div style={CARD_STYLE}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', marginBottom: '4px', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={16} style={{ color: '#c0c0c0' }} /> Pricing Per Person / Players
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#6b6b6b', margin: 0 }}>
                Set different rates depending on how many players or persons use this facility (e.g. 1, 2, 3, 4 players).
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddTier}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: '#161616',
                border: '1px solid #2a2a2a',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Plus size={14} /> Add Person Tier
            </button>
          </div>

          {/* Presets */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px', padding: '12px', background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.72rem', color: '#6b6b6b', display: 'flex', alignItems: 'center', fontWeight: 600 }}>Presets:</span>
            <button
              type="button"
              onClick={() => applyPreset('ps5')}
              style={{ fontSize: '0.72rem', padding: '4px 10px', background: '#161616', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#c0c0c0', cursor: 'pointer' }}
            >
              🎮 PS5 (1 to 4 Players)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('duo-quad')}
              style={{ fontSize: '0.72rem', padding: '4px 10px', background: '#161616', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#c0c0c0', cursor: 'pointer' }}
            >
              🏓 2 or 4 Players
            </button>
            <button
              type="button"
              onClick={() => applyPreset('carrom')}
              style={{ fontSize: '0.72rem', padding: '4px 10px', background: '#161616', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#c0c0c0', cursor: 'pointer' }}
            >
              🪀 Carrom (2 & 4 Players)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('single')}
              style={{ fontSize: '0.72rem', padding: '4px 10px', background: '#161616', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#c0c0c0', cursor: 'pointer' }}
            >
              🏎️ Single Player (1 Person)
            </button>
          </div>

          {/* Tiers List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            {(!formData.pricingTiers || formData.pricingTiers.length === 0) ? (
              <p style={{ color: '#6b6b6b', fontSize: '0.82rem', margin: 0, fontStyle: 'italic' }}>
                No person tiers added. Click "+ Add Person Tier" or a preset above.
              </p>
            ) : (
              formData.pricingTiers.map((tier: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '120px 1fr 1fr 40px',
                    gap: '12px',
                    alignItems: 'center',
                    background: '#0a0a0a',
                    border: '1px solid #242424',
                    borderRadius: '8px',
                    padding: '12px 14px',
                  }}
                >
                  <div>
                    <label style={{ fontSize: '0.68rem', color: '#6b6b6b', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                      Persons
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={tier.persons}
                        onChange={e => handleTierChange(idx, 'persons', Number(e.target.value))}
                        style={{ ...INPUT_STYLE, padding: '8px 10px', fontSize: '0.85rem' }}
                        required
                      />
                      <span style={{ fontSize: '0.78rem', color: '#8b8b8b' }}>p</span>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.68rem', color: '#6b6b6b', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                      Hourly Rate (Rs.)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={tier.hourlyRate ?? ''}
                      onChange={e => handleTierChange(idx, 'hourlyRate', Number(e.target.value))}
                      style={{ ...INPUT_STYLE, padding: '8px 10px', fontSize: '0.85rem' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.68rem', color: '#6b6b6b', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                      Half-Hour Rate (Rs.)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      placeholder="Optional"
                      value={tier.halfHourRate ?? ''}
                      onChange={e => handleTierChange(idx, 'halfHourRate', Number(e.target.value))}
                      style={{ ...INPUT_STYLE, padding: '8px 10px', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '16px' }}>
                    <button
                      type="button"
                      onClick={() => handleRemoveTier(idx)}
                      style={{ background: 'none', border: 'none', color: '#8b2020', cursor: 'pointer', padding: '6px' }}
                      title="Remove Tier"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Min & Max Persons bounds */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid #1a1a1a', paddingTop: '16px' }}>
            <div>
              <label style={LABEL_STYLE}>Minimum Persons Allowed</label>
              <input
                type="number"
                min="1"
                max="20"
                value={formData.minPersons ?? 1}
                onChange={e => setFormData({ ...formData, minPersons: Number(e.target.value) })}
                style={INPUT_STYLE}
              />
            </div>

            <div>
              <label style={LABEL_STYLE}>Maximum Persons Allowed</label>
              <input
                type="number"
                min="1"
                max="20"
                value={formData.maxPersons ?? 4}
                onChange={e => setFormData({ ...formData, maxPersons: Number(e.target.value) })}
                style={INPUT_STYLE}
              />
            </div>
          </div>
        </div>

        {/* DURATION RULES */}
        <div style={CARD_STYLE}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', marginBottom: '20px', letterSpacing: '0.04em' }}>
            Duration Rules
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={LABEL_STYLE}>Min Duration (Minutes)</label>
              <select
                value={formData.minDurationMinutes || 30}
                onChange={e => setFormData({ ...formData, minDurationMinutes: Number(e.target.value) })}
                style={INPUT_STYLE}
              >
                <option value={30} style={{ background: '#111' }}>30 mins</option>
                <option value={60} style={{ background: '#111' }}>60 mins (1 hr)</option>
                <option value={90} style={{ background: '#111' }}>90 mins (1.5 hrs)</option>
              </select>
            </div>

            <div>
              <label style={LABEL_STYLE}>Max Duration (Minutes)</label>
              <select
                value={formData.maxDurationMinutes || 180}
                onChange={e => setFormData({ ...formData, maxDurationMinutes: Number(e.target.value) })}
                style={INPUT_STYLE}
              >
                <option value={120} style={{ background: '#111' }}>120 mins (2 hrs)</option>
                <option value={180} style={{ background: '#111' }}>180 mins (3 hrs)</option>
                <option value={240} style={{ background: '#111' }}>240 mins (4 hrs)</option>
                <option value={360} style={{ background: '#111' }}>360 mins (6 hrs)</option>
              </select>
            </div>
          </div>
        </div>

        {/* DISPLAY & STATUS */}
        <div style={CARD_STYLE}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', marginBottom: '20px', letterSpacing: '0.04em' }}>
            Calendar Appearance & Status
          </h3>

          {/* Color */}
          <div style={{ marginBottom: '20px' }}>
            <label style={LABEL_STYLE}>Calendar Resource Color</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="color"
                value={formData.color || '#3d85c8'}
                onChange={e => setFormData({ ...formData, color: e.target.value, calendarColor: e.target.value })}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  border: '1px solid #2a2a2a',
                  background: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                {COLOR_PRESETS.map(c => (
                  <div
                    key={c}
                    onClick={() => setFormData({ ...formData, color: c, calendarColor: c })}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: c,
                      cursor: 'pointer',
                      border: formData.color === c ? '2px solid #ffffff' : '1px solid transparent',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Switches */}
          <div style={{ display: 'flex', gap: '32px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.85rem', color: '#ffffff' }}>
              <input
                type="checkbox"
                checked={formData.active ?? true}
                onChange={e => setFormData({ ...formData, active: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#c0c0c0' }}
              />
              <span>Unit Active</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.85rem', color: '#ffffff' }}>
              <input
                type="checkbox"
                checked={formData.bookingEnabled ?? true}
                onChange={e => setFormData({ ...formData, bookingEnabled: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#c0c0c0' }}
              />
              <span>Customer Booking Enabled</span>
            </label>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
          <button
            type="button"
            onClick={() => navigate('/admin/facilities')}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: '1px solid #2a2a2a',
              borderRadius: '8px',
              color: '#c0c0c0',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 32px',
              background: '#c0c0c0',
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: isSaving ? 'wait' : 'pointer',
              opacity: isSaving ? 0.7 : 1,
            }}
          >
            <Save size={16} />
            {isSaving ? 'Saving...' : id ? 'Save Facility' : 'Create Facility'}
          </button>
        </div>
      </form>
    </div>
  );
}
