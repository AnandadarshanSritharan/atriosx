import api from './client';

export const auditLogsApi = {
  list: (params?: { page?: number; limit?: number; entity?: string; userId?: string; dateFrom?: string; dateTo?: string }) => api.get('/audit-logs', { params }),
};
