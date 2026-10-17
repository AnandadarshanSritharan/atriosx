import { useQuery } from '@tanstack/react-query';
import { offersApi } from '@/api/offers';
import { Tag } from 'lucide-react';

export default function PublicOffersPage() {
  const { data: offers, isLoading } = useQuery({
    queryKey: ['offers-public-full'],
    queryFn: () => offersApi.getAll({ active: true }).then(r => r.data.data),
    refetchOnMount: 'always',
  });

  const now = new Date();
  const activeOffers = (offers || []).filter((o: any) => {
    if (!o.active) return false;
    const exp = o.expiryDate || o.endDate;
    if (exp && new Date(exp) < now) return false;
    return true;
  });

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', paddingTop: '96px' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(180deg, #111111 0%, #0a0a0a 100%)', borderBottom: '1px solid #2a2a2a', padding: '60px 24px 48px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c0c0c0', marginBottom: '12px' }}>Current Promotions</div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1.05 }}>Special Offers</h1>
          <p style={{ color: '#6b6b6b', marginTop: '16px', fontSize: '1rem', maxWidth: '560px', lineHeight: 1.7 }}>
            Take advantage of our exclusive deals and promotional offers. Limited time only.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 24px' }}>
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {[1,2,3].map(i => <div key={i} style={{ height: '220px', background: '#111111', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />)}
          </div>
        ) : activeOffers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', background: '#111111', border: '1px solid #2a2a2a', borderRadius: '16px' }}>
            <Tag size={48} color="#2a2a2a" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ color: '#ffffff', fontSize: '1.2rem', marginBottom: '8px' }}>No Active Offers</h3>
            <p style={{ color: '#6b6b6b' }}>Check back soon for upcoming promotions.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {activeOffers.map((offer: any) => {
              const expDate = offer.expiryDate || offer.endDate;
              const isExpiringSoon = expDate && (new Date(expDate).getTime() - now.getTime()) < 7 * 24 * 60 * 60 * 1000;
              return (
                <div key={offer._id} style={{ background: 'linear-gradient(135deg, #111111 0%, #161616 100%)', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '32px', position: 'relative', overflow: 'hidden', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#c0c0c0'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2a2a'; }}>
                  {/* Background decoration */}
                  <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(192,192,192,0.03)', zIndex: 0 }} />

                  {isExpiringSoon && (
                    <div style={{ position: 'absolute', top: '16px', right: '16px', background: '#d4a01720', border: '1px solid #d4a01740', borderRadius: '6px', padding: '3px 10px', fontSize: '0.65rem', color: '#d4a017', fontWeight: 700 }}>
                      EXPIRING SOON
                    </div>
                  )}

                  {!isExpiringSoon && offer.startDate && new Date(offer.startDate) > now && (
                    <div style={{ position: 'absolute', top: '16px', right: '16px', background: '#2d5a7a20', border: '1px solid #2d5a7a50', borderRadius: '6px', padding: '3px 10px', fontSize: '0.65rem', color: '#4a8ec2', fontWeight: 700 }}>
                      UPCOMING
                    </div>
                  )}

                  <div style={{ position: 'relative', zIndex: 1 }}>
                    {offer.discountValue && (
                      <div style={{
                        fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 900, lineHeight: 1,
                        marginBottom: '12px',
                        background: 'linear-gradient(135deg, #ffffff 0%, #c0c0c0 100%)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                      }}>
                        {offer.discountType === 'percentage' ? `${offer.discountValue}% OFF` : `Rs. ${offer.discountValue?.toLocaleString()} OFF`}
                      </div>
                    )}

                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '10px' }}>{offer.title}</h3>
                    <p style={{ fontSize: '0.85rem', color: '#6b6b6b', lineHeight: 1.7, marginBottom: '20px' }}>{offer.description}</p>

                    {offer.code && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', background: '#0a0a0a', border: '1px dashed #3a3a3a', borderRadius: '8px', padding: '10px 16px' }}>
                        <span style={{ fontSize: '0.7rem', color: '#6b6b6b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Code:</span>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.95rem', fontWeight: 800, color: '#c0c0c0', letterSpacing: '0.12em' }}>{offer.code}</span>
                      </div>
                    )}

                    {expDate && (
                      <p style={{ marginTop: '16px', fontSize: '0.72rem', color: '#4b4b4b' }}>
                        Expires: {new Date(expDate).toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    )}
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
