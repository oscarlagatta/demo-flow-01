import { useQuery } from '@tanstack/react-query';

import { getApiV2SplunkDataGetUsWireHealthAppTimingsOptions } from '@bofa/data-serces';

export function useGetSplunkTimingsUsWires() {
  const splunkData = useQuery(
    getApiV2SplunkDataGetUsWireHealthAppTimingsOptions()
  );

  return {
    data: splunkData.data as any[],
    isLoading: splunkData.isLoading,
    isError: splunkData.isError,
    refetch: splunkData.refetch,
    isFetching: splunkData.isFetching,
    isSuccess: splunkData.isSuccess,
  };
}
