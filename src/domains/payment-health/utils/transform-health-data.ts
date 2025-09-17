import type { HealthStatusToday } from "../hooks/use-get-splunk-us-wires/use-get-splunk-health-status-today"
import type { ChartPoint } from "../types/chart-point"

export function transformHealthDataToChartPoints(
  data: HealthStatusToday[],
  useThirtyMinuteAverage = false,
): ChartPoint[] {
  return data
    .map((item) => {
      const timeValue = item.healthstatusDateTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })

      const throughputValue = useThirtyMinuteAverage
        ? Number.parseFloat(item.averageThruputTime30)
        : Number.parseFloat(item.averageThruputTime)

      return {
        x: timeValue,
        y: throughputValue,
      }
    })
    .filter((point) => {
      return !isNaN(point.y) && isFinite(point.y) && point.y >= 0
    })
    .sort((a, b) => {
      return a.x.localeCompare(b.x)
    })
}

export function getHealthDataStats(data: HealthStatusToday[]) {
  const throughputTimes = data
    .map((item) => Number.parseFloat(item.averageThruputTime))
    .filter((value) => !isNaN(value) && isFinite(value) && value >= 0)

  if (throughputTimes.length === 0) {
    return {
      min: 0,
      max: 0,
      average: 0,
      outlierCount: 0,
    }
  }

  const min = Math.min(...throughputTimes)
  const max = Math.max(...throughputTimes)
  const average = throughputTimes.reduce((sum, val) => sum + val, 0) / throughputTimes.length

  const outlierCount = throughputTimes.filter((value) => value > 1000).length

  return {
    min,
    max,
    average,
    outlierCount,
  }
}

export function filterOutliers(data: ChartPoint[], threshold = 1000): ChartPoint[] {
  return data.filter((point) => {
    const value = typeof point.y === "number" ? point.y : Number.parseFloat(point.y.toString())
    return value < threshold && value >= 0
  })
}
