"use client"

import { useQuery } from "@tanstack/react-query"
import type { BackendFlowData } from "../../types/backend-flow-data"
import backendData from "../../assets/flow-data-us-wires/us-wires-data.json"

interface UseGetBackendFlowDataOptions {
  enabled?: boolean
}

export function useGetBackendFlowData(options: UseGetBackendFlowDataOptions = {}) {
  const { enabled = true } = options

  const query = useQuery({
    queryKey: ["backend-flow-data"],
    queryFn: async (): Promise<BackendFlowData> => {
      await new Promise((resolve) => setTimeout(resolve, 100))
      return backendData as BackendFlowData
    },
    enabled: enabled,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 25000, // Consider data stale after 25 seconds
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
    isSuccess: query.isSuccess,
  }
}
