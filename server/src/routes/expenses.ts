import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import Expense from '../models/Expense';
import ExpenseCategory from '../models/ExpenseCategory';
import { createAuditLog } from '../middleware/auditLogger';
import { format } from 'date-fns';

const router = express.Router();
router.use(authenticate, authorize('superadmin', 'manager'));

// List expense categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await ExpenseCategory.find({ active: true }).sort({ name: 1 });
    res.json({ success: true, data: categories });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create expense category
router.post('/categories', async (req, res) => {
  try {
    const category = await ExpenseCategory.create(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Delete expense category
router.delete('/categories/:id', authorize('superadmin'), async (req, res) => {
  try {
    await ExpenseCategory.findByIdAndUpdate(req.params.id, { active: false });
    res.json({ success: true, message: 'Category deactivated' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Excel export
router.get('/export/excel', async (req, res) => {
  try {
    const { dateFrom, dateTo, categoryId } = req.query as any;
    const query: any = { archived: false };
    if (categoryId) query.category = categoryId;
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = new Date(dateFrom);
      if (dateTo) query.date.$lte = new Date(dateTo);
    }
    const expenses = await Expense.find(query).populate('category', 'name').populate('createdBy', 'name').sort({ date: -1 });

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Expenses');
    const headerStyle = { font: { bold: true }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC0C0C0' } } };

    sheet.columns = [
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Title', key: 'title', width: 25 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Amount', key: 'amount', width: 12 },
      { header: 'Vendor', key: 'vendor', width: 20 },
      { header: 'Payment Method', key: 'paymentMethod', width: 15 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Created By', key: 'createdBy', width: 15 },
    ];

    sheet.getRow(1).eachCell((cell: any) => Object.assign(cell, headerStyle));

    expenses.forEach(e => {
      const cat = e.category as any;
      const cb = e.createdBy as any;
      sheet.addRow({
        date: format(e.date, 'yyyy-MM-dd'),
        title: e.title,
        category: cat?.name || '',
        amount: e.amount,
        vendor: e.vendor || '',
        paymentMethod: e.paymentMethod || '',
        description: e.description || '',
        createdBy: cb?.name || '',
      });
    });

    const totalRow = sheet.addRow({ title: 'TOTAL', amount: expenses.reduce((s, e) => s + e.amount, 0) });
    totalRow.font = { bold: true };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="expenses.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// List expenses with filters
router.get('/', async (req, res) => {
  try {
    const { dateFrom, dateTo, categoryId, page = '1', limit = '50' } = req.query as any;
    const query: any = { archived: false };
    if (categoryId) query.category = categoryId;
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = new Date(dateFrom);
      if (dateTo) query.date.$lte = new Date(dateTo);
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const [expenses, total] = await Promise.all([
      Expense.find(query).populate('category', 'name icon').populate('createdBy', 'name')
        .sort({ date: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
      Expense.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: expenses,
      pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create expense
router.post('/', async (req: any, res) => {
  try {
    const expense = await Expense.create({ ...req.body, createdBy: req.user._id });
    await createAuditLog({
      user: req.user, action: 'CREATE', entity: 'Expense',
      entityId: expense._id.toString(), description: `Expense "${expense.title}" added: ${expense.amount}`, ip: req.ip,
    });
    const populated = await Expense.findById(expense._id).populate('category', 'name icon');
    res.status(201).json({ success: true, data: populated });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Update expense
router.put('/:id', async (req: any, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('category', 'name icon');
    res.json({ success: true, data: expense });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Soft delete expense
router.delete('/:id', authorize('superadmin'), async (req: any, res) => {
  try {
    await Expense.findByIdAndUpdate(req.params.id, { archived: true });
    await createAuditLog({
      user: req.user, action: 'DELETE', entity: 'Expense', entityId: req.params.id,
      description: 'Expense archived', ip: req.ip,
    });
    res.json({ success: true, message: 'Expense archived' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Keep legacy /categories/all route for backward compat
router.get('/categories/all', async (req, res) => {
  try {
    const categories = await ExpenseCategory.find({ active: true }).sort({ name: 1 });
    res.json({ success: true, data: categories });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
