import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { newsApi } from '@/api/news';
import { uploadApi } from '@/api/upload';
import PageHeader from '@/components/shared/PageHeader';
import { AlertCircle, Newspaper, Plus, Upload, Loader2 } from 'lucide-react';

export default function NewsPage() {
  const queryClient = useQueryClient();
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    content: '',
    excerpt: '',
    imageUrl: '',
    publishedAt: '',
    published: true,
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const res = await uploadApi.uploadImage(file);
      if (res.data?.url) {
        setFormData(prev => ({ ...prev, imageUrl: res.data.url }));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to upload image to Cloudinary');
    } finally {
      setUploadingImg(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await newsApi.list();
      setNews(res.data?.data || []);
    } catch (err: any) {
      console.error('Failed to load news:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (article?: any) => {
    setErrorMsg('');
    if (article) {
      const targetId = article._id || article.id;
      setEditingId(targetId);
      const dateVal = article.publishedAt || article.publishDate;
      const dateStr = dateVal ? new Date(dateVal).toISOString().split('T')[0] : '';
      const imgVal = article.imageUrl || article.featuredImage || article.image || '';
      const isPub = article.published !== undefined ? article.published : article.status === 'published';

      setFormData({
        title: article.title || '',
        category: article.category || 'General',
        content: article.content || '',
        excerpt: article.excerpt || '',
        imageUrl: imgVal,
        publishedAt: dateStr,
        published: isPub,
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        category: 'General',
        content: '',
        excerpt: '',
        imageUrl: '',
        publishedAt: new Date().toISOString().split('T')[0],
        published: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSaving(true);
    try {
      const dateIso = formData.publishedAt ? new Date(formData.publishedAt).toISOString() : new Date().toISOString();
      const imgVal = formData.imageUrl.trim();

      const dataToSave: any = {
        title: formData.title.trim(),
        category: formData.category.trim() || 'General',
        excerpt: formData.excerpt.trim() || formData.content.slice(0, 150),
        content: formData.content.trim(),
        imageUrl: imgVal,
        featuredImage: imgVal,
        image: imgVal,
        publishedAt: dateIso,
        publishDate: dateIso,
        published: formData.published,
        status: formData.published ? 'published' : 'draft',
      };

      if (editingId) {
        await newsApi.update(editingId, dataToSave);
      } else {
        await newsApi.create(dataToSave);
      }
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['news'] });
      queryClient.invalidateQueries({ queryKey: ['news-public'] });
      queryClient.invalidateQueries({ queryKey: ['news-public-all'] });
      await fetchNews();
    } catch (err: any) {
      console.error('Error saving news:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to save news article.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!id) return;
    if (window.confirm('Are you sure you want to delete this article?')) {
      try {
        await newsApi.delete(id);
        queryClient.invalidateQueries({ queryKey: ['news'] });
        queryClient.invalidateQueries({ queryKey: ['news-public'] });
        queryClient.invalidateQueries({ queryKey: ['news-public-all'] });
        await fetchNews();
      } catch (err: any) {
        console.error('Error deleting article:', err);
        alert(err.response?.data?.message || 'Failed to delete article.');
      }
    }
  };

  return (
    <div style={{ color: '#ffffff' }}>
      <PageHeader 
        title="News Management" 
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
            <Plus size={16} /> Add News
          </button>
        }
      />

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6b6b6b' }}>Loading news articles...</div>
      ) : news.length === 0 ? (
        <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '60px 24px', textAlign: 'center' }}>
          <Newspaper size={40} color="#333333" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.1rem', color: '#ffffff', marginBottom: '8px' }}>No News Articles Yet</h3>
          <p style={{ fontSize: '0.82rem', color: '#6b6b6b', marginBottom: '20px' }}>Publish updates, event announcements, and tournament notices.</p>
          <button onClick={() => handleOpenModal()} style={{ padding: '8px 18px', background: '#c0c0c0', border: 'none', borderRadius: '6px', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>
            + Create First Article
          </button>
        </div>
      ) : (
        <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
            <thead style={{ background: '#0d0d0d', borderBottom: '1px solid #2a2a2a' }}>
              <tr>
                <th style={{ padding: '14px 16px', fontWeight: 600, color: '#4b4b4b', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.7rem' }}>Title</th>
                <th style={{ padding: '14px 16px', fontWeight: 600, color: '#4b4b4b', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.7rem' }}>Category</th>
                <th style={{ padding: '14px 16px', fontWeight: 600, color: '#4b4b4b', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.7rem' }}>Date</th>
                <th style={{ padding: '14px 16px', fontWeight: 600, color: '#4b4b4b', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.7rem' }}>Status</th>
                <th style={{ padding: '14px 16px', fontWeight: 600, color: '#4b4b4b', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.7rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {news.map((article: any, i: number) => {
                const articleId = article._id || article.id;
                const isPublished = article.published ?? (article.status === 'published');
                const dateVal = article.publishedAt || article.publishDate;
                return (
                  <tr key={articleId} style={{ borderBottom: i === news.length - 1 ? 'none' : '1px solid #1a1a1a', transition: 'background 0.1s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#161616'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#ffffff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {(article.imageUrl || article.featuredImage || article.image) && (
                          <img 
                            src={article.imageUrl || article.featuredImage || article.image} 
                            alt="" 
                            style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover', background: '#222' }} 
                          />
                        )}
                        <span>{article.title}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#8b8b8b' }}>
                      <span style={{ background: '#1c1c1c', border: '1px solid #2a2a2a', padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem' }}>
                        {article.category || 'General'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#8b8b8b', whiteSpace: 'nowrap' }}>
                      {dateVal ? new Date(dateVal).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                    </td>
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      {isPublished ? (
                        <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, background: '#2d7a4f15', color: '#2d7a4f', border: '1px solid #2d7a4f40' }}>Published</span>
                      ) : (
                        <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, background: '#2a2a2a', color: '#c0c0c0', border: '1px solid #3a3a3a' }}>Draft</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button onClick={() => handleOpenModal(article)} style={{ marginRight: '8px', padding: '6px 12px', background: '#161616', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Edit</button>
                      <button onClick={() => handleDelete(articleId)} style={{ padding: '6px 12px', background: '#7a2d2d20', border: '1px solid #7a2d2d50', borderRadius: '6px', color: '#ff6b6b', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: '16px', width: '100%', maxWidth: '700px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '1.4rem', color: '#ffffff', fontWeight: 800 }}>{editingId ? 'Edit Article' : 'Add New Article'}</h2>

            {errorMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#7a2d2d20', border: '1px solid #7a2d2d60', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', color: '#ff8b8b', fontSize: '0.82rem' }}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#8b8b8b', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Title *</label>
                <input required type="text" placeholder="e.g. Grand Opening: Atrios Entertainment Lounge" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={{ width: '100%', padding: '10px 14px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '7px', color: '#ffffff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#8b8b8b', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Category *</label>
                  <input required type="text" placeholder="e.g. Announcements, Tournaments, Gaming" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={{ width: '100%', padding: '10px 14px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '7px', color: '#ffffff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#8b8b8b', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Publish Date</label>
                  <input type="date" value={formData.publishedAt} onChange={e => setFormData({...formData, publishedAt: e.target.value})} style={{ width: '100%', padding: '10px 14px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '7px', color: '#ffffff', fontSize: '0.85rem', outline: 'none', colorScheme: 'dark', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#8b8b8b', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Article Image</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                  <input type="text" placeholder="https://example.com/banner.jpg or upload from computer" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} style={{ flex: 1, padding: '10px 14px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '7px', color: '#ffffff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: '#1c1c1c', border: '1px solid #3a3a3a', borderRadius: '7px', color: '#ffffff', fontSize: '0.8rem', fontWeight: 700, cursor: uploadingImg ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                    {uploadingImg ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={15} />}
                    {uploadingImg ? 'Uploading...' : 'Upload File'}
                    <input type="file" accept="image/*" disabled={uploadingImg} onChange={handleFileUpload} style={{ display: 'none' }} />
                  </label>
                </div>
                {formData.imageUrl && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '12px', background: '#0a0a0a', padding: '8px 12px', borderRadius: '6px', border: '1px solid #222' }}>
                    <img src={formData.imageUrl} alt="" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px' }} />
                    <span style={{ fontSize: '0.75rem', color: '#8b8b8b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '400px' }}>{formData.imageUrl}</span>
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#8b8b8b', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Excerpt (Short Summary)</label>
                <textarea rows={2} placeholder="Short 1-2 sentence preview..." value={formData.excerpt} onChange={e => setFormData({...formData, excerpt: e.target.value})} style={{ width: '100%', padding: '10px 14px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '7px', color: '#ffffff', fontSize: '0.85rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#8b8b8b', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Content *</label>
                <textarea required rows={7} placeholder="Full article body..." value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} style={{ width: '100%', padding: '10px 14px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '7px', color: '#ffffff', fontSize: '0.85rem', outline: 'none', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c0c0c0', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.published} onChange={e => setFormData({...formData, published: e.target.checked})} />
                  Published (Visible immediately on the public website)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 20px', background: '#161616', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#ffffff', cursor: 'pointer', fontSize: '0.85rem' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: '10px 22px', background: saving ? '#555555' : '#c0c0c0', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}>
                  {saving ? 'Saving...' : 'Save Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
