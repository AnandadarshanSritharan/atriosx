import api from './client';
import type { Expense, ExpenseCategory, ApiResponse } from '../types';

export const expensesApi = {
  list: (params?: { dateFrom?: string; dateTo?: string; categoryId?: string; page?: number }) => api.get<ApiResponse<Expense[]>>('/expenses', { params }),
  create: (data: Partial<Expense>) => api.post<ApiResponse<Expense>>('/expenses', data),
  update: (id: string, data: Partial<Expense>) => api.put<ApiResponse<Expense>>(`/expenses/${id}`, data),
  delete: (id: string) => api.delete(`/expenses/${id}`),
  exportExcel: (params?: any) => api.get('/expenses/export/excel', { params, responseType: 'blob' }),
  categories: {
    list: () => api.get<ApiResponse<ExpenseCategory[]>>('/expenses/categories'),
    create: (data: { name: string; icon?: string }) => api.post<ApiResponse<ExpenseCategory>>('/expenses/categories', data),
    delete: (id: string) => api.delete(`/expenses/categories/${id}`),
  },
};
