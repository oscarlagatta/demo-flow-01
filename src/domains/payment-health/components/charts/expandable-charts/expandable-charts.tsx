"use client"
import { Skeleton } from "@/components/ui/skeleton"
import { useServiceCharts } from "@/domains/payment-health/hooks/hooks"
import ChartBlock from "@/domains/payment-health/components/charts/chart-block/chart-block"
import UsWiresGrids from "@/domains/payment-health/components/tables/us-wires/us-wires-grids/us-wires-grids"
import AvailabilitySLOChart from "@/domains/payment-health/components/charts/availability-slo-chart/availability-slo-chart"

export default function ExpandableCharts(props: any) {
  const serviceId = props.data.id
  const { data: chartData, isLoading } = useServiceCharts(serviceId)

  if (isLoading) {
    return (
      <div className="grid h-full gap-4 bg-gray-50 p-4 md:grid-cols-2">
        <Skeleton className="h-full w-full" />
        <Skeleton className="h-full w-full" />
      </div>
    )
  }

  const mockAvailabilityData = [
    { time: "00:00", availabilityPct: 99.975 },
    { time: "04:00", availabilityPct: 99.972 },
    { time: "08:00", availabilityPct: 99.978 },
    { time: "12:00", availabilityPct: 99.981 },
    { time: "16:00", availabilityPct: 99.976 },
    { time: "20:00", availabilityPct: 99.973 },
    { time: "24:00", availabilityPct: 99.977 },
  ]

  return (
    <div className="w-full">
      <div className="grid gap-4 bg-gray-50 p-4 md:grid-cols-2">
        <AvailabilitySLOChart
          title="Availability vs SLO"
          description="System availability compared to Service Level Objective over time"
          data={mockAvailabilityData}
          timeRanges={["Last 7 Days", "Last 14 Days", "Last 30 Days"]}
          sloPct={99.97}
          source="System Monitoring Dashboard"
        />
        <ChartBlock
          title="Current Hourly Average Today"
          description="The Current Hourly Average to complete a transaction today is 3 seconds"
          data={chartData?.currentHourlyAverage || []}
          timeRanges={["Today", "Yesterday"]}
          yAxisLabel="Time in seconds"
          xAxisLabel="Time of the day"
        />
      </div>
      {serviceId === "service-1" && (
        <div className="bg-gray-100 p-4" style={{ overflowX: "visible" }}>
          <UsWiresGrids />
        </div>
      )}
    </div>
  )
}
