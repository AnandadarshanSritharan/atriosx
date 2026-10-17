import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { bookingService, getColomboNow } from '../services/bookingService';
import Booking from '../models/Booking';
import Facility from '../models/Facility';
import { createAuditLog } from '../middleware/auditLogger';
import { format } from 'date-fns';

const router = express.Router();

// Public: get availability by facilityId
router.get('/availability', async (req, res) => {
  try {
    const { facilityId, date } = req.query as { facilityId: string; date: string };
    if (!facilityId || !date) {
      return res.status(400).json({ success: false, message: 'facilityId and date are required' });
    }
    const availability = await bookingService.getAvailableSlots({ facilityId, date });
    res.json({ success: true, data: availability });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Public: get availability by categoryId — merges slots across all units in the category
// A slot is "available" if at least one facility unit in the category is free at that time
router.get('/availability-by-category', async (req, res) => {
  try {
    const { categoryId, date } = req.query as { categoryId: string; date: string };
    if (!categoryId || !date) {
      return res.status(400).json({ success: false, message: 'categoryId and date are required' });
    }

    // Get all active, bookable facilities in this category sorted by displayOrder
    const facilities = await Facility.find({
      category: categoryId,
      active: true,
      bookingEnabled: true,
      archived: false,
    }).sort({ displayOrder: 1, name: 1 });

    if (facilities.length === 0) {
      return res.json({ success: true, data: { available: false, slots: [], reason: 'No facilities in this category' } });
    }

    // Get availability for each facility and merge: slot available if ANY unit is free
    const allSlotMaps: Map<string, boolean>[] = [];
    let sharedMeta: any = null;

    for (const facility of facilities) {
      const avail = await bookingService.getAvailableSlots({ facilityId: facility._id.toString(), date });
      if (avail.available && avail.slots.length > 0) {
        if (!sharedMeta) {
          sharedMeta = {
            openTime: avail.openTime,
            closeTime: avail.closeTime,
            minDuration: avail.minDuration,
            maxDuration: avail.maxDuration,
            interval: avail.interval,
          };
        }
        const slotMap = new Map<string, boolean>();
        avail.slots.forEach((s: any) => slotMap.set(s.time, s.available));
        allSlotMaps.push(slotMap);
      }
    }

    if (!sharedMeta) {
      return res.json({ success: true, data: { available: false, slots: [], reason: 'Closed or unavailable' } });
    }

    // Build merged slots: available if at least one unit is free
    const allTimes = new Set<string>();
    allSlotMaps.forEach(m => m.forEach((_, time) => allTimes.add(time)));
    const sortedTimes = Array.from(allTimes).sort();

    const mergedSlots = sortedTimes.map(time => {
      const isAvailable = allSlotMaps.some(m => m.get(time) === true);
      const freeUnits = allSlotMaps.filter(m => m.get(time) === true).length;
      return { time, available: isAvailable, freeUnits };
    });

    res.json({
      success: true,
      data: {
        available: true,
        slots: mergedSlots,
        totalUnits: facilities.length,
        ...sharedMeta,
      },
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Public: create booking (no auth required)
// Supports both facilityId (admin/direct) and categoryId (public category-based with auto-assign)
router.post('/', async (req: any, res) => {
  try {
    const rawDate = req.body.date;
    const rawStartTime = req.body.startTime;
    const durationMinutes = Number(req.body.durationMinutes || req.body.duration || 60);
    const customerName = req.body.customerName || req.body.name || (req.user || req.body.source === 'admin' || req.body.source === 'walk_in' ? 'Walk-in Guest' : '');
    const customerPhone = req.body.customerPhone || req.body.phone || (req.user || req.body.source === 'admin' || req.body.source === 'walk_in' ? `walkin-${Date.now()}` : '');
    const customerEmail = req.body.customerEmail || req.body.email;
    const notes = req.body.notes;
    const discount = req.body.discount;
    const categoryId = req.body.categoryId;
    const personCount = Number(req.body.personCount || req.body.persons || req.body.players || 1);
    const customStatus = req.body.status;
    let facilityId = req.body.facilityId;

    // Colombo local time
    const colomboNow = getColomboNow();

    // Normalizing date: if empty or missing, default to today in Colombo time
    const date = rawDate || colomboNow.dateStr;

    // Normalizing startTime (supports formats like "8.27", "8:27", "08:27", etc.)
    let startTime = '09:00';
    if (rawStartTime) {
      const parts = String(rawStartTime).trim().replace(/[.\s,-]/g, ':').split(':');
      if (parts.length >= 2) {
        const h = Math.min(23, Math.max(0, parseInt(parts[0], 10) || 0));
        const m = Math.min(59, Math.max(0, parseInt(parts[1], 10) || 0));
        startTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      } else if (parts.length === 1 && !isNaN(parseInt(parts[0], 10))) {
        const h = Math.min(23, Math.max(0, parseInt(parts[0], 10) || 0));
        startTime = `${String(h).padStart(2, '0')}:00`;
      }
    } else {
      startTime = `${String(colomboNow.hour).padStart(2, '0')}:${String(colomboNow.minute).padStart(2, '0')}`;
    }

    // Public website bookings require customer name & phone if not admin/walk_in
    if (!req.user && req.body.source !== 'admin' && req.body.source !== 'walk_in' && (!customerName || !customerPhone)) {
      return res.status(400).json({ success: false, message: 'Customer name and phone number are required' });
    }

    // Public website bookings cannot book slots that have already passed in Colombo time
    if (!req.user && req.body.source !== 'admin' && req.body.source !== 'walk_in') {
      const isPastDate = date < colomboNow.dateStr;
      const [sH, sM] = startTime.split(':').map(Number);
      const startMins = sH * 60 + sM;
      const isPastTime = date === colomboNow.dateStr && startMins < colomboNow.minutes;

      if (isPastDate || isPastTime) {
        return res.status(400).json({
          success: false,
          message: 'The selected time has already passed. Please choose an upcoming time slot.',
        });
      }
    }

    // Default to first active facility if neither facilityId nor categoryId is provided
    if (!facilityId && !categoryId) {
      const defaultFac = await Facility.findOne({ active: true, bookingEnabled: true, archived: false }).sort({ displayOrder: 1 });
      if (defaultFac) facilityId = defaultFac._id.toString();
    }

    // --- CATEGORY-BASED AUTO-ASSIGN ---
    // If no facilityId provided but categoryId is given, find the first available unit
    if (!facilityId && categoryId) {
      const facilitiesInCategory = await Facility.find({
        category: categoryId,
        active: true,
        bookingEnabled: true,
        archived: false,
      }).sort({ displayOrder: 1, name: 1 });

      if (facilitiesInCategory.length === 0) {
        return res.status(400).json({ success: false, message: 'No active facilities found in this category' });
      }

      // Calculate end time for conflict check
      const [startH, startM] = startTime.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = startMinutes + Number(durationMinutes);
      const endH = Math.floor(endMinutes / 60);
      const endM = endMinutes % 60;
      const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

      // Try each unit in order — assign to first one with no conflict
      for (const unit of facilitiesInCategory) {
        const hasConflict = await bookingService.checkConflict({
          facilityId: unit._id.toString(),
          date,
          startTime,
          endTime,
        });
        if (!hasConflict) {
          facilityId = unit._id.toString();
          break;
        }
      }

      if (!facilityId) {
        return res.status(409).json({
          success: false,
          message: 'All units in this category are booked for the selected time. Please choose another time slot.',
        });
      }
    }

    if (!facilityId) {
      return res.status(400).json({ success: false, message: 'Either facilityId or categoryId is required' });
    }

    const booking = await bookingService.createBooking({
      facilityId,
      date,
      startTime,
      durationMinutes: Number(durationMinutes),
      personCount: Number(personCount),
      customerName,
      customerPhone,
      customerEmail,
      notes,
      discount: discount ? Number(discount) : 0,
      bookingSource: req.user ? 'admin' : (req.body.bookingSource || req.body.source || 'website'),
      createdById: req.user?._id?.toString(),
      status: customStatus,
    });

    await createAuditLog({
      user: req.user,
      action: 'CREATE',
      entity: 'Booking',
      entityId: booking?._id?.toString(),
      description: `Booking ${booking?.bookingNumber} created for ${customerName}`,
      ip: req.ip,
    });

    res.status(201).json({ success: true, data: booking });
  } catch (err: any) {
    const statusCode = err.message?.startsWith('BOOKING_CONFLICT') ? 409 : 400;
    res.status(statusCode).json({
      success: false,
      message: err.message?.replace('BOOKING_CONFLICT: ', '') || 'Failed to create booking',
    });
  }
});

// Admin: get latest booking for notification polling
router.get('/latest', authenticate, async (req, res) => {
  try {
    const booking = await Booking.findOne({ archived: false })
      .sort({ createdAt: -1 })
      .limit(1)
      .populate('facility', 'name')
      .populate('customer', 'name phone');

    if (!booking) return res.json({ success: true, data: null });

    const cust = booking.customer as any;
    const fac = booking.facility as any;
    const custName = cust?.name && !cust.name.startsWith('walkin-') ? cust.name : (cust?.phone || 'Walk-in Guest');

    res.json({
      success: true,
      data: {
        _id: booking._id,
        bookingNumber: booking.bookingNumber,
        customerName: custName,
        facilityName: fac?.name || 'Station',
        date: booking.date,
        startTime: booking.startTime,
        createdAt: (booking as any).createdAt,
      },
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Admin: get calendar events (FullCalendar format)
router.get('/calendar', authenticate, async (req, res) => {
  try {
    const { start, end, facilityId } = req.query as any;
    const query: any = { archived: false };
    if (facilityId) query.facility = facilityId;
    if (start && end) {
      // start and end are ISO datetime strings from FullCalendar
      const startDate = start.slice(0, 10);
      const endDate = end.slice(0, 10);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const bookings = await Booking.find(query)
      .populate('customer', 'name phone email')
      .populate('facility', 'name color hourlyRate');

    const STATUS_COLORS: Record<string, string> = {
      pending: '#d4a017',
      confirmed: '#3d85c8',
      completed: '#2d7a4f',
      cancelled: '#5a5a5a',
      no_show: '#8b2020',
    };

    const events = bookings.map(b => {
      const fac = b.facility as any;
      const cust = b.customer as any;
      const color = STATUS_COLORS[b.status] || fac?.color || '#c0c0c0';
      const custName = cust?.name && !cust.name.startsWith('walkin-') ? cust.name : 'Walk-in Guest';
      const timeLabel = `${b.startTime} - ${b.endTime}`;
      return {
        id: b._id,
        resourceId: fac?._id || b.facility,
        title: `${timeLabel} • ${custName} (${b.bookingNumber})`,
        start: `${b.date}T${b.startTime}:00`,
        end: `${b.date}T${b.endTime}:00`,
        backgroundColor: color,
        borderColor: color,
        textColor: '#ffffff',
        extendedProps: {
          booking: b,
          customer: cust,
          facility: fac,
          status: b.status,
          bookingNumber: b.bookingNumber,
          checkedIn: b.checkedIn,
          timeLabel,
          startTime: b.startTime,
          endTime: b.endTime,
          customerName: custName,
        },
      };
    });

    res.json({ success: true, data: events });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: list bookings with filters + pagination
router.get('/', authenticate, async (req, res) => {
  try {
    const {
      page = '1', limit = '20', status, facilityId, facility,
      dateFrom, dateTo, source, search, date,
    } = req.query as any;

    const query: any = { archived: false };
    if (status) {
      query.status = status === 'no-show' ? 'no_show' : status;
    }
    const targetFacility = facilityId || facility;
    if (targetFacility) query.facility = targetFacility;
    if (source) query.bookingSource = source;
    if (date) query.date = date;
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = dateFrom;
      if (dateTo) query.date.$lte = dateTo;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let bookingQuery = Booking.find(query)
      .populate('customer', 'name phone email')
      .populate('facility', 'name color')
      .populate('createdBy', 'name')
      .sort({ date: -1, startTime: -1 })
      .skip(skip)
      .limit(limitNum);

    const [bookings, total] = await Promise.all([
      bookingQuery.exec(),
      Booking.countDocuments(query),
    ]);

    // Search filter (post-query for name/phone/bookingNumber)
    let filtered = bookings;
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = bookings.filter(b => {
        const cust = b.customer as any;
        return (
          b.bookingNumber.toLowerCase().includes(searchLower) ||
          cust?.name?.toLowerCase().includes(searchLower) ||
          cust?.phone?.includes(search)
        );
      });
    }

    res.json({
      success: true,
      data: filtered,
      pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get single booking
router.get('/:id', authenticate, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customer', 'name phone email totalBookings noShowCount')
      .populate('facility', 'name color hourlyRate category')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, data: booking });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update booking
router.put('/:id', authenticate, authorize('superadmin', 'manager'), async (req: any, res) => {
  try {
    const allowedFields = ['notes', 'bookingSource', 'paymentStatus', 'paymentMethod'];
    const updates: any = {};
    allowedFields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    updates.updatedBy = req.user._id;

    const booking = await Booking.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('customer facility');

    await createAuditLog({
      user: req.user,
      action: 'UPDATE',
      entity: 'Booking',
      entityId: req.params.id,
      description: `Booking updated`,
      ip: req.ip,
    });

    res.json({ success: true, data: booking });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Change status
router.patch('/:id/status', authenticate, async (req: any, res) => {
  try {
    let { status, note } = req.body;
    if (status === 'no-show') status = 'no_show';
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const update: any = {
      status,
      updatedBy: req.user._id,
      $push: {
        auditTrail: { action: `status_changed_to_${status}`, by: req.user._id, at: new Date(), note }
      },
    };

    if (status === 'cancelled') update.cancelledAt = new Date();

    const booking = await Booking.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('customer facility');

    // Update customer no-show count
    if (status === 'no_show' && booking) {
      const Customer = require('../models/Customer').default;
      await Customer.findByIdAndUpdate(booking.customer, { $inc: { noShowCount: 1 } });
    }

    await createAuditLog({
      user: req.user,
      action: 'STATUS_CHANGE',
      entity: 'Booking',
      entityId: req.params.id,
      description: `Booking status changed to ${status}`,
      ip: req.ip,
    });

    res.json({ success: true, data: booking });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Check in
router.patch('/:id/checkin', authenticate, async (req: any, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        checkedIn: true,
        checkedInAt: new Date(),
        updatedBy: req.user._id,
        $push: { auditTrail: { action: 'checked_in', by: req.user._id, at: new Date() } },
      },
      { new: true }
    ).populate('customer facility');

    await createAuditLog({
      user: req.user, action: 'CHECKIN', entity: 'Booking',
      entityId: req.params.id, description: 'Customer checked in', ip: req.ip,
    });

    res.json({ success: true, data: booking });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Soft delete
router.delete('/:id', authenticate, authorize('superadmin'), async (req: any, res) => {
  try {
    await Booking.findByIdAndUpdate(req.params.id, { archived: true });
    await createAuditLog({
      user: req.user, action: 'DELETE', entity: 'Booking',
      entityId: req.params.id, description: 'Booking archived', ip: req.ip,
    });
    res.json({ success: true, message: 'Booking archived' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Excel export
router.get('/export/excel', authenticate, async (req, res) => {
  try {
    const { dateFrom, dateTo, status, facilityId } = req.query as any;
    const query: any = { archived: false };
    if (status) query.status = status;
    if (facilityId) query.facility = facilityId;
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = dateFrom;
      if (dateTo) query.date.$lte = dateTo;
    }

    const bookings = await Booking.find(query)
      .populate('customer', 'name phone email')
      .populate('facility', 'name')
      .sort({ date: -1 })
      .limit(10000);

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Bookings');
    const headerStyle = {
      font: { bold: true, color: { argb: 'FF000000' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC0C0C0' } },
    };

    sheet.columns = [
      { header: 'Booking #', key: 'bookingNumber', width: 15 },
      { header: 'Customer', key: 'customer', width: 20 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Facility', key: 'facility', width: 20 },
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Start', key: 'startTime', width: 8 },
      { header: 'End', key: 'endTime', width: 8 },
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
        customer: cust?.name || '', phone: cust?.phone || '',
        facility: fac?.name || '', date: b.date,
        startTime: b.startTime, endTime: b.endTime,
        duration: b.durationMinutes, rate: b.rateSnapshot,
        total: b.total, status: b.status,
        paymentStatus: b.paymentStatus, source: b.bookingSource,
        checkedIn: b.checkedIn ? 'Yes' : 'No',
        createdAt: (b as any).createdAt ? format(new Date((b as any).createdAt), 'yyyy-MM-dd HH:mm') : '',
      });
    });

    const totalRow = sheet.addRow({ customer: 'TOTAL', total: bookings.reduce((s, b) => s + b.total, 0) });
    totalRow.font = { bold: true };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="bookings.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
