"use client"

import { useState, useEffect } from "react"

export interface SectionProcessingTime {
  sectionId: string
  sectionName: string
  averageTime: number // in seconds
  trend: "up" | "down" | "stable"
  lastUpdated: Date
}

interface UseGetAverageProcessingTimesOptions {
  enabled?: boolean
  refetchInterval?: number
}

interface UseGetAverageProcessingTimesReturn {
  data: SectionProcessingTime[] | null
  isLoading: boolean
  isError: boolean
  isFetching: boolean
  isSuccess: boolean
  refetch: () => Promise<void>
}

// Mock data for development - will be replaced with actual API call
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
  const { enabled = true, refetchInterval = 30000 } = options // Default 30 second refresh

  const [data, setData] = useState<SectionProcessingTime[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [isFetching, setIsFetching] = useState(false)

  const fetchProcessingTimes = async (): Promise<void> => {
    if (!enabled) return

    setIsFetching(true)
    setIsError(false)

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 800))

      // TODO: Replace with actual API call when backend is ready
      // const response = await fetch('/api/v2/processing-times/average');
      // if (!response.ok) throw new Error('Failed to fetch processing times');
      // const apiData = await response.json();

      // For now, add some random variation to simulate real data
      const simulatedData = mockProcessingTimes.map((section) => ({
        ...section,
        averageTime: section.averageTime + (Math.random() - 0.5) * 0.4, // ±0.2s variation
        trend: Math.random() > 0.7 ? ((Math.random() > 0.5 ? "up" : "down") as "up" | "down") : ("stable" as const),
        lastUpdated: new Date(),
      }))

      setData(simulatedData)
      setIsError(false)
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

  // Set up automatic refetch interval
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
