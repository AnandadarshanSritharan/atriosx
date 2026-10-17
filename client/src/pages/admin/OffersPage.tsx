import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { offersApi } from '@/api/offers';
import PageHeader from '@/components/shared/PageHeader';
import { AlertCircle, Tag, Plus } from 'lucide-react';

export default function OffersPage() {
  const queryClient = useQueryClient();
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discountType: 'percentage',
    discountValue: 0,
    code: '',
    startDate: '',
    expiryDate: '',
    active: true,
  });

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const res = await offersApi.list();
      setOffers(res.data?.data || []);
    } catch (err: any) {
      console.error('Failed to load offers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (offer?: any) => {
    setErrorMsg('');
    if (offer) {
      const targetId = offer._id || offer.id;
      setEditingId(targetId);
      const startStr = offer.startDate ? new Date(offer.startDate).toISOString().split('T')[0] : '';
      const expDate = offer.expiryDate || offer.endDate;
      const endStr = expDate ? new Date(expDate).toISOString().split('T')[0] : '';

      setFormData({
        title: offer.title || '',
        description: offer.description || '',
        discountType: offer.discountType || 'percentage',
        discountValue: offer.discountValue || 0,
        code: offer.code || '',
        startDate: startStr,
        expiryDate: endStr,
        active: offer.active ?? true,
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        description: '',
        discountType: 'percentage',
        discountValue: 0,
        code: '',
        startDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        active: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSaving(true);
    try {
      const startIso = formData.startDate ? new Date(formData.startDate).toISOString() : new Date().toISOString();
      const endIso = formData.expiryDate ? new Date(formData.expiryDate).toISOString() : null;

      const dataToSave: any = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue || 0),
        code: formData.code.trim().toUpperCase(),
        startDate: startIso,
        endDate: endIso,
        expiryDate: endIso,
        active: formData.active,
      };

      if (editingId) {
        await offersApi.update(editingId, dataToSave);
      } else {
        await offersApi.create(dataToSave);
      }
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      queryClient.invalidateQueries({ queryKey: ['offers-public'] });
      queryClient.invalidateQueries({ queryKey: ['offers-public-full'] });
      await fetchOffers();
    } catch (err: any) {
      console.error('Error saving offer:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to save offer.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!id) return;
    if (window.confirm('Are you sure you want to delete this offer?')) {
      try {
        await offersApi.delete(id);
        queryClient.invalidateQueries({ queryKey: ['offers'] });
        queryClient.invalidateQueries({ queryKey: ['offers-public'] });
        queryClient.invalidateQueries({ queryKey: ['offers-public-full'] });
        await fetchOffers();
      } catch (err: any) {
        console.error('Error deleting offer:', err);
        alert(err.response?.data?.message || 'Failed to delete offer.');
      }
    }
  };

  const getStatusBadge = (offer: any) => {
    if (!offer.active) {
      return <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, background: '#7a2d2d15', color: '#ff6b6b', border: '1px solid #7a2d2d40' }}>Inactive</span>;
    }
    const now = new Date();
    const start = offer.startDate ? new Date(offer.startDate) : null;
    const end = (offer.expiryDate || offer.endDate) ? new Date(offer.expiryDate || offer.endDate) : null;

    if (end && now > end) {
      return <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, background: '#7a5a2d15', color: '#e6a740', border: '1px solid #7a5a2d40' }}>Expired</span>;
    }
    if (start && now < start) {
      return <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, background: '#2d5a7a15', color: '#4a8ec2', border: '1px solid #2d5a7a40' }}>Upcoming</span>;
    }
    return <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, background: '#2d7a4f15', color: '#2d7a4f', border: '1px solid #2d7a4f40' }}>Active</span>;
  };

  return (
    <div style={{ color: '#ffffff' }}>
      <PageHeader 
        title="Offers Management" 
        actions={
          <button 
            onClick={() => handleOpenModal()} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '10px 20px', 
              background: '#c0c0c0', 
              border: 'none', 
              borderRadius: '8px', 
              color: '#000', 
              fontWeight: 700, 
              cursor: 'pointer' 
            }}
          >
            <Plus size={16} /> Add Offer
          </button>
        }
      />

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6b6b6b' }}>Loading promotional offers...</div>
      ) : offers.length === 0 ? (
        <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '60px 24px', textAlign: 'center' }}>
          <Tag size={40} color="#333333" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.1rem', color: '#ffffff', marginBottom: '8px' }}>No Offers Created Yet</h3>
          <p style={{ fontSize: '0.82rem', color: '#6b6b6b', marginBottom: '20px' }}>Add promotional discounts and special vouchers for your customers.</p>
          <button onClick={() => handleOpenModal()} style={{ padding: '8px 18px', background: '#c0c0c0', border: 'none', borderRadius: '6px', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>
            + Create First Offer
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {offers.map((offer: any) => {
            const offerId = offer._id || offer.id;
            const expDate = offer.expiryDate || offer.endDate;
            return (
              <div key={offerId} style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', gap: '8px' }}>
                  <h3 style={{ margin: '0', fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>{offer.title}</h3>
                  {getStatusBadge(offer)}
                </div>

                {offer.description && (
                  <p style={{ fontSize: '0.8rem', color: '#8b8b8b', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                    {offer.description}
                  </p>
                )}

                <div style={{ marginBottom: '20px', color: '#c0c0c0', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div><strong style={{ color: '#6b6b6b' }}>Code:</strong> {offer.code ? <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#ffffff', background: '#161616', padding: '2px 8px', borderRadius: '4px', border: '1px solid #2a2a2a' }}>{offer.code}</span> : <span style={{ color: '#6b6b6b' }}>No code needed</span>}</div>
                  <div><strong style={{ color: '#6b6b6b' }}>Discount:</strong> <span style={{ fontWeight: 800, color: '#c0c0c0' }}>{offer.discountValue}{offer.discountType === 'percentage' ? '%' : ' Rs.'} OFF</span></div>
                  <div><strong style={{ color: '#6b6b6b' }}>Expires:</strong> {expDate ? new Date(expDate).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Never'}</div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                  <button onClick={() => handleOpenModal(offer)} style={{ padding: '8px 14px', background: '#161616', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', flex: 1, fontWeight: 600 }}>Edit</button>
                  <button onClick={() => handleDelete(offerId)} style={{ padding: '8px 14px', background: '#7a2d2d20', border: '1px solid #7a2d2d50', borderRadius: '6px', color: '#ff6b6b', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '16px', width: '100%', maxWidth: '560px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '1.4rem', color: '#ffffff', fontWeight: 800 }}>{editingId ? 'Edit Offer' : 'Add New Offer'}</h2>

            {errorMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#7a2d2d20', border: '1px solid #7a2d2d60', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', color: '#ff8b8b', fontSize: '0.82rem' }}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#8b8b8b', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Title *</label>
                <input required type="text" placeholder="e.g. Weekend Special 20% Off" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={{ width: '100%', padding: '10px 14px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '7px', color: '#ffffff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#8b8b8b', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Description</label>
                <textarea rows={2} placeholder="Explain how the discount works..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ width: '100%', padding: '10px 14px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '7px', color: '#ffffff', fontSize: '0.85rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#8b8b8b', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Discount Type</label>
                  <select required value={formData.discountType} onChange={e => setFormData({...formData, discountType: e.target.value})} style={{ width: '100%', padding: '10px 14px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '7px', color: '#ffffff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (Rs.)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#8b8b8b', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Value *</label>
                  <input required type="number" step="1" min="0" placeholder="20" value={formData.discountValue} onChange={e => setFormData({...formData, discountValue: parseFloat(e.target.value) || 0})} style={{ width: '100%', padding: '10px 14px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '7px', color: '#ffffff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#8b8b8b', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Promo Code (Optional)</label>
                <input type="text" placeholder="e.g. SUMMER25" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} style={{ width: '100%', padding: '10px 14px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '7px', color: '#ffffff', fontSize: '0.85rem', outline: 'none', textTransform: 'uppercase', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#8b8b8b', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Start Date</label>
                  <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} style={{ width: '100%', padding: '10px 14px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '7px', color: '#ffffff', fontSize: '0.85rem', outline: 'none', colorScheme: 'dark', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#8b8b8b', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Expiry Date (Optional)</label>
                  <input type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} style={{ width: '100%', padding: '10px 14px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '7px', color: '#ffffff', fontSize: '0.85rem', outline: 'none', colorScheme: 'dark', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c0c0c0', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} />
                  Active (Visible on public offers page and homepage)
                </label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 20px', background: '#161616', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#ffffff', cursor: 'pointer', fontSize: '0.85rem' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: '10px 22px', background: saving ? '#555555' : '#c0c0c0', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}>
                  {saving ? 'Saving...' : 'Save Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
