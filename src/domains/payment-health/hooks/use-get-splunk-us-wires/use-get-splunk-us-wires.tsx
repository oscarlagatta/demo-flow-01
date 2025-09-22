"use client"

import { useQuery } from "@tanstack/react-query"
import { getApiV2SplunkDataGetUsWireHealthOptions } from "../../mocks/mock-data-services"
import type { SplunkDataItem } from "../../types/splunk-data-item"

interface UseGetSplunkUsWiresOptions {
  enabled?: boolean
}

export function useGetSplunkUsWires(options: UseGetSplunkUsWiresOptions) {
  const { enabled = true } = options

  const query = useQuery({
    ...getApiV2SplunkDataGetUsWireHealthOptions(),
    enabled: enabled,
  })

  return {
    data: query.data as SplunkDataItem[] | undefined,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
    isSuccess: query.isSuccess,
  }
}
