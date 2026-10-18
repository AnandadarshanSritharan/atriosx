import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { facilitiesApi } from '@/api/facilities';
import { PageHeader } from '@/components/shared/PageHeader';
import { Plus, Edit2, Trash2, Layers, Check, X, Image as ImageIcon } from 'lucide-react';
import type { FacilityCategory } from '@/types';

const SLUG_TO_EMOJI: Record<string, string> = {
  'playstation': '🎮', 'playstation-5': '🎮', 'ps5': '🎮',
  'racing-cockpit': '🏎️', 'racing': '🏎️', 'cockpit': '🏎️',
  'table-tennis': '🏓', 'ping-pong': '🏓',
  'carrom': '🪀', 'carrom-board': '🪀',
  'bowling': '🎳', 'vr': '🥽', 'pool': '🎱', 'snooker': '🎱',
};

const MODAL_OVERLAY_STYLE: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.85)',
  backdropFilter: 'blur(4px)',
  zIndex: 9999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
};

const MODAL_BOX_STYLE: React.CSSProperties = {
  background: '#111111',
  border: '1px solid #2a2a2a',
  borderRadius: '16px',
  width: '100%',
  maxWidth: '520px',
  padding: '32px',
  color: '#ffffff',
  boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
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

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FacilityCategory | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '', icon: '🎮', displayOrder: 0, image: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch categories
  const { data: catRes, isLoading } = useQuery({
    queryKey: ['facility-categories-admin'],
    queryFn: () => facilitiesApi.categories.list().then(r => r.data),
  });

  // Fetch facilities to show unit count per category
  const { data: facRes } = useQuery({
    queryKey: ['facilities-admin'],
    queryFn: () => facilitiesApi.list({ includeInactive: true }).then(r => r.data),
  });

  const categories: FacilityCategory[] = (catRes?.data as any) || [];
  const facilities: any[] = (facRes?.data as any) || [];

  // Count units per category
  const facilityCountMap = categories.reduce((acc, cat) => {
    acc[cat._id] = facilities.filter(f => {
      const cId = typeof f.category === 'object' ? f.category?._id : f.category;
      return cId === cat._id;
    }).length;
    return acc;
  }, {} as Record<string, number>);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => facilitiesApi.categories.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-categories-admin'] });
      queryClient.invalidateQueries({ queryKey: ['facility-categories'] });
      queryClient.invalidateQueries({ queryKey: ['facilities-public'] });
    },
  });

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', slug: '', icon: '🎮', displayOrder: categories.length + 1, image: '' });
    setImageFile(null);
    setImagePreview('');
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEditModal = (cat: FacilityCategory) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon || SLUG_TO_EMOJI[cat.slug] || '🎮',
      displayOrder: cat.displayOrder || 0,
      image: cat.image || '',
    });
    setImageFile(null);
    setImagePreview(cat.image || '');
    setErrorMsg('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCategory(null);
    setImageFile(null);
    setImagePreview('');
    setErrorMsg('');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleNameChange = (name: string) => {
    const autoSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    setFormData(prev => ({
      ...prev,
      name,
      slug: editingCategory ? prev.slug : autoSlug,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!formData.name.trim() || !formData.slug.trim()) {
      setErrorMsg('Name and Slug are required');
      return;
    }

    setIsUploading(true);
    try {
      let catId = editingCategory?._id;
      if (editingCategory) {
        await facilitiesApi.categories.update(editingCategory._id, formData);
      } else {
        const createRes = await facilitiesApi.categories.create(formData);
        catId = createRes.data?.data?._id;
      }

      if (imageFile && catId) {
        await facilitiesApi.categories.uploadImage(catId, imageFile);
      }

      queryClient.invalidateQueries({ queryKey: ['facility-categories-admin'] });
      queryClient.invalidateQueries({ queryKey: ['facility-categories'] });
      queryClient.invalidateQueries({ queryKey: ['facilities-public'] });
      closeModal();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to save category');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (cat: FacilityCategory) => {
    const count = facilityCountMap[cat._id] || 0;
    if (count > 0) {
      if (!confirm(`This category has ${count} facility unit(s) assigned to it. Deactivating it will remove it from customer booking options. Proceed?`)) {
        return;
      }
    } else {
      if (!confirm(`Are you sure you want to deactivate "${cat.name}"?`)) return;
    }
    deleteMutation.mutate(cat._id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Experience Categories"
        subtitle="Manage public categories (e.g. PlayStation 5, Racing Cockpit). Facilities you create belong to these categories."
        actions={
          <button
            onClick={openAddModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: '#c0c0c0',
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
          >
            <Plus size={15} /> Add Category
          </button>
        }
      />

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ height: '160px', background: '#111111', borderRadius: '12px' }} />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div style={{ padding: '80px 24px', textAlign: 'center', background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px' }}>
          <Layers size={40} style={{ color: '#4b4b4b', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>No Categories Configured</h3>
          <p style={{ color: '#6b6b6b', marginBottom: '20px', fontSize: '0.85rem' }}>
            Categories group your individual units (like PS5 1, PS5 2) for customer booking.
          </p>
          <button
            onClick={openAddModal}
            style={{ padding: '10px 24px', background: '#c0c0c0', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 700, cursor: 'pointer' }}
          >
            Create First Category
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {categories.map(cat => {
            const unitCount = facilityCountMap[cat._id] || 0;
            const emoji = SLUG_TO_EMOJI[cat.slug?.toLowerCase()] || cat.icon || '🎮';
            const assignedFacilities = facilities.filter(f => {
              const cId = typeof f.category === 'object' ? f.category?._id : f.category;
              return cId === cat._id;
            });

            return (
              <div
                key={cat._id}
                style={{
                  background: '#111111',
                  border: '1px solid #2a2a2a',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'border-color 0.2s',
                }}
              >
                <div>
                  {/* Category Image Banner */}
                  <div
                    style={{
                      height: '140px',
                      background: '#161616',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderBottom: '1px solid #242424',
                    }}
                  >
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt={cat.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', opacity: 0.4 }}>
                        <span style={{ fontSize: '2.5rem' }}>{emoji}</span>
                        <span style={{ fontSize: '0.7rem', color: '#6b6b6b' }}>No real photo uploaded</span>
                      </div>
                    )}
                    <div
                      style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        background: 'rgba(0,0,0,0.85)',
                        backdropFilter: 'blur(8px)',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: '#c0c0c0',
                        border: '1px solid rgba(192,192,192,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>{emoji}</span>
                      <span>{cat.name}</span>
                    </div>
                  </div>

                  <div style={{ padding: '20px 20px 0 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', marginBottom: '2px' }}>{cat.name}</h3>
                        <span style={{ fontSize: '0.72rem', color: '#6b6b6b', fontFamily: 'monospace' }}>slug: {cat.slug}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => openEditModal(cat)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c0c0c0', padding: '6px', borderRadius: '6px' }}
                          title="Edit Category"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(cat)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8b2020', padding: '6px', borderRadius: '6px' }}
                          title="Deactivate Category"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Assigned Facilities list */}
                    <div style={{ background: '#0a0a0a', border: '1px solid #1f1f1f', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#8b8b8b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Assigned Units ({unitCount})
                        </span>
                      </div>

                      {assignedFacilities.length === 0 ? (
                        <p style={{ fontSize: '0.75rem', color: '#4b4b4b', margin: 0, fontStyle: 'italic' }}>
                          No units assigned yet. Edit a facility to assign it here.
                        </p>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {assignedFacilities.map(f => (
                            <span
                              key={f._id}
                              style={{
                                fontSize: '0.72rem',
                                padding: '3px 8px',
                                background: '#161616',
                                border: '1px solid #2a2a2a',
                                borderRadius: '4px',
                                color: f.active ? '#ffffff' : '#6b6b6b',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: f.calendarColor || '#3d85c8' }} />
                              {f.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#6b6b6b', borderTop: '1px solid #1a1a1a', padding: '12px 20px', margin: 0 }}>
                  <span>Order: {cat.displayOrder || 0}</span>
                  <span style={{ color: cat.active ? '#2d7a4f' : '#8b2020', fontWeight: 700 }}>
                    {cat.active ? '● Active' : '○ Inactive'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div style={MODAL_OVERLAY_STYLE} onClick={closeModal}>
          <div style={MODAL_BOX_STYLE} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                {editingCategory ? 'Edit Category' : 'New Category'}
              </h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: '#8b8b8b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {errorMsg && (
                <div style={{ background: '#8b202020', border: '1px solid #8b202050', borderRadius: '8px', padding: '10px 14px', color: '#ff8080', fontSize: '0.82rem' }}>
                  {errorMsg}
                </div>
              )}

              {/* Photo Upload & Preview */}
              <div>
                <label style={LABEL_STYLE}>Real Experience Photo</label>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '100px',
                      height: '70px',
                      borderRadius: '8px',
                      background: '#0a0a0a',
                      border: '1px solid #2a2a2a',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <ImageIcon size={26} style={{ color: '#4b4b4b' }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{
                        width: '100%',
                        color: '#c0c0c0',
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                      }}
                    />
                    <span style={{ display: 'block', marginTop: '6px', fontSize: '0.72rem', color: '#5b5b5b' }}>
                      Upload real photo (e.g. your PS5 setup, racing rig). Shown in Home, Experiences, and Booking pages.
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label style={LABEL_STYLE}>Category Name *</label>
                <input
                  type="text"
                  placeholder="e.g. PlayStation 5, Racing Cockpit, Billiards"
                  value={formData.name}
                  onChange={e => handleNameChange(e.target.value)}
                  style={INPUT_STYLE}
                  required
                />
              </div>

              <div>
                <label style={LABEL_STYLE}>Slug (URL identifier) *</label>
                <input
                  type="text"
                  placeholder="e.g. playstation, racing-cockpit"
                  value={formData.slug}
                  onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  style={INPUT_STYLE}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={LABEL_STYLE}>Icon / Emoji Fallback</label>
                  <input
                    type="text"
                    placeholder="🎮, 🏎️, 🏓, 🪀, 🎱"
                    value={formData.icon}
                    onChange={e => setFormData({ ...formData, icon: e.target.value })}
                    style={INPUT_STYLE}
                  />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Display Order</label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={e => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                    style={INPUT_STYLE}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    padding: '10px 20px',
                    background: 'transparent',
                    border: '1px solid #2a2a2a',
                    borderRadius: '8px',
                    color: '#c0c0c0',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  style={{
                    padding: '10px 24px',
                    background: '#c0c0c0',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#000',
                    fontWeight: 700,
                    cursor: 'pointer',
                    opacity: isUploading ? 0.7 : 1,
                  }}
                >
                  {isUploading ? 'Saving & Uploading...' : editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
