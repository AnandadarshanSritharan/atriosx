import api from './client';

export const galleryApi = {
  list: (params?: any) => api.get('/gallery', { params }),
  upload: (file: File, meta: { title?: string; category?: string; featured?: boolean }) => {
    const fd = new FormData();
    fd.append('image', file);
    Object.entries(meta).forEach(([k,v]) => v !== undefined && fd.append(k, String(v)));
    return api.post('/gallery', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  update: (id: string, data: any) => api.put(`/gallery/${id}`, data),
  delete: (id: string) => api.delete(`/gallery/${id}`),
};
