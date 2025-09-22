import { useQuery } from "@tanstack/react-query"
import { getApiV2SplunkDataGetUsWireHealthAppTimingsOptions } from "../../mocks/mock-data-services"
import type { TimingDataEntry } from "../../utils/timing-data-processor"

export interface Ait999TimeSummary {
  totalEntries: number
  averageThruputTime30: number
  minThruputTime30: number
  maxThruputTime30: number
  totalThruputTime30: number
  lastUpdated: Date
  entries: Array<{
    aitNumber: string
    aitName: string
    averageThruputTime30: number
  }>
}

interface UseGetAit999TimeSummaryReturn {
  data: Ait999TimeSummary | null
  isLoading: boolean
  isError: boolean
  isFetching: boolean
  isSuccess: boolean
  refetch: () => Promise<void>
}

export function useGetAit999TimeSummary(): UseGetAit999TimeSummaryReturn {
  const splunkData = useQuery(getApiV2SplunkDataGetUsWireHealthAppTimingsOptions())

  const query = useQuery({
    queryKey: ["ait-999-time-summary"],
    queryFn: async (): Promise<Ait999TimeSummary> => {
      if (!splunkData.data) {
        throw new Error("No timing data available")
      }

      console.log("[v0] Processing AIT 999 time summary from API:", splunkData.data.length, "entries")

      const ait999Entries = (splunkData.data as TimingDataEntry[]).filter((entry) => entry.aitNumber === "999")

      console.log("[v0] Found AIT 999 entries:", ait999Entries.length)

      if (ait999Entries.length === 0) {
        return {
          totalEntries: 0,
          averageThruputTime30: 0,
          minThruputTime30: 0,
          maxThruputTime30: 0,
          totalThruputTime30: 0,
          lastUpdated: new Date(),
          entries: [],
        }
      }

      const thruputTimes = ait999Entries.map((entry) => entry.averageThruputTime30)
      const totalThruputTime30 = thruputTimes.reduce((sum, time) => sum + time, 0)
      const averageThruputTime30 = totalThruputTime30 / ait999Entries.length
      const minThruputTime30 = Math.min(...thruputTimes)
      const maxThruputTime30 = Math.max(...thruputTimes)

      const summary: Ait999TimeSummary = {
        totalEntries: ait999Entries.length,
        averageThruputTime30,
        minThruputTime30,
        maxThruputTime30,
        totalThruputTime30,
        lastUpdated: new Date(),
        entries: ait999Entries.map((entry) => ({
          aitNumber: entry.aitNumber,
          aitName: entry.aitName,
          averageThruputTime30: entry.averageThruputTime30,
        })),
      }

      console.log("[v0] AIT 999 time summary:", summary)
      return summary
    },
    enabled: !!splunkData.data && splunkData.isSuccess,
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  return {
    data: query.data || null,
    isLoading: splunkData.isLoading || query.isLoading,
    isError: splunkData.isError || query.isError,
    isFetching: splunkData.isFetching || query.isFetching,
    isSuccess: query.isSuccess,
    refetch: async () => {
      await splunkData.refetch()
      await query.refetch()
    },
  }
}
