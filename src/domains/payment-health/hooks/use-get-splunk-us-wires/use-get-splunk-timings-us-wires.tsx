import { useQuery } from "@tanstack/react-query"
import { processTimingData, type TimingDataEntry } from "../../utils/timing-data-processor"
import usWiresTimings from "../../assets/flow-data-us-wires/us-wires-timings.json"

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
  const query = useQuery({
    queryKey: ["splunk-timings-us-wires"],
    queryFn: async (): Promise<SectionProcessingTime[]> => {
      console.log("[v0] Processing timing data from us-wires-timings.json:", usWiresTimings.length, "entries")

      const processedSections = processTimingData(usWiresTimings as TimingDataEntry[])
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
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  return {
    data: query.data || null,
    isLoading: query.isLoading,
    isError: query.isError,
    isFetching: query.isFetching,
    isSuccess: query.isSuccess,
    refetch: async () => {
      await query.refetch()
    },
  }
}
