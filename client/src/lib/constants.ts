export const STATUS_COLORS = {
  pending: '#d4a017',
  confirmed: '#3d85c8',
  completed: '#2d7a4f',
  cancelled: '#5a5a5a',
  no_show: '#8b2020',
} as const;

export const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Ongoing',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
} as const;

export const SOURCE_LABELS = {
  website: 'Website',
  phone: 'Phone',
  walk_in: 'Walk-in',
  admin: 'Admin',
  other: 'Other',
} as const;

export const PAYMENT_STATUS_LABELS = {
  unpaid: 'Unpaid',
  paid: 'Paid',
  partial: 'Partial',
  refunded: 'Refunded',
} as const;

export const DURATION_OPTIONS = [30, 60, 90, 120, 150, 180, 240] as const;
