"use client"

import { useQuery } from "@tanstack/react-query"
import type { BackendFlowData } from "../../types/backend-flow-data"
import { getApiV2BackendFlowDataOptions } from "../../mocks/mock-data-services"

interface UseGetBackendFlowDataOptions {
  enabled?: boolean
}

export function useGetBackendFlowData(options: UseGetBackendFlowDataOptions = {}) {
  const { enabled = true } = options

  const query = useQuery({
    ...getApiV2BackendFlowDataOptions(),
    enabled: enabled,
  })

  return {
    data: query.data as BackendFlowData | undefined,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
    isSuccess: query.isSuccess,
  }
}
