import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFacilities } from '@/hooks/useFacilities';
import { useQuery } from '@tanstack/react-query';
import { facilitiesApi } from '@/api/facilities';

const SLUG_TO_EMOJI: Record<string, string> = {
  'playstation': '🎮', 'playstation-5': '🎮', 'ps5': '🎮',
  'racing-cockpit': '🏎️', 'racing': '🏎️', 'cockpit': '🏎️',
  'table-tennis': '🏓', 'ping-pong': '🏓',
  'carrom': '🪀', 'carrom-board': '🪀',
  'bowling': '🎳', 'vr': '🥽', 'pool': '🎱', 'snooker': '🎱',
};

export default function ExperiencesPage() {
  const navigate = useNavigate();
  const { data: facilities, isLoading: loadingFacilities } = useFacilities(false);
  const { data: catRes, isLoading: loadingCategories } = useQuery({
    queryKey: ['facility-categories'],
    queryFn: () => facilitiesApi.categories.list().then(r => r.data),
  });

  const categories = (catRes?.data as any[]) || [];

  // Group facilities strictly by category._id
  const categoryGroups = useMemo(() => {
    if (!facilities) return [];
    const groups: Record<string, { category: any; facilities: any[]; minRate: number; maxRate: number }> = {};

    facilities.forEach((f: any) => {
      const cat = f.category;
      if (!cat) return;
      const catId = typeof cat === 'object' ? cat._id : cat;
      if (!groups[catId]) {
        const fullCat = categories.find(c => c._id === catId) || (typeof cat === 'object' ? cat : { _id: catId, name: 'Other', slug: '' });
        groups[catId] = { category: fullCat, facilities: [], minRate: Infinity, maxRate: 0 };
      }
      groups[catId].facilities.push(f);
      if (f.hourlyRate < groups[catId].minRate) groups[catId].minRate = f.hourlyRate;
      if (f.hourlyRate > groups[catId].maxRate) groups[catId].maxRate = f.hourlyRate;
    });

    return Object.values(groups).filter(g => g.facilities.length > 0);
  }, [facilities, categories]);

  const isLoading = loadingFacilities || loadingCategories;

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', paddingTop: '96px' }}>
      {/* Page Header */}
      <div style={{ background: 'linear-gradient(180deg, #111111 0%, #0a0a0a 100%)', borderBottom: '1px solid #2a2a2a', padding: '60px 24px 48px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c0c0c0', marginBottom: '12px' }}>
            Our Experiences
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1.05 }}>
            Premium Entertainment
          </h1>
          <p style={{ color: '#6b6b6b', marginTop: '16px', fontSize: '1rem', maxWidth: '560px', lineHeight: 1.7 }}>
            Discover our collection of world-class entertainment experiences. From cutting-edge gaming to competitive sports — book by experience and we'll have a station ready for you.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 24px' }}>
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ height: '340px', background: '#111111', borderRadius: '14px' }} />
            ))}
          </div>
        ) : categoryGroups.length === 0 ? (
          <p style={{ color: '#6b6b6b', textAlign: 'center', padding: '80px 0', fontSize: '1rem' }}>
            No experiences available at the moment. Check back soon!
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '28px' }}>
            {categoryGroups.map((group) => {
              const cat = group.category;
              const catName = cat.name;
              const catSlug = cat.slug || '';
              const emoji = SLUG_TO_EMOJI[catSlug.toLowerCase()] || '🎯';
              const unitCount = group.facilities.length;
              const priceLabel = group.minRate === group.maxRate
                ? `Rs. ${group.minRate.toLocaleString()}/hr`
                : `From Rs. ${group.minRate.toLocaleString()}/hr`;

              // Find category image first, then first facility image if available
              const sampleImage = cat.image || group.facilities.find(f => f.images?.[0])?.images?.[0];
              const desc = group.facilities[0]?.description || `Experience high-performance entertainment with our ${catName} setup.`;

              // Collect features
              const allFeatures = Array.from(new Set(group.facilities.flatMap(f => f.features || []))).slice(0, 4);

              return (
                <div
                  key={cat._id}
                  onClick={() => navigate(`/book?category=${cat._id}`)}
                  style={{
                    background: '#111111',
                    border: '1px solid #2a2a2a',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.25s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#c0c0c0';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(0,0,0,0.6)';
                    const btn = (e.currentTarget as HTMLElement).querySelector('.book-btn') as HTMLElement;
                    if (btn) btn.style.backgroundColor = '#ffffff';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#2a2a2a';
                    (e.currentTarget as HTMLElement).style.transform = 'none';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                    const btn = (e.currentTarget as HTMLElement).querySelector('.book-btn') as HTMLElement;
                    if (btn) btn.style.backgroundColor = '#c0c0c0';
                  }}
                >
                  <div>
                    {/* Top media area */}
                    <div style={{ height: '180px', background: '#161616', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {sampleImage ? (
                        <img src={sampleImage} alt={catName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '4rem', opacity: 0.35 }}>{emoji}</span>
                      )}
                      {/* Unit pool badge */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '12px',
                          left: '12px',
                          background: 'rgba(0,0,0,0.85)',
                          backdropFilter: 'blur(8px)',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: '#c0c0c0',
                          border: '1px solid rgba(192,192,192,0.2)',
                        }}
                      >
                        {unitCount} {unitCount === 1 ? 'Station' : 'Stations'} Available
                      </div>
                    </div>

                    {/* Content area */}
                    <div style={{ padding: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '1.4rem' }}>{emoji}</span>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>{catName}</h3>
                      </div>

                      <p style={{ fontSize: '0.84rem', color: '#6b6b6b', lineHeight: 1.6, marginBottom: '20px', minHeight: '2.6rem' }}>
                        {desc}
                      </p>

                      {allFeatures.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
                          {allFeatures.map((feat: string, i: number) => (
                            <span key={i} style={{ padding: '3px 10px', background: '#161616', borderRadius: '20px', fontSize: '0.68rem', color: '#8b8b8b', border: '1px solid #2a2a2a' }}>
                              {feat}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action bottom */}
                  <div style={{ padding: '0 24px 24px' }}>
                    <div
                      className="book-btn"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '12px',
                        background: '#c0c0c0',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#000',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        transition: 'background-color 0.2s',
                      }}
                    >
                      Book a Session →
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
