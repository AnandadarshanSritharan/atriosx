import { useCurrency } from '@/hooks/useCurrency';

export function CurrencyDisplay({ amount, className }: { amount: number; className?: string }) {
  const { format } = useCurrency();
  return <span className={className}>{format(amount)}</span>;
}
