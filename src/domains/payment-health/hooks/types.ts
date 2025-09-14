export interface KPIStats {
  recentIssues: { value: number; change: string }
  pendingIssues: { value: number; change: string }
  runningServices: { value: number; change: string }
  interruptions: { value: number; change: string }
}

export interface ServiceStatus {
  id: string
  service: string
  statuses: Record<string, "✅" | "❌">
  currentHourlyAverage: string
  averagePerDay: string
}

export interface ChartPoint {
  x: string
  y: number
}

export interface ServiceCharts {
  averageTransactionDuration: ChartPoint[]
  currentHourlyAverage: ChartPoint[]
}
