import { useQuery } from '@tanstack/react-query';
import rawData from './us-health-today-data.json';

type HealthStatusTodayRaw = {
  aitNumber: string;
  aitName: string;
  healthstatusDateTime: string;
  averageThruputTime: string;
  averageThruputTime30: string;
};

export interface HealthStatusToday {
  aitNumber: string;
  aitName: string;
  healthstatusDateTime: Date;
  averageThruputTime: string;
  averageThruputTime30: string;
}

export function useHealthStatusTodayDate() {
  const query = useQuery({
    queryKey: ['us-wires-health-status-today'],
    queryFn: async (): Promise<HealthStatusToday[]> => {
      const rows = (rawData as HealthStatusTodayRaw[]).map((item) => ({
        ...item,
        healthstatusDateTime: new Date(item.healthstatusDateTime),
      }));
      return rows;
    },
    staleTime: Infinity,
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    isFetching: query.isFetching,
    isSuccess: query.isSuccess,
  };
}
