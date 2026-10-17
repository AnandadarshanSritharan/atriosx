import { useSettings } from './useSettings';

export const useCurrency = () => {
  const { data: settings } = useSettings();
  return {
    format: (amount: number) => {
      const sym = settings?.financialSettings?.currencySymbol || 'Rs.';
      const pos = settings?.financialSettings?.currencyPosition || 'before';
      const formatted = amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
      return pos === 'before' ? `${sym} ${formatted}` : `${formatted} ${sym}`;
    },
    symbol: settings?.financialSettings?.currencySymbol || 'Rs.',
  };
};
