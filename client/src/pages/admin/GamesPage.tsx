import React, { useState, useEffect } from 'react';
import { gamesApi } from '@/api/games';
import { facilitiesApi } from '@/api/facilities';
import PageHeader from '@/components/shared/PageHeader';
import type { FacilityCategory, Game } from '@/types';
import { Plus, Search, Trash2, Edit2, CheckCircle2, XCircle, Image as ImageIcon, Sparkles } from 'lucide-react';

const SLUG_TO_EMOJI: Record<string, string> = {
  'playstation': '🎮', 'playstation-5': '🎮', 'ps5': '🎮',
  'racing-cockpit': '🏎️', 'racing': '🏎️', 'cockpit': '🏎️',
  'table-tennis': '🏓', 'ping-pong': '🏓',
  'carrom': '🪀', 'carrom-board': '🪀',
  'bowling': '🎳', 'vr': '🥽', 'pool': '🎱', 'snooker': '🎱',
};

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [categories, setCategories] = useState<FacilityCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    facilityCategory: '',
    category: '', // genre e.g. Sports, Racing
    description: '',
    featured: false,
    active: true,
    displayOrder: 1,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [gamesRes, catRes] = await Promise.all([
        gamesApi.list({ includeInactive: true }),
        facilitiesApi.categories.list(),
      ]);
      setGames(gamesRes.data?.data || []);
      setCategories(catRes.data?.data || []);
    } catch (err) {
      console.error('Failed to load games data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (game?: Game) => {
    if (game) {
      setEditingGame(game);
      const catId = typeof game.facilityCategory === 'object' && game.facilityCategory !== null
        ? (game.facilityCategory as any)._id
        : (game.facilityCategory as string) || '';
      
      setFormData({
        title: game.title || game.name || '',
        facilityCategory: catId,
        category: game.category || '',
        description: game.description || '',
        featured: game.featured || false,
        active: game.active ?? true,
        displayOrder: game.displayOrder || 1,
      });
      setImagePreview(game.coverImage || game.imageUrl || game.image || '');
    } else {
      setEditingGame(null);
      setFormData({
        title: '',
        facilityCategory: categories.length > 0 ? categories[0]._id : '',
        category: '',
        description: '',
        featured: false,
        active: true,
        displayOrder: games.length + 1,
      });
      setImagePreview('');
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please enter a game title');
      return;
    }

    setSaving(true);
    try {
      let savedId = editingGame?._id || editingGame?.id;
      
      // Look up category name/platform for backwards compat
      const matchedCat = categories.find(c => c._id === formData.facilityCategory);
      const payload: any = {
        ...formData,
        platform: matchedCat?.name || 'Console',
      };

      if (savedId) {
        await gamesApi.update(savedId, payload);
      } else {
        const createRes = await gamesApi.create(payload);
        const createdGame = createRes.data?.data;
        savedId = createdGame?._id || (createdGame as any)?.id;
      }

      if (imageFile && savedId) {
        await gamesApi.uploadImage(savedId, imageFile);
      }

      setIsModalOpen(false);
      await fetchInitialData();
    } catch (err: any) {
      console.error('Failed to save game:', err);
      alert(err.response?.data?.message || 'Error saving game');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to remove "${title}"?`)) {
      try {
        await gamesApi.delete(id);
        fetchInitialData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const toggleActive = async (game: Game) => {
    const id = game._id || game.id;
    if (!id) return;
    try {
      await gamesApi.update(id, { active: !game.active });
      fetchInitialData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredGames = games.filter(g => {
    const title = (g.title || g.name || '').toLowerCase();
    const matchesSearch = !search || title.includes(search.toLowerCase()) || (g.category || '').toLowerCase().includes(search.toLowerCase());
    
    const catId = typeof g.facilityCategory === 'object' && g.facilityCategory !== null
      ? (g.facilityCategory as any)._id
      : (g.facilityCategory as string);
    const matchesCategory = !selectedCategoryFilter || catId === selectedCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ color: '#ffffff', maxWidth: '1200px', margin: '0 auto' }}>
      <PageHeader
        title="Games Management"
        subtitle="Manage game titles and link them to experience categories (PS5, Racing Cockpit, etc.)"
        actions={
          <button
            onClick={() => handleOpenModal()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: '#c0c0c0',
              border: 'none',
              borderRadius: '8px',
              color: '#000000',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            <Plus size={16} /> Add Game
          </button>
        }
      />

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '28px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 300px' }}>
          <Search size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6b6b6b' }} />
          <input
            type="text"
            placeholder="Search games by title or genre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '11px 14px 11px 38px',
              background: '#111111',
              border: '1px solid #2a2a2a',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '0.85rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <select
          value={selectedCategoryFilter}
          onChange={(e) => setSelectedCategoryFilter(e.target.value)}
          style={{
            padding: '11px 16px',
            background: '#111111',
            border: '1px solid #2a2a2a',
            borderRadius: '8px',
            color: '#ffffff',
            fontSize: '0.85rem',
            outline: 'none',
            cursor: 'pointer',
            minWidth: '220px',
          }}
        >
          <option value="">All Categories ({games.length})</option>
          {categories.map((c) => {
            const count = games.filter(g => {
              const catId = typeof g.facilityCategory === 'object' && g.facilityCategory !== null
                ? (g.facilityCategory as any)._id
                : (g.facilityCategory as string);
              return catId === c._id;
            }).length;
            return (
              <option key={c._id} value={c._id}>
                {SLUG_TO_EMOJI[c.slug] || '🎮'} {c.name} ({count})
              </option>
            );
          })}
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b6b6b' }}>Loading games library...</div>
      ) : filteredGames.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 24px', background: '#111111', borderRadius: '12px', border: '1px solid #2a2a2a' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🎮</div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>No games found</h3>
          <p style={{ color: '#6b6b6b', fontSize: '0.85rem', marginBottom: '20px' }}>
            {search || selectedCategoryFilter ? 'Try clearing your search or category filter.' : 'Get started by adding your first game.'}
          </p>
          <button
            onClick={() => handleOpenModal()}
            style={{ padding: '8px 18px', background: '#c0c0c0', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}
          >
            Add New Game
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
          {filteredGames.map((game) => {
            const catObj = typeof game.facilityCategory === 'object' && game.facilityCategory !== null
              ? (game.facilityCategory as any)
              : categories.find(c => c._id === (game.facilityCategory as string));

            const cover = game.coverImage || game.imageUrl || game.image;
            const emoji = catObj ? (SLUG_TO_EMOJI[catObj.slug] || '🎮') : '🎮';

            return (
              <div
                key={game._id || game.id}
                style={{
                  background: '#111111',
                  border: '1px solid #2a2a2a',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'border-color 0.15s',
                }}
              >
                {/* Game Cover Thumbnail */}
                <div style={{ height: '160px', background: '#161616', position: 'relative', overflow: 'hidden' }}>
                  {cover ? (
                    <img
                      src={cover}
                      alt={game.title || game.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#4b4b4b', gap: '8px' }}>
                      <ImageIcon size={32} />
                      <span style={{ fontSize: '0.72rem' }}>No Cover Image</span>
                    </div>
                  )}

                  {/* Badges on image */}
                  <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '6px' }}>
                    {catObj && (
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        background: 'rgba(0,0,0,0.75)',
                        backdropFilter: 'blur(4px)',
                        color: '#ffffff',
                        border: '1px solid rgba(255,255,255,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        {emoji} {catObj.name}
                      </span>
                    )}
                  </div>

                  {game.featured && (
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: '#d4a017',
                      color: '#000000',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}>
                      <Sparkles size={11} /> FEATURED
                    </div>
                  )}
                </div>

                {/* Content */}
                <div style={{ padding: '18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.3 }}>
                    {game.title || game.name}
                  </h3>

                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
                    {game.category && (
                      <span style={{ fontSize: '0.7rem', color: '#c0c0c0', background: '#1c1c1c', padding: '2px 8px', borderRadius: '4px' }}>
                        {game.category}
                      </span>
                    )}
                    <span style={{
                      fontSize: '0.68rem',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: 700,
                      background: game.active ? '#2d7a4f18' : '#7a2d2d18',
                      color: game.active ? '#2d7a4f' : '#7a2d2d',
                      border: `1px solid ${game.active ? '#2d7a4f40' : '#7a2d2d40'}`,
                    }}>
                      {game.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {game.description && (
                    <p style={{
                      margin: '0 0 16px 0',
                      fontSize: '0.78rem',
                      color: '#7b7b7b',
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      flex: 1,
                    }}>
                      {game.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #1c1c1c' }}>
                    <button
                      type="button"
                      onClick={() => toggleActive(game)}
                      title={game.active ? 'Deactivate' : 'Activate'}
                      style={{
                        padding: '6px 10px',
                        background: '#161616',
                        border: '1px solid #2a2a2a',
                        borderRadius: '6px',
                        color: game.active ? '#c0c0c0' : '#6b6b6b',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      {game.active ? 'Deactivate' : 'Activate'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenModal(game)}
                      style={{
                        flex: 1,
                        padding: '6px 12px',
                        background: '#161616',
                        border: '1px solid #2a2a2a',
                        borderRadius: '6px',
                        color: '#ffffff',
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <Edit2 size={13} /> Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(game._id || game.id || '', game.title || game.name || 'this game')}
                      style={{
                        padding: '6px 10px',
                        background: '#7a2d2d18',
                        border: '1px solid #7a2d2d30',
                        borderRadius: '6px',
                        color: '#e07a7a',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Game Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: '#111111',
            border: '1px solid #2a2a2a',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '540px',
            padding: '28px',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <h2 style={{ margin: '0 0 6px 0', fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
              {editingGame ? 'Edit Game' : 'Add New Game'}
            </h2>
            <p style={{ margin: '0 0 22px 0', color: '#6b6b6b', fontSize: '0.82rem' }}>
              Assign this game to an experience category so players see it when booking.
            </p>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Game Title */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#c0c0c0', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Game Title *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. EA Sports FC 25, Tekken 8, Gran Turismo 7"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    background: '#0a0a0a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Experience Category Dropdown */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#c0c0c0', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Experience Category *
                </label>
                <select
                  required
                  value={formData.facilityCategory}
                  onChange={e => setFormData({ ...formData, facilityCategory: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    background: '#0a0a0a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">-- Select Category (e.g. PlayStation 5) --</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {SLUG_TO_EMOJI[cat.slug] || '🎮'} {cat.name}
                    </option>
                  ))}
                </select>
                <span style={{ display: 'block', marginTop: '4px', fontSize: '0.72rem', color: '#5b5b5b' }}>
                  Customers booking this category will see this game icon.
                </span>
              </div>

              {/* Genre / Tag */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#c0c0c0', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Genre / Tag (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sports, Racing, Fighting, Multiplayer"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    background: '#0a0a0a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Cover Image Upload & Preview */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#c0c0c0', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Game Cover Image (Icon)
                </label>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '8px',
                    background: '#0a0a0a',
                    border: '1px solid #2a2a2a',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <ImageIcon size={28} style={{ color: '#4b4b4b' }} />
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
                    <span style={{ display: 'block', marginTop: '6px', fontSize: '0.7rem', color: '#5b5b5b' }}>
                      Upload square or poster image. Shown in booking wizard.
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#c0c0c0', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Short Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Short description of game highlights, multiplayer modes, etc."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: '#0a0a0a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Toggles */}
              <div style={{ display: 'flex', gap: '24px', padding: '8px 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c0c0c0', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={e => setFormData({ ...formData, active: e.target.checked })}
                  />
                  Active (Visible to users)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c0c0c0', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={e => setFormData({ ...formData, featured: e.target.checked })}
                  />
                  Featured Game
                </label>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                  style={{
                    padding: '10px 20px',
                    background: '#161616',
                    border: '1px solid #2a2a2a',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '10px 24px',
                    background: saving ? '#4b4b4b' : '#c0c0c0',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#000000',
                    fontWeight: 800,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  {saving ? 'Saving...' : editingGame ? 'Save Changes' : 'Create Game'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
