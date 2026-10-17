import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps { title: string; value: string | number; icon?: LucideIcon; change?: number; subtitle?: string; className?: string; loading?: boolean; }

export function StatCard({ title, value, icon: Icon, change, subtitle, className, loading }: StatCardProps) {
  if (loading) return <div className="card-premium p-6 skeleton h-32" />;
  return (
    <div className={cn("card-premium p-6 hover:border-silver/30 transition-colors", className)}>
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm text-muted font-medium uppercase tracking-wider">{title}</p>
        {Icon && <div className="p-2 rounded-lg bg-surface-2 border border-border"><Icon className="w-4 h-4 text-silver" /></div>}
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
        {(change !== undefined || subtitle) && (
          <div className="flex items-center gap-2">
            {change !== undefined && (
              <span className={cn("flex items-center text-xs font-medium", change >= 0 ? "text-green-400" : "text-red-400")}>
                {change >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {Math.abs(change)}%
              </span>
            )}
            {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
