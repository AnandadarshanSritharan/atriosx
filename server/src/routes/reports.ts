import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import Booking from '../models/Booking';
import Expense from '../models/Expense';
import Facility from '../models/Facility';
import Partner from '../models/Partner';
import Revenue from '../models/Revenue';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, parseISO, format } from 'date-fns';

const router = express.Router();
router.use(authenticate, authorize('superadmin', 'manager'));

// Helper: parse date range from query
function parseDateRange(query: any): { start: Date; end: Date } {
  const { period, dateFrom, dateTo } = query;
  const now = new Date();
  if (dateFrom && dateTo) {
    return { start: startOfDay(parseISO(dateFrom)), end: endOfDay(parseISO(dateTo)) };
  }
  switch (period) {
    case 'today': return { start: startOfDay(now), end: endOfDay(now) };
    case 'yesterday': { const y = new Date(now); y.setDate(y.getDate() - 1); return { start: startOfDay(y), end: endOfDay(y) }; }
    case 'week': return { start: startOfWeek(now), end: endOfWeek(now) };
    case 'last_month': { const lm = subMonths(now, 1); return { start: startOfMonth(lm), end: endOfMonth(lm) }; }
    case 'month':
    default: return { start: startOfMonth(now), end: endOfMonth(now) };
  }
}

// Dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    const { start: monthStart, end: monthEnd } = parseDateRange({ period: 'month' });

    // Today stats
    const [todayBookings, upcomingBookings, pendingBookings, activeFacilities] = await Promise.all([
      Booking.find({ date: today, archived: false }),
      Booking.countDocuments({ date: { $gt: today }, status: { $in: ['pending', 'confirmed'] }, archived: false }),
      Booking.countDocuments({ status: 'pending', archived: false }),
      Facility.countDocuments({ active: true, archived: false }),
    ]);

    const todayRevenue = todayBookings
      .filter(b => ['completed', 'confirmed'].includes(b.status))
      .reduce((s, b) => s + b.total, 0);
    const completedToday = todayBookings.filter(b => b.status === 'completed').length;
    const noShowsToday = todayBookings.filter(b => b.status === 'no_show').length;

    // Monthly stats
    const monthlyBookings = await Booking.find({
      date: { $gte: format(monthStart, 'yyyy-MM-dd'), $lte: format(monthEnd, 'yyyy-MM-dd') },
      archived: false,
    });
    const monthRevenue = monthlyBookings
      .filter(b => ['completed', 'confirmed'].includes(b.status))
      .reduce((s, b) => s + b.total, 0);

    const monthExpenses = await Expense.aggregate([
      { $match: { date: { $gte: monthStart, $lte: monthEnd }, archived: false } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalMonthExpenses = monthExpenses[0]?.total || 0;

    // Revenue chart: last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    const last30Bookings = await Booking.find({
      date: { $gte: format(thirtyDaysAgo, 'yyyy-MM-dd'), $lte: today },
      status: { $in: ['completed', 'confirmed'] },
      archived: false,
    }).select('date total');

    const revenueByDate: Record<string, number> = {};
    last30Bookings.forEach(b => {
      revenueByDate[b.date] = (revenueByDate[b.date] || 0) + b.total;
    });
    const revenueChart = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      revenueChart.push({ date: dateStr, revenue: revenueByDate[dateStr] || 0 });
    }

    res.json({
      success: true,
      data: {
        todayBookings: todayBookings.length,
        todayRevenue,
        upcomingBookings,
        completedToday,
        noShowsToday,
        activeFacilities,
        pendingBookings,
        monthRevenue,
        monthExpenses: totalMonthExpenses,
        netProfit: monthRevenue - totalMonthExpenses,
        occupancyRate: 0, // Calculated in facility-performance
        revenueChart,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Revenue report
router.get('/revenue', async (req, res) => {
  try {
    const { start, end } = parseDateRange(req.query);
    const { facilityId } = req.query as any;

    const match: any = {
      date: { $gte: format(start, 'yyyy-MM-dd'), $lte: format(end, 'yyyy-MM-dd') },
      status: { $in: ['completed', 'confirmed'] },
      archived: false,
    };
    if (facilityId) match.facility = facilityId;

    const bookings = await Booking.find(match).populate('facility', 'name color').populate('customer', 'name phone');

    // Group by date
    const byDate: Record<string, number> = {};
    bookings.forEach(b => { byDate[b.date] = (byDate[b.date] || 0) + b.total; });
    const chartData = Object.entries(byDate).map(([date, revenue]) => ({ date, revenue })).sort((a, b) => a.date.localeCompare(b.date));

    // Group by facility
    const byFacility: Record<string, { name: string; revenue: number; count: number; color: string }> = {};
    bookings.forEach(b => {
      const f = b.facility as any;
      if (f && typeof f === 'object') {
        if (!byFacility[f._id]) byFacility[f._id] = { name: f.name, revenue: 0, count: 0, color: f.color || '#c0c0c0' };
        byFacility[f._id].revenue += b.total;
        byFacility[f._id].count += 1;
      }
    });

    const total = bookings.reduce((s, b) => s + b.total, 0);

    res.json({
      success: true,
      data: {
        total,
        bookings,
        chartData,
        byFacility: Object.values(byFacility),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Expense report
router.get('/expenses', async (req, res) => {
  try {
    const { start, end } = parseDateRange(req.query);
    const { categoryId } = req.query as any;

    const match: any = { date: { $gte: start, $lte: end }, archived: false };
    if (categoryId) match.category = categoryId;

    const expenses = await Expense.find(match).populate('category', 'name icon').populate('createdBy', 'name');

    // Group by category
    const byCategory: Record<string, { name: string; amount: number; count: number }> = {};
    expenses.forEach(e => {
      const cat = e.category as any;
      const catName = (cat && typeof cat === 'object') ? cat.name : 'Other';
      const catId = (cat && typeof cat === 'object') ? String(cat._id) : 'other';
      if (!byCategory[catId]) byCategory[catId] = { name: catName, amount: 0, count: 0 };
      byCategory[catId].amount += e.amount;
      byCategory[catId].count += 1;
    });

    // Group by date
    const byDate: Record<string, number> = {};
    expenses.forEach(e => {
      const d = format(e.date, 'yyyy-MM-dd');
      byDate[d] = (byDate[d] || 0) + e.amount;
    });
    const chartData = Object.entries(byDate).map(([date, amount]) => ({ date, amount })).sort((a, b) => a.date.localeCompare(b.date));

    const total = expenses.reduce((s, e) => s + e.amount, 0);

    res.json({
      success: true,
      data: { total, expenses, chartData, byCategory: Object.values(byCategory) },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Profit report
router.get('/profit', async (req, res) => {
  try {
    const { start, end } = parseDateRange(req.query);

    const [bookings, expenses, partners] = await Promise.all([
      Booking.find({
        date: { $gte: format(start, 'yyyy-MM-dd'), $lte: format(end, 'yyyy-MM-dd') },
        status: { $in: ['completed', 'confirmed'] },
        archived: false,
      }),
      Expense.find({ date: { $gte: start, $lte: end }, archived: false }),
      Partner.find({ active: true }),
    ]);

    const revenue = bookings.reduce((s, b) => s + b.total, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const netProfit = revenue - totalExpenses;

    // Partner distribution
    const totalInvestment = partners.reduce((s, p) => s + p.totalInvestment, 0);
    const distribution = partners.map(p => {
      const pct = p.percentageType === 'manual'
        ? p.ownershipPercentage
        : (totalInvestment > 0 ? (p.totalInvestment / totalInvestment) * 100 : 0);
      return {
        partner: { _id: p._id, name: p.name },
        percentage: Math.round(pct * 100) / 100,
        share: Math.round((netProfit * pct) / 100 * 100) / 100,
        investment: p.totalInvestment,
        percentageType: p.percentageType,
      };
    });

    res.json({
      success: true,
      data: { revenue, expenses: totalExpenses, netProfit, distribution, period: { start, end } },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Facility performance
router.get('/facility-performance', async (req, res) => {
  try {
    const { start, end } = parseDateRange(req.query);

    const facilities = await Facility.find({ archived: false }).populate('category', 'name');
    const results = await Promise.all(facilities.map(async (facility) => {
      const bookings = await Booking.find({
        facility: facility._id,
        date: { $gte: format(start, 'yyyy-MM-dd'), $lte: format(end, 'yyyy-MM-dd') },
        archived: false,
      });

      const completedBookings = bookings.filter(b => ['completed', 'confirmed'].includes(b.status));
      const revenue = completedBookings.reduce((s, b) => s + b.total, 0);
      const totalHours = completedBookings.reduce((s, b) => s + b.durationMinutes, 0) / 60;
      const noShows = bookings.filter(b => b.status === 'no_show').length;

      // Calculate utilization
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const dailyHours = 12; // approximate operating hours
      const availableHours = days * dailyHours;
      const utilization = availableHours > 0 ? Math.round((totalHours / availableHours) * 100) : 0;

      return {
        facility: { _id: facility._id, name: facility.name, color: facility.color, category: facility.category },
        totalBookings: bookings.length,
        completedBookings: completedBookings.length,
        cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
        noShows,
        revenue,
        totalHours: Math.round(totalHours * 10) / 10,
        utilization,
        avgBookingDuration: completedBookings.length > 0
          ? Math.round(completedBookings.reduce((s, b) => s + b.durationMinutes, 0) / completedBookings.length)
          : 0,
        avgBookingValue: completedBookings.length > 0 ? Math.round(revenue / completedBookings.length) : 0,
      };
    }));

    results.sort((a, b) => b.revenue - a.revenue);
    res.json({ success: true, data: results });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Partner distribution
router.get('/partner-distribution', async (req, res) => {
  try {
    const { start, end } = parseDateRange(req.query);

    const [bookings, expenses, partners] = await Promise.all([
      Booking.find({
        date: { $gte: format(start, 'yyyy-MM-dd'), $lte: format(end, 'yyyy-MM-dd') },
        status: { $in: ['completed', 'confirmed'] },
        archived: false,
      }),
      Expense.find({ date: { $gte: start, $lte: end }, archived: false }),
      Partner.find({ active: true }),
    ]);

    const revenue = bookings.reduce((s, b) => s + b.total, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const netProfit = revenue - totalExpenses;
    const totalInvestment = partners.reduce((s, p) => s + p.totalInvestment, 0);

    const distribution = partners.map(p => {
      const pct = p.percentageType === 'manual'
        ? p.ownershipPercentage
        : (totalInvestment > 0 ? (p.totalInvestment / totalInvestment) * 100 : 0);
      return {
        _id: p._id,
        name: p.name,
        email: p.email,
        investment: p.totalInvestment,
        percentage: Math.round(pct * 100) / 100,
        share: Math.round((netProfit * pct) / 100 * 100) / 100,
        percentageType: p.percentageType,
      };
    });

    res.json({
      success: true,
      data: { revenue, expenses: totalExpenses, netProfit, distribution, period: { start, end } },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Excel export endpoints
router.get('/export/bookings', async (req, res) => {
  try {
    const { start, end } = parseDateRange(req.query);
    const bookings = await Booking.find({
      date: { $gte: format(start, 'yyyy-MM-dd'), $lte: format(end, 'yyyy-MM-dd') },
      archived: false,
    }).populate('customer', 'name phone email').populate('facility', 'name');

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Bookings');

    const headerStyle = { font: { bold: true, color: { argb: 'FF000000' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC0C0C0' } }, alignment: { horizontal: 'center' as const } };

    sheet.columns = [
      { header: 'Booking #', key: 'bookingNumber', width: 15 },
      { header: 'Customer', key: 'customer', width: 20 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Facility', key: 'facility', width: 20 },
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Start', key: 'startTime', width: 10 },
      { header: 'End', key: 'endTime', width: 10 },
      { header: 'Duration (min)', key: 'duration', width: 14 },
      { header: 'Rate', key: 'rate', width: 12 },
      { header: 'Amount', key: 'total', width: 12 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Payment', key: 'paymentStatus', width: 12 },
      { header: 'Source', key: 'source', width: 12 },
      { header: 'Checked In', key: 'checkedIn', width: 12 },
      { header: 'Created', key: 'createdAt', width: 18 },
    ];

    sheet.getRow(1).eachCell((cell: any) => { Object.assign(cell, headerStyle); });

    bookings.forEach(b => {
      const cust = b.customer as any;
      const fac = b.facility as any;
      sheet.addRow({
        bookingNumber: b.bookingNumber,
        customer: cust?.name || '',
        phone: cust?.phone || '',
        facility: fac?.name || '',
        date: b.date,
        startTime: b.startTime,
        endTime: b.endTime,
        duration: b.durationMinutes,
        rate: b.rateSnapshot,
        total: b.total,
        status: b.status,
        paymentStatus: b.paymentStatus,
        source: b.bookingSource,
        checkedIn: b.checkedIn ? 'Yes' : 'No',
        createdAt: (b as any).createdAt ? format(new Date((b as any).createdAt), 'yyyy-MM-dd HH:mm') : '',
      });
    });

    // Total row
    const totalRow = sheet.addRow({ customer: 'TOTAL', total: bookings.reduce((s, b) => s + b.total, 0) });
    totalRow.font = { bold: true };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="bookings-${format(start, 'yyyy-MM-dd')}-${format(end, 'yyyy-MM-dd')}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/export/expenses', async (req, res) => {
  try {
    const { start, end } = parseDateRange(req.query);
    const expenses = await Expense.find({ date: { $gte: start, $lte: end }, archived: false })
      .populate('category', 'name').populate('createdBy', 'name');

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Expenses');

    sheet.columns = [
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Title', key: 'title', width: 25 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Amount', key: 'amount', width: 12 },
      { header: 'Vendor', key: 'vendor', width: 20 },
      { header: 'Payment Method', key: 'paymentMethod', width: 15 },
      { header: 'Created By', key: 'createdBy', width: 15 },
    ];

    const headerStyle = { font: { bold: true }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC0C0C0' } } };
    sheet.getRow(1).eachCell((cell: any) => { Object.assign(cell, headerStyle); });

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

router.get('/export/profit', async (req, res) => {
  try {
    const { start, end } = parseDateRange(req.query);
    const [bookings, expenses, partners] = await Promise.all([
      Booking.find({ date: { $gte: format(start, 'yyyy-MM-dd'), $lte: format(end, 'yyyy-MM-dd') }, status: { $in: ['completed', 'confirmed'] }, archived: false }),
      Expense.find({ date: { $gte: start, $lte: end }, archived: false }),
      Partner.find({ active: true }),
    ]);

    const revenue = bookings.reduce((s, b) => s + b.total, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const netProfit = revenue - totalExpenses;
    const totalInvestment = partners.reduce((s, p) => s + p.totalInvestment, 0);

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Profit Distribution');
    const headerStyle = { font: { bold: true }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC0C0C0' } } };

    sheet.addRow(['Profit Distribution Report']);
    sheet.addRow([`Period: ${format(start, 'yyyy-MM-dd')} to ${format(end, 'yyyy-MM-dd')}`]);
    sheet.addRow([]);
    sheet.addRow(['Total Revenue', revenue]);
    sheet.addRow(['Total Expenses', totalExpenses]);
    sheet.addRow(['Net Profit', netProfit]);
    sheet.addRow([]);

    const headerRow = sheet.addRow(['Partner', 'Investment', 'Ownership %', 'Profit Share']);
    headerRow.eachCell((cell: any) => Object.assign(cell, headerStyle));

    partners.forEach(p => {
      const pct = p.percentageType === 'manual'
        ? p.ownershipPercentage
        : (totalInvestment > 0 ? (p.totalInvestment / totalInvestment) * 100 : 0);
      const share = (netProfit * pct) / 100;
      sheet.addRow([p.name, p.totalInvestment, `${Math.round(pct * 100) / 100}%`, Math.round(share * 100) / 100]);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="profit-distribution.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
