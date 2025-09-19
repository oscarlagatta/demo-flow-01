import { useQuery } from "@tanstack/react-query"
import { getApiV2SplunkDataGetUsWireHealthAppTimingsOptions } from "@bofa/data-serces"

export interface Ait999SummaryData {
  totalEntries: number
  averageProcessingTime: number
  minProcessingTime: number
  maxProcessingTime: number
  sectionsAffected: string[]
  entries: Array<{
    aitNumber: string
    aitName: string
    averageThruputTime30: number
    sectionName?: string
  }>
}

interface UseGetAit999SummaryReturn {
  data: Ait999SummaryData | null
  isLoading: boolean
  isError: boolean
  isFetching: boolean
  isSuccess: boolean
  refetch: () => Promise<void>
}

export function useGetAit999Summary(): UseGetAit999SummaryReturn {
  const query = useQuery({
    queryKey: ["ait-999-summary"],
    queryFn: async (): Promise<Ait999SummaryData> => {
      const response = await getApiV2SplunkDataGetUsWireHealthAppTimingsOptions().queryFn()

      if (!response || !Array.isArray(response)) {
        throw new Error("No data available from API")
      }

      const ait999Entries = response.filter((entry: any) => entry.aitNumber === "999" || entry.aitNum === "999")

      if (ait999Entries.length === 0) {
        return {
          totalEntries: 0,
          averageProcessingTime: 0,
          minProcessingTime: 0,
          maxProcessingTime: 0,
          sectionsAffected: [],
          entries: [],
        }
      }

      const processingTimes = ait999Entries.map((entry: any) => entry.averageThruputTime30 || 0)

      const totalTime = processingTimes.reduce((sum, time) => sum + time, 0)
      const averageTime = totalTime / processingTimes.length
      const minTime = Math.min(...processingTimes)
      const maxTime = Math.max(...processingTimes)

      const sectionsAffected = [
        ...new Set(ait999Entries.map((entry: any) => entry.sectionName || entry.section || "Unknown").filter(Boolean)),
      ]

      const formattedEntries = ait999Entries.map((entry: any) => ({
        aitNumber: entry.aitNumber || entry.aitNum || "999",
        aitName: entry.aitName || entry.name || "Unknown",
        averageThruputTime30: entry.averageThruputTime30 || 0,
        sectionName: entry.sectionName || entry.section || "Unknown",
      }))

      return {
        totalEntries: ait999Entries.length,
        averageProcessingTime: Math.round(averageTime * 100) / 100,
        minProcessingTime: Math.round(minTime * 100) / 100,
        maxProcessingTime: Math.round(maxTime * 100) / 100,
        sectionsAffected,
        entries: formattedEntries,
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 3,
    retryDelay: 1000,
  })

  return {
    data: query.data || null,
    isLoading: query.isLoading,
    isError: query.isError,
    isFetching: query.isFetching,
    isSuccess: query.isSuccess,
    refetch: query.refetch,
  }
}
