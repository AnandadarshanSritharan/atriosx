import api from './client';

export const uploadApi = {
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await api.post<{ success: boolean; data: { url: string; filename: string } }>('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};
