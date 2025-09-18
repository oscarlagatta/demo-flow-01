"use client"

import { useState, useEffect } from "react"
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
}

interface UseGetAverageProcessingTimesOptions {
  enabled?: boolean
  refetchInterval?: number
  externalTimingData?: TimingDataEntry[]
}

interface UseGetAverageProcessingTimesReturn {
  data: SectionProcessingTime[] | null
  isLoading: boolean
  isError: boolean
  isFetching: boolean
  isSuccess: boolean
  refetch: () => Promise<void>
}

const mockProcessingTimes: SectionProcessingTime[] = [
  {
    sectionId: "bg-origination",
    sectionName: "Origination",
    averageTime: 1.2,
    trend: "stable",
    lastUpdated: new Date(),
  },
  {
    sectionId: "bg-validation",
    sectionName: "Payment Validation and Routing",
    averageTime: 2.8,
    trend: "down",
    lastUpdated: new Date(),
  },
  {
    sectionId: "bg-middleware",
    sectionName: "Middleware",
    averageTime: 1.9,
    trend: "up",
    lastUpdated: new Date(),
  },
  {
    sectionId: "bg-processing",
    sectionName: "Payment Processing, Sanctions & Investigation",
    averageTime: 3.4,
    trend: "stable",
    lastUpdated: new Date(),
  },
]

export function useGetAverageProcessingTimes(
  options: UseGetAverageProcessingTimesOptions = {},
): UseGetAverageProcessingTimesReturn {
  const { enabled = true, refetchInterval = 30000, externalTimingData } = options

  const [data, setData] = useState<SectionProcessingTime[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [isFetching, setIsFetching] = useState(false)

  const fetchProcessingTimes = async (): Promise<void> => {
    if (!enabled) return

    setIsFetching(true)
    setIsError(false)

    try {
      if (externalTimingData && externalTimingData.length > 0) {
        console.log("[v0] Processing external timing data:", externalTimingData.length, "entries")

        const processedSections = processTimingData(externalTimingData)
        console.log("[v0] Processed sections:", processedSections)

        const enhancedData: SectionProcessingTime[] = processedSections.map((section) => ({
          sectionId: section.sectionId,
          sectionName: section.sectionName,
          averageTime: section.averageThruputTime30,
          maxTime: section.maxThruputTime30,
          entryCount: section.entryCount,
          aitNumbers: section.aitNumbers,
          trend: "stable" as const,
          lastUpdated: new Date(),
        }))

        setData(enhancedData)
        setIsError(false)
      } else {
        await new Promise((resolve) => setTimeout(resolve, 800))

        const simulatedData = mockProcessingTimes.map((section) => ({
          ...section,
          averageTime: section.averageTime + (Math.random() - 0.5) * 0.4,
          trend: Math.random() > 0.7 ? ((Math.random() > 0.5 ? "up" : "down") as "up" | "down") : ("stable" as const),
          lastUpdated: new Date(),
        }))

        setData(simulatedData)
        setIsError(false)
      }
    } catch (error) {
      console.error("Failed to fetch average processing times:", error)
      setIsError(true)
      setData(null)
    } finally {
      setIsFetching(false)
      setIsLoading(false)
    }
  }

  const refetch = async (): Promise<void> => {
    await fetchProcessingTimes()
  }

  useEffect(() => {
    if (enabled) {
      setIsLoading(true)
      fetchProcessingTimes()
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled || !refetchInterval) return

    const interval = setInterval(() => {
      fetchProcessingTimes()
    }, refetchInterval)

    return () => clearInterval(interval)
  }, [enabled, refetchInterval])

  return {
    data,
    isLoading,
    isError,
    isFetching,
    isSuccess: !isLoading && !isError && data !== null,
    refetch,
  }
}
