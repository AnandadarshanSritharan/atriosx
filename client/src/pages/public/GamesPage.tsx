import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { gamesApi } from '@/api/games';
import { facilitiesApi } from '@/api/facilities';
import { Search, Sparkles, Gamepad2, ArrowRight } from 'lucide-react';
import type { FacilityCategory, Game } from '@/types';

const SLUG_TO_EMOJI: Record<string, string> = {
  'playstation': '🎮', 'playstation-5': '🎮', 'ps5': '🎮',
  'racing-cockpit': '🏎️', 'racing': '🏎️', 'cockpit': '🏎️',
  'table-tennis': '🏓', 'ping-pong': '🏓',
  'carrom': '🪀', 'carrom-board': '🪀',
  'bowling': '🎳', 'vr': '🥽', 'pool': '🎱', 'snooker': '🎱',
};

export default function PublicGamesPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(''); // Category ID or '' for all

  // Fetch active games
  const { data: gamesRes, isLoading: loadingGames } = useQuery({
    queryKey: ['games-public-full'],
    queryFn: () => gamesApi.getAll({ active: true, limit: 200 }).then(r => r.data.data),
  });
  const games: Game[] = gamesRes || [];

  // Fetch experience categories
  const { data: catRes, isLoading: loadingCategories } = useQuery({
    queryKey: ['facility-categories-public-games'],
    queryFn: () => facilitiesApi.categories.list().then(r => r.data.data),
  });
  const categories: FacilityCategory[] = catRes || [];

  // Filter games based on search and category tab
  const filtered = games.filter((g: any) => {
    const title = (g.title || g.name || '').toLowerCase();
    const genre = (g.category || '').toLowerCase();
    const desc = (g.description || '').toLowerCase();
    const q = search.toLowerCase();
    const matchesSearch = !search || title.includes(q) || genre.includes(q) || desc.includes(q);

    const catId = typeof g.facilityCategory === 'object' && g.facilityCategory !== null
      ? (g.facilityCategory as any)._id
      : (g.facilityCategory as string);
    const matchesCategory = !selectedCategory || catId === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', paddingTop: '96px', color: '#ffffff' }}>
      
      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(180deg, #111111 0%, #0a0a0a 100%)',
        borderBottom: '1px solid #222222',
        padding: '64px 24px 48px',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.72rem',
            fontWeight: 800,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#c0c0c0',
            marginBottom: '14px',
            background: 'rgba(255,255,255,0.05)',
            padding: '6px 14px',
            borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <Sparkles size={13} color="#c0c0c0" /> ATRIOS GAME VAULT
          </div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 900,
            color: '#ffffff',
            letterSpacing: '-0.02em',
            lineHeight: 1.05,
            margin: '0 0 16px 0',
          }}>
            Our Game Library
          </h1>

          <p style={{
            color: '#8b8b8b',
            fontSize: '1.05rem',
            maxWidth: '620px',
            lineHeight: 1.6,
            margin: 0,
          }}>
            Explore our curated collection of competitive titles, next-gen esports, and ultra-realistic driving simulators ready to play on our high-end rigs.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 24px 80px' }}>
        
        {/* Search Bar & Category Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
          
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 320px' }}>
              <Search size={15} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#6b6b6b' }} />
              <input
                type="text"
                placeholder="Search by game title, genre (e.g. Sports, Racing), or keywords..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '13px 16px 13px 44px',
                  background: '#111111',
                  border: '1px solid #2a2a2a',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#c0c0c0'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#2a2a2a'; }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#6b6b6b',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Total count badge */}
            <span style={{ fontSize: '0.82rem', color: '#6b6b6b', whiteSpace: 'nowrap' }}>
              Showing <strong style={{ color: '#ffffff' }}>{filtered.length}</strong> {filtered.length === 1 ? 'game' : 'games'}
            </span>
          </div>

          {/* Experience Category Pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={() => setSelectedCategory('')}
              style={{
                padding: '9px 18px',
                background: selectedCategory === '' ? '#c0c0c0' : '#141414',
                border: `1px solid ${selectedCategory === '' ? '#c0c0c0' : '#262626'}`,
                borderRadius: '24px',
                color: selectedCategory === '' ? '#000000' : '#a0a0a0',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              All Experiences ({games.length})
            </button>

            {categories.map((cat) => {
              const isSelected = selectedCategory === cat._id;
              const count = games.filter((g: any) => {
                const cId = typeof g.facilityCategory === 'object' && g.facilityCategory !== null
                  ? (g.facilityCategory as any)._id
                  : (g.facilityCategory as string);
                return cId === cat._id;
              }).length;

              const emoji = SLUG_TO_EMOJI[cat.slug] || '🎮';

              return (
                <button
                  key={cat._id}
                  onClick={() => setSelectedCategory(cat._id)}
                  style={{
                    padding: '9px 18px',
                    background: isSelected ? '#c0c0c0' : '#141414',
                    border: `1px solid ${isSelected ? '#c0c0c0' : '#262626'}`,
                    borderRadius: '24px',
                    color: isSelected ? '#000000' : '#a0a0a0',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{emoji}</span>
                  <span>{cat.name}</span>
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: isSelected ? '#00000020' : '#222222',
                    color: isSelected ? '#000000' : '#888888',
                    marginLeft: '2px',
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading Skeleton */}
        {loadingGames ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{ height: '340px', background: '#121212', borderRadius: '14px', border: '1px solid #1f1f1f' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '90px 24px',
            background: '#111111',
            borderRadius: '16px',
            border: '1px solid #222222',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '14px' }}>🎮</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>No games found</h3>
            <p style={{ color: '#6b6b6b', fontSize: '0.88rem', maxWidth: '400px', margin: '0 auto 24px' }}>
              {search || selectedCategory
                ? 'No games match your current filter criteria. Try adjusting or resetting your search.'
                : 'No games are currently listed in the library.'}
            </p>
            {(search || selectedCategory) && (
              <button
                onClick={() => { setSearch(''); setSelectedCategory(''); }}
                style={{
                  padding: '10px 22px',
                  background: '#c0c0c0',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#000000',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          /* Games Grid */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
            {filtered.map((game: any) => (
              <GameCard key={game._id || game.id} game={game} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GameCard({ game }: { game: any }) {
  const [hovered, setHovered] = useState(false);
  const title = game.title || game.name;
  const cover = game.coverImage || game.imageUrl || game.image;
  const catObj = typeof game.facilityCategory === 'object' && game.facilityCategory !== null
    ? game.facilityCategory
    : null;
  const catId = catObj?._id || (typeof game.facilityCategory === 'string' ? game.facilityCategory : '');
  const emoji = catObj ? (SLUG_TO_EMOJI[catObj.slug] || '🎮') : '🎮';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#121212',
        border: `1px solid ${hovered ? '#444444' : '#222222'}`,
        borderRadius: '14px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.25s cubic-bezier(0.2, 0, 0, 1)',
        transform: hovered ? 'translateY(-4px)' : 'none',
        boxShadow: hovered ? '0 16px 32px rgba(0,0,0,0.6)' : 'none',
      }}
    >
      {/* Cover Image */}
      <div style={{
        aspectRatio: '16/11',
        background: '#161616',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {cover ? (
          <img
            src={cover}
            alt={title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.3s ease',
              transform: hovered ? 'scale(1.04)' : 'scale(1)',
            }}
          />
        ) : (
          <div style={{
            display: 'flex',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '3rem',
            opacity: 0.2,
          }}>
            🎮
          </div>
        )}

        {/* Category Pill Tag */}
        {catObj && (
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '0.68rem',
            fontWeight: 800,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            letterSpacing: '0.04em',
          }}>
            <span>{emoji}</span> {catObj.name}
          </div>
        )}

        {/* Featured Tag */}
        {game.featured && (
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: '#d4a017',
            color: '#000000',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '0.65rem',
            fontWeight: 900,
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
          }}>
            <Sparkles size={11} /> FEATURED
          </div>
        )}
      </div>

      {/* Card Body */}
      <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* Genre / Tag */}
        {game.category && (
          <span style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            color: '#8b8b8b',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '6px',
          }}>
            {game.category}
          </span>
        )}

        {/* Game Title */}
        <h3 style={{
          fontSize: '1.15rem',
          fontWeight: 800,
          color: '#ffffff',
          lineHeight: 1.3,
          margin: '0 0 8px 0',
        }}>
          {title}
        </h3>

        {/* Description */}
        {game.description && (
          <p style={{
            fontSize: '0.8rem',
            color: '#7b7b7b',
            lineHeight: 1.5,
            margin: '0 0 18px 0',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            flex: 1,
          }}>
            {game.description}
          </p>
        )}

        {/* Book Button */}
        <Link
          to={catId ? `/book?category=${catId}` : '/book'}
          style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '11px 16px',
            background: hovered ? '#c0c0c0' : '#1a1a1a',
            border: `1px solid ${hovered ? '#c0c0c0' : '#2e2e2e'}`,
            borderRadius: '8px',
            color: hovered ? '#000000' : '#c0c0c0',
            fontWeight: 700,
            fontSize: '0.82rem',
            textDecoration: 'none',
            letterSpacing: '0.04em',
            transition: 'all 0.15s ease',
          }}
        >
          <span>Book Session</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
