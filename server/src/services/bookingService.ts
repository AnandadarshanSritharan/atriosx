import Booking, { BookingStatus } from '../models/Booking';
import Facility from '../models/Facility';
import Customer from '../models/Customer';
import BusinessSettings from '../models/BusinessSettings';
import Holiday from '../models/Holiday';
import { format, parse, isAfter, isBefore, addMinutes } from 'date-fns';

interface AvailabilityParams {
  facilityId: string;
  date: string; // YYYY-MM-DD
}

interface BookingConflictParams {
  facilityId: string;
  date: string;
  startTime: string;
  endTime: string;
  excludeBookingId?: string;
}

interface CreateBookingParams {
  facilityId: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  personCount?: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  notes?: string;
  bookingSource?: string;
  createdById?: string;
  discount?: number;
  status?: string;
}

export const bookingService = {
  // Check for conflicts — CRITICAL function
  async checkConflict(params: BookingConflictParams): Promise<boolean> {
    const { facilityId, date, startTime, endTime, excludeBookingId } = params;
    
    const query: any = {
      facility: facilityId,
      date: date,
      status: { $in: ['pending', 'confirmed'] },
      $or: [
        // New booking overlaps with existing
        {
          $and: [
            { startTime: { $lt: endTime } },
            { endTime: { $gt: startTime } },
          ]
        }
      ]
    };
    
    if (excludeBookingId) {
      query._id = { $ne: excludeBookingId };
    }
    
    const conflict = await Booking.findOne(query);
    return !!conflict;
  },

  // Get available slots for a facility on a date
  async getAvailableSlots(params: AvailabilityParams) {
    const { facilityId, date } = params;
    
    const settings = await BusinessSettings.findOne();
    const facility = await Facility.findById(facilityId);
    
    if (!facility || !facility.active || !facility.bookingEnabled) {
      return { available: false, slots: [], reason: 'Facility not available' };
    }
    
    // Check holiday
    const holiday = await Holiday.findOne({ date });
    if (holiday?.type === 'closed') {
      return { available: false, slots: [], reason: `Closed: ${holiday.name}` };
    }
    
    // Get business hours
    const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const dateObj = new Date(date + 'T00:00:00');
    const dayName = dayNames[dateObj.getDay()];
    const hours = (settings?.businessHours as any)?.[dayName] || (settings?.workingHours as any)?.[dayName];
    
    if (hours?.closed) {
      return { available: false, slots: [], reason: 'Closed on this day' };
    }
    
    if (!hours) {
      // Check facility-specific availability as fallback
      const facilityDay = facility.availability?.find(a => a.day === dateObj.getDay());
      if (!facilityDay?.available) {
        return { available: false, slots: [], reason: 'Closed on this day' };
      }
    }
    
    // Special holiday hours override
    const openTime = holiday?.type === 'special' ? holiday.specialHours?.open : hours?.open;
    const closeTime = holiday?.type === 'special' ? holiday.specialHours?.close : hours?.close;
    
    if (!openTime || !closeTime) {
      return { available: false, slots: [], reason: 'Hours not configured' };
    }
    
    // Generate all time slots
    const interval = settings?.bookingSettings?.intervalMinutes || 30;
    const minDuration = Math.max(facility.minDurationMinutes, settings?.bookingSettings?.minDurationMinutes || 30);
    
    const slots = [];
    const [openH, openM] = openTime.split(':').map(Number);
    const [closeH, closeM] = closeTime.split(':').map(Number);
    
    let currentMinutes = openH * 60 + openM;
    let closeMinutes = closeH * 60 + closeM;
    if (closeMinutes <= currentMinutes || (closeH === 0 && closeM === 0)) {
      closeMinutes += 24 * 60;
    }

    // Check if checking for today so past slots aren't offered
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    const isToday = date === todayStr;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    
    // Get all existing bookings for this facility on this date
    const existingBookings = await Booking.find({
      facility: facilityId,
      date: date,
      status: { $in: ['pending', 'confirmed'] },
    }).select('startTime endTime');
    
    while (currentMinutes + minDuration <= closeMinutes) {
      const slotH = Math.floor(currentMinutes / 60);
      const startH = slotH >= 24 ? slotH % 24 : slotH;
      const startM = currentMinutes % 60;
      const slotStart = `${String(startH).padStart(2,'0')}:${String(startM).padStart(2,'0')}`;
      
      // Check if this start time conflicts with any booking
      const endMinutesForCheck = currentMinutes + minDuration;
      const endSlotH = Math.floor(endMinutesForCheck / 60);
      const endH = endSlotH;
      const endM = endMinutesForCheck % 60;
      const slotEnd = `${String(endH).padStart(2,'0')}:${String(endM).padStart(2,'0')}`;
      
      const isConflict = existingBookings.some(b => 
        b.startTime < slotEnd && b.endTime > slotStart
      );

      const isPast = isToday && (currentMinutes < nowMinutes);
      
      slots.push({ time: slotStart, available: !isConflict && !isPast });
      currentMinutes += interval;
    }
    
    return {
      available: true,
      slots,
      openTime,
      closeTime,
      minDuration,
      maxDuration: Math.min(facility.maxDurationMinutes, settings?.bookingSettings?.maxDurationMinutes || 240),
      interval,
    };
  },

  // Generate booking number
  async generateBookingNumber(): Promise<string> {
    const count = await Booking.countDocuments();
    return `ATR-${String(count + 1).padStart(6, '0')}`;
  },

  // Calculate price for a booking based on duration and number of persons
  calculatePrice(facility: any, durationMinutes: number, personCount: number = 1): { subtotal: number; rateSnapshot: number } {
    const hours = durationMinutes / 60;
    
    // Check if facility has person pricing tiers
    if (facility.pricingTiers && facility.pricingTiers.length > 0) {
      // Find tier matching personCount, or closest available tier
      const exactTier = facility.pricingTiers.find((t: any) => t.persons === personCount);
      const tier = exactTier || facility.pricingTiers.slice().sort((a: any, b: any) => Math.abs(a.persons - personCount) - Math.abs(b.persons - personCount))[0];

      if (tier) {
        let subtotal = Math.round(tier.hourlyRate * hours);
        if (durationMinutes === 30 && tier.halfHourRate) {
          subtotal = tier.halfHourRate;
        }
        return { subtotal, rateSnapshot: tier.hourlyRate };
      }
    }

    let subtotal = Math.round(facility.hourlyRate * hours);
    if (durationMinutes === 30 && facility.halfHourRate) {
      subtotal = facility.halfHourRate;
    }
    return { subtotal, rateSnapshot: facility.hourlyRate };
  },

  // Create a booking with conflict prevention
  async createBooking(params: CreateBookingParams) {
    const facility = await Facility.findById(params.facilityId);
    if (!facility || !facility.active) throw new Error('Facility not available');
    
    // Normalize startTime format to strictly HH:mm (supporting formats like "8.27", "8:27", "08:27")
    const cleanTime = String(params.startTime || '09:00').trim().replace(/[.\s,-]/g, ':');
    const parts = cleanTime.split(':');
    const rawH = parts.length > 0 ? parseInt(parts[0], 10) : 9;
    const rawM = parts.length > 1 ? parseInt(parts[1], 10) : 0;
    const startH = isNaN(rawH) ? 9 : Math.min(23, Math.max(0, rawH));
    const startM = isNaN(rawM) ? 0 : Math.min(59, Math.max(0, rawM));
    const normalizedStartTime = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;

    // Calculate end time
    const startMinutes = startH * 60 + startM;
    const endMinutes = startMinutes + Number(params.durationMinutes || 60);
    const endH = Math.floor(endMinutes / 60);
    const endM = endMinutes % 60;
    const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    
    // CRITICAL: Check for conflicts right before creating
    const hasConflict = await this.checkConflict({
      facilityId: params.facilityId,
      date: params.date,
      startTime: normalizedStartTime,
      endTime,
    });
    
    if (hasConflict) {
      throw new Error(`BOOKING_CONFLICT: Station is already booked from ${normalizedStartTime} to ${endTime}. Please choose another time.`);
    }
    
    // Find or create customer (optional name and phone support for quick bookings)
    const nameToUse = params.customerName?.trim() || 'Walk-in Guest';
    let customer;

    if (params.customerPhone && params.customerPhone.trim() && !params.customerPhone.startsWith('walkin-')) {
      const cleanPhone = params.customerPhone.trim();
      customer = await Customer.findOne({ phone: cleanPhone });
      if (!customer) {
        customer = await Customer.create({
          name: nameToUse,
          phone: cleanPhone,
          email: params.customerEmail,
          firstBooking: new Date(),
        });
      } else {
        if (params.customerName && params.customerName !== 'Walk-in Guest') {
          customer.name = nameToUse;
        }
        if (params.customerEmail) customer.email = params.customerEmail;
        await customer.save();
      }
    } else {
      // Walk-in or quick booking without unique phone
      const walkinPhone = `walkin-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      customer = await Customer.create({
        name: nameToUse,
        phone: walkinPhone,
        firstBooking: new Date(),
      });
    }
    
    // Calculate price using rate at time of booking (snapshot) based on persons
    const personCount = Math.max(1, Number(params.personCount || 1));
    const durationMins = Number(params.durationMinutes || 60);
    const { subtotal, rateSnapshot } = this.calculatePrice(facility, durationMins, personCount);
    const discount = params.discount || 0;
    const total = Math.max(0, subtotal - discount);
    
    // Generate booking number
    const bookingNumber = await this.generateBookingNumber();
    
    // Determine booking status
    const initialStatus = params.status || (params.createdById ? 'confirmed' : 'pending');

    // Create booking
    const booking = await Booking.create({
      bookingNumber,
      customer: customer._id,
      facility: params.facilityId,
      date: params.date,
      startTime: normalizedStartTime,
      endTime,
      durationMinutes: durationMins,
      personCount,
      rateSnapshot, // STORED AT BOOKING TIME — never changes
      subtotal,
      discount,
      total,
      status: initialStatus as any,
      paymentStatus: 'unpaid',
      bookingSource: (params.bookingSource || (params.createdById ? 'admin' : 'website')) as any,
      notes: params.notes,
      createdBy: params.createdById,
      auditTrail: [{ action: 'created', at: new Date() }],
    });
    
    // Update customer stats
    customer.totalBookings += 1;
    customer.lastVisit = new Date();
    if (!customer.firstBooking) customer.firstBooking = new Date();
    await customer.save();
    
    return Booking.findById((booking as any)._id).populate('customer facility');
  },
};
