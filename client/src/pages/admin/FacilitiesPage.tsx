import { useNavigate } from 'react-router-dom';
import { useFacilities, useCreateFacility, useUpdateFacility, useDeleteFacility } from '@/hooks/useFacilities';
import { PageHeader } from '@/components/shared/PageHeader';
import { useState } from 'react';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

export default function FacilitiesPage() {
  const { data: facilities, isLoading } = useFacilities(true);
  const navigate = useNavigate();
  const { mutate: deleteFacility } = useDeleteFacility();
  const { mutate: updateFacility } = useUpdateFacility();

  const handleToggleActive = (f: any, e: React.MouseEvent) => {
    e.stopPropagation();
    updateFacility({ id: f._id, data: { active: !f.active } });
  };

  const handleDelete = (f: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete "${f.name}"? This cannot be undone.`)) {
      deleteFacility(f._id);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Facilities"
        subtitle="Manage your entertainment spaces and configure booking options"
        actions={
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => navigate('/admin/categories')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: 'transparent', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#c0c0c0', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>
              Categories
            </button>
            <button onClick={() => navigate('/admin/facilities/new')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#c0c0c0', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
              <Plus size={15} /> Add Facility
            </button>
          </div>
        }
      />

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {[1,2,3,4].map(i => <div key={i} style={{ height: '200px', background: '#111111', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />)}
        </div>
      ) : facilities?.length === 0 ? (
        <div style={{ padding: '80px 24px', textAlign: 'center', background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px' }}>
          <p style={{ color: '#4b4b4b', marginBottom: '16px' }}>No facilities yet</p>
          <button onClick={() => navigate('/admin/facilities/new')}
            style={{ padding: '10px 24px', background: '#c0c0c0', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 700, cursor: 'pointer' }}>
            Add First Facility
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {facilities?.map((f: any) => (
            <div key={f._id} style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.2s' }}
              onClick={() => navigate(`/admin/facilities/${f._id}/edit`)}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#3a3a3a'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2a2a'; }}>
              {/* Color bar */}
              <div style={{ height: '4px', backgroundColor: f.calendarColor || f.color || '#c0c0c0' }} />

              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>{f.name}</h3>
                    <span style={{ fontSize: '0.7rem', color: '#6b6b6b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {typeof f.category === 'object' ? f.category?.name : f.category || 'Uncategorized'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={e => e.stopPropagation()}>
                    <button onClick={e => handleToggleActive(f, e)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: f.active ? '#2d7a4f' : '#4b4b4b', padding: '4px' }}>
                      {f.active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    </button>
                    <button onClick={e => { e.stopPropagation(); navigate(`/admin/facilities/${f._id}/edit`); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b6b6b', padding: '4px' }}>
                      <Edit2 size={14} />
                    </button>
                    <button onClick={e => handleDelete(f, e)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8b2020', padding: '4px' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: '0.8rem', color: '#6b6b6b', lineHeight: 1.5, marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {f.description || 'No description.'}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.75rem' }}>
                  <div style={{ background: '#0a0a0a', borderRadius: '6px', padding: '8px 12px' }}>
                    <div style={{ color: '#4b4b4b', marginBottom: '2px' }}>Rate</div>
                    <div style={{ color: '#c0c0c0', fontWeight: 700 }}>Rs. {f.hourlyRate?.toLocaleString()}/hr</div>
                  </div>
                  <div style={{ background: '#0a0a0a', borderRadius: '6px', padding: '8px 12px' }}>
                    <div style={{ color: '#4b4b4b', marginBottom: '2px' }}>Status</div>
                    <div style={{ color: f.active ? '#2d7a4f' : '#8b2020', fontWeight: 700 }}>{f.active ? 'Active' : 'Inactive'}</div>
                  </div>
                  <div style={{ background: '#0a0a0a', borderRadius: '6px', padding: '8px 12px' }}>
                    <div style={{ color: '#4b4b4b', marginBottom: '2px' }}>Booking</div>
                    <div style={{ color: f.bookingEnabled ? '#3d85c8' : '#4b4b4b', fontWeight: 700 }}>{f.bookingEnabled ? 'Enabled' : 'Disabled'}</div>
                  </div>
                  <div style={{ background: '#0a0a0a', borderRadius: '6px', padding: '8px 12px' }}>
                    <div style={{ color: '#4b4b4b', marginBottom: '2px' }}>Min / Max</div>
                    <div style={{ color: '#c0c0c0', fontWeight: 700 }}>{f.minDurationMinutes || 30} – {f.maxDurationMinutes || 180} min</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
