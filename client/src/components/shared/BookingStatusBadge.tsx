import { STATUS_COLORS, STATUS_LABELS } from '@/lib/constants';
import type { BookingStatus } from '@/types';

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const color = STATUS_COLORS[status] || '#5a5a5a';
  const label = STATUS_LABELS[status] || status;
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
