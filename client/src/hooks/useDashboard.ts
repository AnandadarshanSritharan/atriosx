import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../api/reports';

export const useDashboard = (period?: string, dateFrom?: string, dateTo?: string) => useQuery({ 
  queryKey: ['dashboard', period, dateFrom, dateTo], 
  queryFn: () => reportsApi.dashboard({ period, dateFrom, dateTo }).then(r => r.data.data), 
  refetchInterval: 60000 
});
