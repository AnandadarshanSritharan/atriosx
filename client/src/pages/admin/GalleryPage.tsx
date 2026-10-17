import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { galleryApi } from '../../api/gallery';
import { PageHeader } from '../../components/shared/PageHeader';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import type { Gallery } from '../../types';

export default function AdminGalleryPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Lounge',
    url: '',
  });

  const { data: galleryRes, isLoading } = useQuery({
    queryKey: ['admin-gallery'],
    queryFn: () => galleryApi.list().then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => galleryApi.update('new', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gallery'] });
      setIsModalOpen(false);
      setFormData({ title: '', category: 'Lounge', url: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => galleryApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gallery'] });
    },
  });

  const images = galleryRes?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lounge Gallery"
        subtitle="Manage atmosphere photography, interior aesthetics, and tournament moments"
        actions={
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Photo URL
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="card-premium h-48 skeleton" />)}
        </div>
      ) : images.length === 0 ? (
        <div className="card-premium p-12 text-center text-muted">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 text-silver-dark opacity-50" />
          <p>No gallery photos uploaded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {images.map((img: Gallery) => (
            <div key={img._id} className="card-premium overflow-hidden group relative">
              <img src={img.url} alt={img.title || 'Atrios'} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">{img.title || 'Atrios Lounge'}</h4>
                  <span className="text-xs text-muted">{img.category || 'Interior'}</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-400 hover:text-red-300"
                  onClick={() => {
                    if (confirm('Delete this photo?')) deleteMutation.mutate(img._id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-xl font-bold text-white">Add Image URL</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-silver uppercase mb-1 block">Title</label>
                <Input
                  placeholder="e.g. VIP Cockpit Suite"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-silver uppercase mb-1 block">Category</label>
                <Input
                  placeholder="e.g. Atmosphere / Racing"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-silver uppercase mb-1 block">Image Web URL</label>
                <Input
                  placeholder="https://images.unsplash.com/..."
                  value={formData.url}
                  onChange={e => setFormData({ ...formData, url: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button onClick={() => createMutation.mutate(formData)}>Save Photo</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
