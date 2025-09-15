import { useQuery } from "@tanstack/react-query"

const mockGetUmidByAit = async (aitID: number) => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  // Generate mock UMID and description
  const umid = Math.floor(Math.random() * 900000) + 100000 // 6-digit number
  const descriptions = [
    "Payment processing delay detected in wire transfer system",
    "Transaction routing anomaly identified in payment flow",
    "Network latency spike affecting payment processing",
    "Database connection timeout during transaction validation",
    "Authentication service intermittent failures",
    "Load balancer configuration causing payment delays",
    "Message queue backlog in payment processing pipeline",
    "Third-party service integration timeout",
    "Cache invalidation causing performance degradation",
    "Memory leak detected in payment processing service",
  ]

  const randomDescription = descriptions[Math.floor(Math.random() * descriptions.length)]

  return {
    umid,
    description: randomDescription,
    aitID,
    timestamp: new Date().toISOString(),
  }
}

interface UseGetSplunkUmidByAitIdUsWiresOptions {
  aitID: number
  enabled?: boolean
}

export function useGetSplunkUmidbByAitIdUsWires(options: UseGetSplunkUmidByAitIdUsWiresOptions) {
  const { enabled, aitID } = options

  const splunkData = useQuery({
    queryKey: ["splunk-umid-by-ait", aitID],
    queryFn: () => mockGetUmidByAit(aitID),
    enabled: enabled && !!aitID,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  })

  return {
    data: splunkData.data,
    isLoading: splunkData.isLoading,
    isError: splunkData.isError,
    refetch: splunkData.refetch,
    isFetching: splunkData.isFetching,
    isSuccess: splunkData.isSuccess,
  }
}
