import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesApi } from '../../api/expenses';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable } from '../../components/shared/DataTable';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Plus, Download, Receipt, Trash2 } from 'lucide-react';
import type { Expense, ExpenseCategory } from '../../types';

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    vendor: '',
    paymentMethod: 'Cash',
    description: '',
  });

  const { data: expensesRes, isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => expensesApi.list().then(res => res.data),
  });

  const { data: categoriesRes } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => expensesApi.categories.list().then(res => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Expense>) => expensesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setIsModalOpen(false);
      setFormData({
        title: '',
        category: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        vendor: '',
        paymentMethod: 'Cash',
        description: '',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expensesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  const expenses = expensesRes?.data || [];
  const categories = categoriesRes?.data || [];

  const totalExpense = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount || !formData.category) return;
    createMutation.mutate({
      title: formData.title,
      category: formData.category,
      amount: parseFloat(formData.amount),
      date: formData.date,
      vendor: formData.vendor,
      paymentMethod: formData.paymentMethod,
      description: formData.description,
    });
  };

  const handleExport = async () => {
    try {
      const res = await expensesApi.exportExcel();
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Expenses-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export failed', err);
    }
  };

  const columns = [
    {
      header: 'Title',
      accessor: (item: Expense) => (
        <div>
          <div className="font-semibold text-white">{item.title}</div>
          {item.description && <div className="text-xs text-muted truncate max-w-xs">{item.description}</div>}
        </div>
      ),
    },
    {
      header: 'Category',
      accessor: (item: Expense) => {
        const cat = item.category as ExpenseCategory;
        return (
          <span className="px-2.5 py-1 bg-surface-2 border border-border rounded text-xs text-silver">
            {cat?.name || 'General'}
          </span>
        );
      },
    },
    {
      header: 'Vendor',
      accessor: (item: Expense) => <span className="text-sm text-silver-light">{item.vendor || '—'}</span>,
    },
    {
      header: 'Date',
      accessor: (item: Expense) => <span className="text-sm text-muted">{item.date ? String(item.date).split('T')[0] : '—'}</span>,
    },
    {
      header: 'Amount',
      accessor: (item: Expense) => (
        <span className="font-bold text-red-400">Rs. {Number(item.amount).toLocaleString()}</span>
      ),
    },
    {
      header: 'Payment Method',
      accessor: (item: Expense) => <span className="text-xs text-muted uppercase">{item.paymentMethod || 'Cash'}</span>,
    },
    {
      header: 'Actions',
      accessor: (item: Expense) => (
        <Button
          size="sm"
          variant="ghost"
          className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
          onClick={() => {
            if (confirm('Archive this expense?')) deleteMutation.mutate(item._id);
          }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operating Expenses"
        subtitle="Track operational costs, utilities, and vendor payouts"
        actions={
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleExport} className="flex items-center gap-2">
              <Download className="w-4 h-4" /> Export Excel
            </Button>
            <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Expense
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-premium p-6">
          <div className="flex items-center justify-between text-muted text-sm uppercase">
            <span>Total Expenses</span>
            <Receipt className="w-5 h-5 text-silver" />
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">
            Rs. {totalExpense.toLocaleString()}
          </div>
          <p className="text-xs text-muted mt-1">{expenses.length} records recorded</p>
        </div>
      </div>

      <div className="card-premium overflow-hidden">
        <DataTable columns={columns} data={expenses} loading={isLoading} emptyMessage="No expenses recorded yet." />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-xl font-bold text-white">Record New Expense</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-silver uppercase mb-1 block">Expense Title *</label>
                <Input
                  required
                  placeholder="e.g. Electricity Bill - October"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-silver uppercase mb-1 block">Category *</label>
                  <select
                    required
                    className="w-full h-10 rounded-md border border-border bg-surface px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-silver"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="">Select Category</option>
                    {categories.map((c: ExpenseCategory) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-silver uppercase mb-1 block">Amount (Rs.) *</label>
                  <Input
                    required
                    type="number"
                    min="0"
                    placeholder="25000"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-silver uppercase mb-1 block">Date</label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-silver uppercase mb-1 block">Payment Method</label>
                  <select
                    className="w-full h-10 rounded-md border border-border bg-surface px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-silver"
                    value={formData.paymentMethod}
                    onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Card">Card</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-silver uppercase mb-1 block">Vendor / Payee</label>
                <Input
                  placeholder="e.g. Ceylon Electricity Board"
                  value={formData.vendor}
                  onChange={e => setFormData({ ...formData, vendor: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-silver uppercase mb-1 block">Description / Notes</label>
                <Input
                  placeholder="Optional details..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Saving...' : 'Save Expense'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
