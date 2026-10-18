export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'manager' | 'staff';
  active: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface Customer {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  totalBookings: number;
  totalSpent: number;
  lastVisit?: string;
  favoriteFacility?: string;
  noShowCount: number;
  notes?: string;
  loyaltyPoints: number;
  membershipTier: 'standard' | 'silver' | 'gold' | 'platinum';
  firstBooking?: string;
  active: boolean;
  createdAt: string;
}

export interface FacilityCategory {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  displayOrder: number;
  active: boolean;
}

export interface Facility {
  _id: string;
  name: string;
  category: FacilityCategory | string | any;
  description?: string;
  images: string[];
  hourlyRate: number;
  halfHourRate?: number;
  pricingTiers?: Array<{
    persons: number;
    hourlyRate: number;
    halfHourRate?: number;
  }>;
  minPersons?: number;
  maxPersons?: number;
  color: string;
  calendarColor?: string;
  active: boolean;
  bookingEnabled: boolean;
  minDurationMinutes: number;
  maxDurationMinutes: number;
  bufferTimeMinutes: number;
  displayOrder: number;
  rules: string[];
  features: string[];
  archived: boolean;
  createdAt: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
export type PaymentStatus = 'unpaid' | 'paid' | 'partial' | 'refunded';
export type BookingSource = 'website' | 'phone' | 'walk_in' | 'admin' | 'other';

export interface Booking {
  _id: string;
  bookingNumber: string;
  customer: Customer | string | any;
  facility: Facility | string | any;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  duration?: number;
  personCount?: number;
  rateSnapshot: number;
  subtotal: number;
  discount: number;
  total: number;
  totalAmount?: number;
  name?: string;
  phone?: string;
  email?: string;
  source?: string;
  status: BookingStatus | string;
  paymentStatus: PaymentStatus | string;
  paymentMethod?: string;
  bookingSource: BookingSource | string;
  notes?: string;
  checkedIn: boolean;
  checkedInAt?: string;
  createdBy?: User | string;
  auditTrail: Array<{ action: string; at: string; note?: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilitySlot {
  time: string;
  available: boolean;
}

export interface Game {
  _id: string;
  id?: string;
  title: string;
  name?: string;
  platform?: string;
  facilityCategory?: FacilityCategory | string;
  category?: string;
  description?: string;
  coverImage?: string;
  imageUrl?: string;
  image?: string;
  active: boolean;
  featured: boolean;
  displayOrder: number;
  createdAt?: string;
}

export interface Offer {
  _id: string;
  id?: string;
  title: string;
  description?: string;
  image?: string;
  code?: string;
  discountType: 'percentage' | 'fixed' | 'custom' | string;
  discountValue: number;
  applicableFacilities?: (Facility | string)[];
  startDate?: string | null;
  endDate?: string | null;
  expiryDate?: string | null;
  active: boolean;
  featured?: boolean;
  displayOrder?: number;
  terms?: string;
  createdAt?: string;
}

export interface News {
  _id: string;
  id?: string;
  title: string;
  slug: string;
  category?: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  imageUrl?: string;
  image?: string;
  author?: string;
  publishDate?: string;
  publishedAt?: string;
  status?: 'draft' | 'published' | string;
  published?: boolean;
  featured?: boolean;
  tags?: string[];
  createdAt?: string;
}

export interface Partner {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  initialInvestment: number;
  additionalInvestments: Array<{ amount: number; date: string; note?: string }>;
  totalInvestment: number;
  ownershipPercentage: number;
  percentageType: 'calculated' | 'manual';
  active: boolean;
  notes?: string;
  joinDate: string;
}

export interface ExpenseCategory {
  _id: string;
  name: string;
  icon?: string;
  active: boolean;
}

export interface Expense {
  _id: string;
  title: string;
  category: ExpenseCategory | string;
  amount: number;
  date: string;
  vendor?: string;
  description?: string;
  receipt?: string;
  recurring: boolean;
  paymentMethod?: string;
  createdAt: string;
}

export interface Revenue {
  _id: string;
  title: string;
  source: 'booking' | 'food' | 'drinks' | 'event' | 'merchandise' | 'other';
  amount: number;
  date: string;
  notes?: string;
  createdBy?: User | string;
  createdAt: string;
}

export interface BusinessSettings {
  businessName: string;
  logo?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  socialLinks: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    whatsapp?: string;
    youtube?: string;
  };
  businessHours: Record<string, { open: string; close: string; closed: boolean }>;
  bookingSettings: {
    minDurationMinutes: number;
    maxDurationMinutes: number;
    intervalMinutes: number;
    advanceBookingDays: number;
    cancellationHours: number;
    bufferTimeMinutes: number;
  };
  financialSettings: {
    currency: string;
    currencySymbol: string;
    currencyPosition: 'before' | 'after';
    taxRate: number;
    defaultPaymentStatus: string;
    profitCalculationMethod: string;
  };
  websiteSettings: {
    heroTitle: string;
    heroSubtitle: string;
    metaTitle?: string;
    metaDescription?: string;
    googleMapsEmbed?: string;
  };
}

export interface DashboardStats {
  todayBookings: number;
  todayRevenue: number;
  upcomingBookings: number;
  completedToday: number;
  completedBookings?: number;
  noShowsToday: number;
  noShows?: number;
  activeFacilities: number;
  pendingBookings: number;
  monthRevenue: number;
  monthlyRevenue?: number;
  monthExpenses: number;
  netProfit: number;
  occupancyRate: number;
  revenueChart?: Array<{ date: string; revenue: number }>;
}

export interface AuditLog {
  _id: string;
  user?: User;
  userName?: string;
  action: string;
  entity: string;
  entityId?: string;
  description: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  createdAt: string;
}

export interface Gallery {
  _id: string;
  url: string;
  filename: string;
  title?: string;
  category?: string;
  featured: boolean;
  displayOrder: number;
  createdAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
