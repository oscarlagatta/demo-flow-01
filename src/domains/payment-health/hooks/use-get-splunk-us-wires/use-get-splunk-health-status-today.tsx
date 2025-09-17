import { useQuery } from "@tanstack/react-query"
import rawData from "./us-health-today-data.json"
import { transformHealthDataToChartPoints, getHealthDataStats } from "../../utils/transform-health-data"
import type { ChartPoint } from "../../types/chart-point"

type HealthStatusTodayRaw = {
  aitNumber: string
  aitName: string
  healthstatusDateTime: string
  averageThruputTime: string
  averageThruputTime30: string
}

export interface HealthStatusToday {
  aitNumber: string
  aitName: string
  healthstatusDateTime: Date
  averageThruputTime: string
  averageThruputTime30: string
}

export function useHealthStatusTodayDate() {
  const query = useQuery({
    queryKey: ["us-wires-health-status-today"],
    queryFn: async (): Promise<HealthStatusToday[]> => {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const rows = (rawData as HealthStatusTodayRaw[]).map((item) => ({
        ...item,
        healthstatusDateTime: new Date(item.healthstatusDateTime),
      }))
      return rows
    },
    staleTime: Number.POSITIVE_INFINITY,
  })

  const chartData: ChartPoint[] = query.data ? transformHealthDataToChartPoints(query.data) : []
  const chartData30Min: ChartPoint[] = query.data ? transformHealthDataToChartPoints(query.data, true) : []
  const stats = query.data ? getHealthDataStats(query.data) : null

  return {
    data: query.data ?? [],
    chartData,
    chartData30Min,
    stats,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    isFetching: query.isFetching,
    isSuccess: query.isSuccess,
  }
}
