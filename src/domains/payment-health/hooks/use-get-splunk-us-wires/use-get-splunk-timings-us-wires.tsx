import { useQuery } from "@tanstack/react-query"
import { getApiV2SplunkDataGetUsWireHealthAppTimingsOptions } from "@bofa/data-serces"
import { processTimingData, type TimingDataEntry } from "../../utils/timing-data-processor"

export interface SectionProcessingTime {
  sectionId: string
  sectionName: string
  averageTime: number // in seconds
  trend: "up" | "down" | "stable"
  lastUpdated: Date
  maxTime?: number
  entryCount?: number
  aitNumbers?: string[]
  aitTimingData?: Array<{
    aitNumber: string
    aitName: string
    averageThruputTime30: number
  }>
}

interface UseGetSplunkTimingsUsWiresReturn {
  data: SectionProcessingTime[] | null
  isLoading: boolean
  isError: boolean
  isFetching: boolean
  isSuccess: boolean
  refetch: () => Promise<void>
}

export function useGetSplunkTimingsUsWires(): UseGetSplunkTimingsUsWiresReturn {
  const splunkData = useQuery(getApiV2SplunkDataGetUsWireHealthAppTimingsOptions())

  const query = useQuery({
    queryKey: ["splunk-timings-us-wires-processed"],
    queryFn: async (): Promise<SectionProcessingTime[]> => {
      if (!splunkData.data) {
        throw new Error("No timing data available")
      }

      console.log("[v0] Processing timing data from API:", splunkData.data.length, "entries")

      const processedSections = processTimingData(splunkData.data as TimingDataEntry[])
      console.log("[v0] Processed sections:", processedSections)

      const enhancedData: SectionProcessingTime[] = processedSections.map((section) => ({
        sectionId: section.sectionId,
        sectionName: section.sectionName,
        averageTime: section.averageThruputTime30,
        maxTime: section.maxThruputTime30,
        entryCount: section.entryCount,
        aitNumbers: section.aitNumbers,
        aitTimingData: section.aitTimingData,
        trend: "stable" as const,
        lastUpdated: new Date(),
      }))

      return enhancedData
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
