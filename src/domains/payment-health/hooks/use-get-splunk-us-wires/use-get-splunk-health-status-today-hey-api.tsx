import { useQuery } from "@tanstack/react-query"

import { getApiV2SplunkDataGetUsWireHealthTodayDaOption } from "../../mocks/mock-data-services"

interface HealthStatusToday {
  aitNumber: string
  aitName: string
  healthstatusDateTime: Date
  averageThruputTime: string
  averageThruputTime: string
  averageThruputTime30: string
}

export function useHealthStatusTodayDate() {
  const splunkData = useQuery(getApiV2SplunkDataGetUsWireHealthTodayDaOption())

  return {
    data: splunkData.data as HealthStatusToday[],
    isLoading: splunkData.isLoading,
    isError: splunkData.isError,
    refetch: splunkData.refetch,
    isFetching: splunkData.isFetching,
    isSuccess: splunkData.isSuccess,
  }
}
