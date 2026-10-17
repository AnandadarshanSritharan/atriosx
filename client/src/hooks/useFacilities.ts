import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { facilitiesApi } from '../api/facilities';

export const useFacilities = (includeInactive = false) =>
  useQuery({ 
    queryKey: ['facilities', includeInactive], 
    queryFn: () => facilitiesApi.list({ includeInactive }).then(r => r.data.data) 
  });

export const useFacilityCategories = () =>
  useQuery({ 
    queryKey: ['facility-categories'], 
    queryFn: () => facilitiesApi.categories.list().then(r => r.data.data) 
  });

export const useCreateFacility = () => {
  const qc = useQueryClient();
  return useMutation({ 
    mutationFn: facilitiesApi.create, 
    onSuccess: () => qc.invalidateQueries({ queryKey: ['facilities'] }) 
  });
};

export const useUpdateFacility = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => facilitiesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['facilities'] }),
  });
};

export const useDeleteFacility = () => {
  const qc = useQueryClient();
  return useMutation({ 
    mutationFn: facilitiesApi.delete, 
    onSuccess: () => qc.invalidateQueries({ queryKey: ['facilities'] }) 
  });
};
