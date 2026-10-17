import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { newsApi } from '@/api/news';
import { ArrowLeft } from 'lucide-react';

export default function NewsDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: article, isLoading } = useQuery({
    queryKey: ['news-detail', slug],
    queryFn: () => newsApi.getBySlug(slug!).then(r => r.data.data),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', paddingTop: '96px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1,2,3,4].map(i => <div key={i} style={{ height: i === 1 ? '48px' : '24px', background: '#111111', borderRadius: '8px', animation: 'pulse 1.5s infinite', width: i === 2 ? '60%' : '100%' }} />)}
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', paddingTop: '96px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#ffffff', fontSize: '1.5rem', marginBottom: '12px' }}>Article Not Found</h2>
          <Link to="/news" style={{ color: '#c0c0c0', textDecoration: 'none', fontSize: '0.9rem' }}>← Back to News</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', paddingTop: '96px' }}>
      <div style={{ maxWidth: '820px', margin: '0 auto', padding: '48px 24px' }}>
        {/* Back */}
        <Link to="/news" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#6b6b6b', textDecoration: 'none', fontSize: '0.82rem', marginBottom: '40px', transition: 'color 0.2s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#c0c0c0'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#6b6b6b'; }}>
          <ArrowLeft size={14} /> Back to News
        </Link>

        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          {article.category && (
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#c0c0c0', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ background: '#c0c0c015', border: '1px solid #c0c0c030', padding: '4px 12px', borderRadius: '20px' }}>{article.category}</span>
              {(() => {
                const articleDate = article.publishedAt || article.publishDate;
                if (!articleDate) return null;
                return (
                  <span style={{ color: '#4b4b4b', fontWeight: 400 }}>
                    {new Date(articleDate).toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                );
              })()}
            </div>
          )}
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, color: '#ffffff', lineHeight: 1.15, marginBottom: '20px', letterSpacing: '-0.02em' }}>
            {article.title}
          </h1>
          {article.excerpt && (
            <p style={{ fontSize: '1.05rem', color: '#8b8b8b', lineHeight: 1.75 }}>{article.excerpt}</p>
          )}
        </div>

        {/* Hero Image */}
        {(article.image || article.featuredImage || article.imageUrl) && (
          <div style={{ borderRadius: '16px', overflow: 'hidden', marginBottom: '48px', border: '1px solid #2a2a2a' }}>
            <img src={article.image || article.featuredImage || article.imageUrl} alt={article.title} style={{ width: '100%', maxHeight: '500px', objectFit: 'cover', display: 'block' }} />
          </div>
        )}

        {/* Content */}
        <div style={{ color: '#c0c0c0', lineHeight: 1.85, fontSize: '1rem', whiteSpace: 'pre-wrap' }}>
          {article.content}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '60px', paddingTop: '32px', borderTop: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <Link to="/news" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#6b6b6b', textDecoration: 'none', fontSize: '0.82rem' }}>
            <ArrowLeft size={14} /> Back to News
          </Link>
          <Link to="/book" style={{ padding: '12px 28px', background: '#c0c0c0', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none', cursor: 'pointer' }}>
            Book a Session
          </Link>
        </div>
      </div>
    </div>
  );
}
