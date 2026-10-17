import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '../api/settings';

export const useSettings = () => useQuery({ 
  queryKey: ['settings'], 
  queryFn: () => settingsApi.get().then(r => r.data.data), 
  staleTime: 60000 
});
