import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useFacilities } from '@/hooks/useFacilities';
import { useQuery } from '@tanstack/react-query';
import { gamesApi } from '@/api/games';
import { offersApi } from '@/api/offers';
import { newsApi } from '@/api/news';

const S = {
  section: { padding: '100px 24px' } as React.CSSProperties,
  container: { maxWidth: '1280px', margin: '0 auto' } as React.CSSProperties,
  sectionTitle: { fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: '#c0c0c0', marginBottom: '12px' },
  h2: { fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: '#ffffff', lineHeight: 1.1, marginBottom: '16px' },
  divider: { width: '48px', height: '2px', background: '#c0c0c0', margin: '0 0 40px 0' } as React.CSSProperties,
  card: { background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px', overflow: 'hidden', transition: 'border-color 0.2s, transform 0.2s' } as React.CSSProperties,
};

export default function LandingPage() {
  const { data: facilities, isLoading: facLoading } = useFacilities(false);
  const { data: gamesRes } = useQuery({ queryKey: ['games-public-home'], queryFn: () => gamesApi.getAll({ active: true, limit: 12 }).then(r => r.data.data) });
  const { data: offersRes } = useQuery({ queryKey: ['offers-public'], queryFn: () => offersApi.getAll({ active: true }).then(r => r.data.data), refetchOnMount: 'always' });
  const { data: newsRes } = useQuery({ queryKey: ['news-public'], queryFn: () => newsApi.getAll({ limit: 3 }).then(r => r.data.data) });

  const [heroVisible, setHeroVisible] = useState(false);
  useEffect(() => { setTimeout(() => setHeroVisible(true), 100); }, []);

  // Group facilities by category._id — produces one entry per category
  const facilityCategories = facilities?.reduce((acc: any, f: any) => {
    const cat = f.category;
    if (!cat) return acc;
    const catId = typeof cat === 'object' ? cat._id : cat;
    if (!acc[catId]) acc[catId] = { category: cat, facilities: [] };
    acc[catId].facilities.push(f);
    return acc;
  }, {} as Record<string, { category: any; facilities: any[] }>);

  return (
    <div style={{ backgroundColor: '#0a0a0a', color: '#ffffff', minHeight: '100vh' }}>

      {/* HERO */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', textAlign: 'center', padding: '0 24px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background grid */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
        {/* Radial gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(192,192,192,0.04) 0%, transparent 70%)',
        }} />
        {/* Bottom fade */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '200px', zIndex: 2, background: 'linear-gradient(to bottom, transparent, #0a0a0a)' }} />

        <div style={{
          position: 'relative', zIndex: 3,
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}>
          <div style={{ fontSize: '0.75rem', letterSpacing: '0.3em', color: '#c0c0c0', textTransform: 'uppercase', marginBottom: '16px', fontWeight: 700 }}>
            PREMIUM ENTERTAINMENT CENTER
          </div>

          <h1 style={{
            fontSize: 'clamp(3rem, 8vw, 7rem)', fontWeight: 900, lineHeight: 1,
            marginBottom: '24px', letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #ffffff 0%, #c0c0c0 40%, #ffffff 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            ATRIOS
          </h1>

          <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.4rem)', color: '#8b8b8b', marginBottom: '8px', letterSpacing: '0.15em', fontWeight: 300 }}>
            PLAY · COMPETE · EXPERIENCE
          </p>

          <p style={{ maxWidth: '560px', margin: '0 auto 48px', color: '#6b6b6b', fontSize: '0.95rem', lineHeight: 1.7 }}>
            Sri Lanka's most premium gaming and entertainment lounge. State-of-the-art consoles, racing cockpits, and exclusive gaming experiences.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/book" style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              height: '52px', padding: '0 36px', backgroundColor: '#c0c0c0', color: '#000000',
              fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
              textDecoration: 'none', borderRadius: '8px', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#e8e8e8'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#c0c0c0'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}>
              Book a Session
            </Link>
            <Link to="/experiences" style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              height: '52px', padding: '0 36px', backgroundColor: 'transparent', color: '#c0c0c0',
              fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
              textDecoration: 'none', borderRadius: '8px', border: '1px solid #2a2a2a',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#c0c0c0'; (e.currentTarget as HTMLElement).style.color = '#ffffff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2a2a'; (e.currentTarget as HTMLElement).style.color = '#c0c0c0'; }}>
              Explore Experiences
            </Link>
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{ position: 'absolute', bottom: '40px', zIndex: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', opacity: 0.4 }}>
          <span style={{ fontSize: '0.65rem', letterSpacing: '0.2em', color: '#6b6b6b', textTransform: 'uppercase' }}>Scroll</span>
          <div style={{ width: '1px', height: '40px', background: 'linear-gradient(to bottom, #6b6b6b, transparent)' }} />
        </div>
      </section>

      {/* EXPERIENCES — one card per category */}
      <section style={{ ...S.section, backgroundColor: '#060606' }}>
        <div style={S.container}>
          <div style={S.sectionTitle}>Our Experiences</div>
          <h2 style={S.h2}>Premium Entertainment</h2>
          <div style={S.divider} />

          {facLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{ height: '220px', background: '#161616', borderRadius: '12px' }} />
              ))}
            </div>
          ) : facilityCategories && Object.keys(facilityCategories).length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
              {Object.entries(facilityCategories).map(([catId, group]: any) => {
                const catObj = group.category;
                const catName = typeof catObj === 'object' ? (catObj?.name || 'Other') : String(catObj);
                const catSlug = typeof catObj === 'object' ? (catObj?.slug || '') : '';
                const unitCount = group.facilities.length;
                const minRate = Math.min(...group.facilities.map((f: any) => f.hourlyRate || 0));
                const maxRate = Math.max(...group.facilities.map((f: any) => f.hourlyRate || 0));
                const priceLabel = minRate === maxRate
                  ? `Rs. ${minRate.toLocaleString()}/hr`
                  : `From Rs. ${minRate.toLocaleString()}/hr`;
                const sampleImage = (typeof catObj === 'object' && catObj?.image)
                  ? catObj.image
                  : group.facilities.find((f: any) => f.images?.[0])?.images?.[0];
                // Map slug to emoji — never show Lucide component names as text
                const iconMap: Record<string, string> = {
                  'playstation': '🎮', 'playstation-5': '🎮', 'ps5': '🎮',
                  'racing-cockpit': '🏎️', 'racing': '🏎️', 'cockpit': '🏎️',
                  'table-tennis': '🏓', 'ping-pong': '🏓',
                  'carrom': '🪀', 'carrom-board': '🪀',
                  'bowling': '🎳', 'vr': '🥽', 'pool': '🎱',
                };
                const icon = iconMap[catSlug?.toLowerCase()] || '🎯';

                return (
                  <div key={catId} style={{ ...S.card, cursor: 'pointer' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#c0c0c0'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2a2a'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}>
                    <div style={{ height: '160px', background: '#161616', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {sampleImage ? (
                        <img src={sampleImage} alt={catName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '3.5rem', opacity: 0.45 }}>{icon}</span>
                      )}
                      <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, color: '#c0c0c0', border: '1px solid rgba(192,192,192,0.2)' }}>
                        {unitCount} {unitCount === 1 ? 'unit' : 'units'}
                      </div>
                    </div>
                    <div style={{ padding: '20px' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', marginBottom: '6px' }}>{catName}</h4>
                      <p style={{ fontSize: '0.78rem', color: '#6b6b6b', lineHeight: 1.6, marginBottom: '16px' }}>
                        {group.facilities[0]?.description || `Premium ${catName} experience. Up to ${unitCount} simultaneous session${unitCount > 1 ? 's' : ''} available.`}
                      </p>
                      <Link to={`/book?category=${catId}`} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '10px', backgroundColor: 'transparent', color: '#c0c0c0',
                        fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                        textDecoration: 'none', borderRadius: '6px', border: '1px solid #2a2a2a', transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#c0c0c0'; (e.currentTarget as HTMLElement).style.color = '#000'; (e.currentTarget as HTMLElement).style.borderColor = '#c0c0c0'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#c0c0c0'; (e.currentTarget as HTMLElement).style.borderColor = '#2a2a2a'; }}>
                        Book a Session
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: '#6b6b6b', textAlign: 'center', padding: '60px 0' }}>No experiences available at the moment.</p>
          )}
        </div>
      </section>

      {/* GAMES */}
      {gamesRes && gamesRes.length > 0 && (
        <section style={S.section}>
          <div style={S.container}>
            <div style={S.sectionTitle}>Game Vault</div>
            <h2 style={S.h2}>Featured Games</h2>
            <p style={{ color: '#8b8b8b', fontSize: '0.95rem', maxWidth: '560px', margin: '-8px 0 28px 0', lineHeight: 1.6 }}>
              Play the hottest console titles and authentic sim racing circuits on our PlayStation 5 stations and direct-drive cockpits.
            </p>
            <div style={S.divider} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
              {gamesRes.slice(0, 4).map((game: any) => {
                const title = game.title || game.name;
                const cover = game.coverImage || game.imageUrl || game.image;
                const catObj = typeof game.facilityCategory === 'object' && game.facilityCategory !== null
                  ? game.facilityCategory
                  : null;
                const catId = catObj?._id || (typeof game.facilityCategory === 'string' ? game.facilityCategory : '');
                const catSlug = catObj?.slug || '';
                const iconMap: Record<string, string> = {
                  'playstation': '🎮', 'playstation-5': '🎮', 'ps5': '🎮',
                  'racing-cockpit': '🏎️', 'racing': '🏎️', 'cockpit': '🏎️',
                };
                const emoji = iconMap[catSlug.toLowerCase()] || '🎮';
                const platformLabel = catObj?.name || game.platform || 'PlayStation 5';

                return (
                  <div
                    key={game._id}
                    style={{
                      ...S.card,
                      textDecoration: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >

                    <div style={{ height: '170px', background: '#161616', position: 'relative', overflow: 'hidden' }}>
                      {cover ? (
                        <img
                          src={cover}
                          alt={title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', opacity: 0.25 }}>
                          🎮
                        </div>
                      )}
                      {platformLabel && (
                        <div style={{
                          position: 'absolute',
                          top: '10px',
                          left: '10px',
                          background: 'rgba(0,0,0,0.85)',
                          backdropFilter: 'blur(8px)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          color: '#ffffff',
                          border: '1px solid rgba(255,255,255,0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}>
                          <span>{emoji}</span> {platformLabel}
                        </div>
                      )}
                      {game.featured && (
                        <div style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          background: '#d4a017',
                          color: '#000000',
                          padding: '3px 7px',
                          borderRadius: '6px',
                          fontSize: '0.6rem',
                          fontWeight: 800,
                          letterSpacing: '0.04em',
                        }}>
                          FEATURED
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      {game.category && (
                        <div style={{ fontSize: '0.68rem', color: '#8b8b8b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                          {game.category}
                        </div>
                      )}
                      <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.3, margin: '0 0 6px 0' }}>
                        {title}
                      </h3>
                      {game.description && (
                        <p style={{
                          fontSize: '0.75rem',
                          color: '#6b6b6b',
                          lineHeight: 1.5,
                          margin: '0 0 14px 0',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}>
                          {game.description}
                        </p>
                      )}
                    </div>
                  </div>

                );
              })}
            </div>

            <div style={{ textAlign: 'center', marginTop: '44px' }}>
              <Link to="/games" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 28px',
                background: 'transparent',
                border: '1px solid #3a3a3a',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '0.82rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#c0c0c0'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#3a3a3a'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                Browse All Games ({gamesRes.length}+) →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* OFFERS */}
      {offersRes && offersRes.length > 0 && (
        <section style={{ ...S.section, backgroundColor: '#060606' }}>
          <div style={S.container}>
            <div style={S.sectionTitle}>Current Promotions</div>
            <h2 style={S.h2}>Special Offers</h2>
            <div style={S.divider} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
              {offersRes.map((offer: any) => {
                const expDate = offer.expiryDate || offer.endDate;
                const isUpcoming = offer.startDate && new Date(offer.startDate) > new Date();
                return (
                  <div key={offer._id || offer.id} style={{ ...S.card, padding: '28px', background: 'linear-gradient(135deg, #111111 0%, #161616 100%)', position: 'relative' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#c0c0c0'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2a2a'; }}>
                    {isUpcoming && (
                      <div style={{ position: 'absolute', top: '16px', right: '16px', background: '#2d5a7a20', border: '1px solid #2d5a7a50', borderRadius: '6px', padding: '2px 8px', fontSize: '0.65rem', color: '#4a8ec2', fontWeight: 700 }}>
                        UPCOMING
                      </div>
                    )}
                    {offer.discountValue ? (
                      <div style={{ fontSize: '2rem', fontWeight: 900, color: '#c0c0c0', marginBottom: '8px' }}>
                        {offer.discountType === 'percentage' ? `${offer.discountValue}% OFF` : `Rs. ${offer.discountValue} OFF`}
                      </div>
                    ) : null}
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>{offer.title}</h3>
                    {offer.description && (
                      <p style={{ fontSize: '0.85rem', color: '#6b6b6b', lineHeight: 1.6, marginBottom: '12px' }}>{offer.description}</p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginTop: '14px' }}>
                      {offer.code && (
                        <div style={{ background: '#0a0a0a', border: '1px dashed #3a3a3a', padding: '6px 14px', borderRadius: '6px', display: 'inline-block', fontFamily: 'monospace', color: '#c0c0c0', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.1em' }}>
                          {offer.code}
                        </div>
                      )}
                      {expDate && (
                        <span style={{ fontSize: '0.72rem', color: '#555555' }}>
                          Valid until {new Date(expDate).toLocaleDateString('en-LK', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* NEWS */}
      {newsRes && newsRes.length > 0 && (
        <section style={S.section}>
          <div style={S.container}>
            <div style={S.sectionTitle}>Latest Updates</div>
            <h2 style={S.h2}>News & Events</h2>
            <div style={S.divider} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
              {newsRes.map((item: any) => {
                const img = item.image || item.featuredImage || item.imageUrl;
                const d = item.publishedAt || item.publishDate;
                return (
                  <Link key={item._id} to={`/news/${item.slug || item._id}`} style={{ ...S.card, textDecoration: 'none', display: 'block' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#3a3a3a'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2a2a'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}>
                    {img && (
                      <div style={{ height: '200px', overflow: 'hidden' }}>
                        <img src={img} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                    <div style={{ padding: '24px' }}>
                      {item.category && <div style={{ fontSize: '0.65rem', color: '#c0c0c0', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '10px' }}>{item.category}</div>}
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', marginBottom: '10px', lineHeight: 1.4 }}>{item.title}</h3>
                      <p style={{ fontSize: '0.8rem', color: '#6b6b6b', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.excerpt || item.content?.slice(0, 120)}</p>
                      <div style={{ marginTop: '16px', fontSize: '0.7rem', color: '#4b4b4b' }}>
                        {d ? new Date(d).toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA STRIP */}
      <section style={{ padding: '80px 24px', background: 'linear-gradient(135deg, #111111 0%, #161616 100%)', borderTop: '1px solid #2a2a2a', borderBottom: '1px solid #2a2a2a' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <div style={S.sectionTitle}>Ready to Play?</div>
          <h2 style={{ ...S.h2, fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>Book Your Session Today</h2>
          <p style={{ color: '#6b6b6b', marginBottom: '40px', fontSize: '1rem', lineHeight: 1.7 }}>
            Walk-ins welcome. Online bookings guaranteed. No payment required upfront — pay at venue.
          </p>
          <Link to="/book" style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            height: '56px', padding: '0 48px', backgroundColor: '#c0c0c0', color: '#000',
            fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase',
            textDecoration: 'none', borderRadius: '8px', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#e8e8e8'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#c0c0c0'; }}>
            Book Now — Free
          </Link>
        </div>
      </section>

    </div>
  );
}
