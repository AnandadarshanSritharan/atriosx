import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { newsApi } from '@/api/news';
import { Search } from 'lucide-react';

export default function PublicNewsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const { data: news, isLoading } = useQuery({
    queryKey: ['news-public-all'],
    queryFn: () => newsApi.getAll({ published: true, limit: 50 }).then(r => r.data.data),
  });

  const categories = Array.from(new Set((news || []).map((n: any) => n.category).filter(Boolean)));

  const filtered = (news || []).filter((n: any) => {
    const matchSearch = !search || n.title?.toLowerCase().includes(search.toLowerCase());
    const matchCat = !category || n.category === category;
    return matchSearch && matchCat;
  });

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', paddingTop: '96px' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(180deg, #111111 0%, #0a0a0a 100%)', borderBottom: '1px solid #2a2a2a', padding: '60px 24px 48px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c0c0c0', marginBottom: '12px' }}>Latest Updates</div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1.05 }}>News & Events</h1>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 24px' }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '48px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search size={14} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6b6b6b' }} />
            <input placeholder="Search news..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: '38px', padding: '11px 14px 11px 38px', background: '#111111', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#ffffff', fontSize: '0.85rem', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={() => setCategory('')} style={{ padding: '10px 18px', background: category === '' ? '#c0c0c0' : 'transparent', border: `1px solid ${category === '' ? '#c0c0c0' : '#2a2a2a'}`, borderRadius: '8px', color: category === '' ? '#000' : '#8b8b8b', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>All</button>
            {categories.map((c: any) => (
              <button key={c} onClick={() => setCategory(c)} style={{ padding: '10px 18px', background: category === c ? '#c0c0c0' : 'transparent', border: `1px solid ${category === c ? '#c0c0c0' : '#2a2a2a'}`, borderRadius: '8px', color: category === c ? '#000' : '#8b8b8b', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>{c}</button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[1,2,3].map(i => <div key={i} style={{ height: '180px', background: '#111111', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#4b4b4b', fontSize: '1rem' }}>No news found</div>
        ) : (
          <>
            {/* Featured article */}
            {featured && !search && !category && (() => {
              const featuredImg = featured.image || featured.featuredImage || featured.imageUrl;
              const featuredDate = featured.publishedAt || featured.publishDate;
              return (
                <Link to={`/news/${featured.slug || featured._id}`} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', background: '#111111', border: '1px solid #2a2a2a', borderRadius: '16px', overflow: 'hidden', textDecoration: 'none', marginBottom: '40px', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#3a3a3a'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2a2a'; }}>
                  <div style={{ height: '360px', background: '#161616', overflow: 'hidden' }}>
                    {featuredImg ? (
                      <img src={featuredImg} alt={featured.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem', opacity: 0.15 }}>📰</div>
                    )}
                  </div>
                  <div style={{ padding: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                      {featured.category && <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#c0c0c0', letterSpacing: '0.15em', textTransform: 'uppercase', background: '#c0c0c015', border: '1px solid #c0c0c030', padding: '3px 10px', borderRadius: '20px' }}>{featured.category}</span>}
                      <span style={{ fontSize: '0.7rem', color: '#4b4b4b' }}>
                        {featuredDate ? new Date(featuredDate).toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                      </span>
                    </div>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ffffff', lineHeight: 1.25, marginBottom: '16px' }}>{featured.title}</h2>
                    <p style={{ fontSize: '0.9rem', color: '#6b6b6b', lineHeight: 1.7 }}>{featured.excerpt || featured.content?.slice(0, 200)}</p>
                    <div style={{ marginTop: '24px', color: '#c0c0c0', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em' }}>Read More →</div>
                  </div>
                </Link>
              );
            })()}

            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
              {(search || category ? filtered : rest).map((item: any) => {
                const itemImg = item.image || item.featuredImage || item.imageUrl;
                const itemDate = item.publishedAt || item.publishDate;
                return (
                  <Link key={item._id} to={`/news/${item.slug || item._id}`} style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px', overflow: 'hidden', textDecoration: 'none', display: 'block', transition: 'all 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#3a3a3a'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2a2a'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}>
                    <div style={{ height: '200px', background: '#161616', overflow: 'hidden' }}>
                      {itemImg ? (
                        <img src={itemImg} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', opacity: 0.15 }}>📰</div>
                      )}
                    </div>
                    <div style={{ padding: '24px' }}>
                      {item.category && <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#c0c0c0', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '10px' }}>{item.category}</div>}
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', marginBottom: '10px', lineHeight: 1.35 }}>{item.title}</h3>
                      <p style={{ fontSize: '0.8rem', color: '#6b6b6b', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {item.excerpt || item.content?.slice(0, 150)}
                      </p>
                      <div style={{ marginTop: '16px', fontSize: '0.7rem', color: '#4b4b4b' }}>
                        {itemDate ? new Date(itemDate).toLocaleDateString('en-LK', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
