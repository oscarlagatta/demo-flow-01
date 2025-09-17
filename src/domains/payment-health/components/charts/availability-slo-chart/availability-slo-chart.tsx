"use client"
import { useState } from "react"
import { Info } from "lucide-react"
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
} from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AvailabilitySLOChartProps {
  title: string
  description: string
  data: Array<{ time: string; availabilityPct: number }>
  timeRanges: string[]
  sloPct: number
  source: string
}

export default function AvailabilitySLOChart({
  title,
  description,
  data,
  timeRanges,
  sloPct,
  source,
}: AvailabilitySLOChartProps) {
  const [timeRange, setTimeRange] = useState(timeRanges[0])

  const chartConfig = {
    availabilityPct: {
      label: "Availability",
      color: "hsl(220, 70%, 50%)",
    },
    perfectAvailability: {
      label: "Perfect Availability",
      color: "hsl(0, 0%, 60%)",
    },
    slo: {
      label: "SLO",
      color: "hsl(25, 95%, 53%)",
    },
  }

  // Set Y-domain to be near the top
  const yDomain = [sloPct - 0.02, 100]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium">{`Time: ${label}`}</p>
          <p className="text-sm text-blue-600">{`Availability: ${payload[0].value.toFixed(5)}%`}</p>
        </div>
      )
    }
    return null
  }

  const CustomLegend = () => (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex items-center gap-2">
        <div className="w-4 h-0.5 bg-blue-600"></div>
        <span>Availability</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-0.5 border-t-2 border-dashed border-gray-600"></div>
        <span>Perfect Availability</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-0.5 border-t-2 border-dashed border-orange-500"></div>
        <span>SLO</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-3 bg-gray-200 opacity-50"></div>
        <span>Error Budget</span>
      </div>
    </div>
  )

  return (
    <Card
      className="flex h-full flex-col"
      role="img"
      aria-label="Availability vs SLO chart showing system availability over time"
    >
      <CardHeader className="flex-row items-center justify-between pb-2">
        <div className="grid gap-1.5">
          <CardTitle>{title}</CardTitle>
          <div className="flex items-center gap-2">
            <Info className="text-muted-foreground h-4 w-4" />
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            {timeRanges.map((range) => (
              <SelectItem key={range} value={range}>
                {range}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex flex-1 relative">
        <div className="flex-1 relative">
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{
                  left: 20,
                  right: 80,
                  top: 5,
                  bottom: 40,
                }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e0e0e0" />

                {/* Error Budget shaded area */}
                <ReferenceArea y1={sloPct} y2={100} fill="hsl(0, 0%, 85%)" fillOpacity={0.3} stroke="none" />

                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value.slice(0, 5)}
                  label={{
                    value: "Time",
                    position: "insideBottom",
                    offset: -15,
                  }}
                />
                <YAxis
                  domain={yDomain}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => `${value.toFixed(2)}%`}
                  label={{
                    value: "Availability",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />

                {/* Reference lines */}
                <ReferenceLine y={100} stroke="hsl(0, 0%, 60%)" strokeDasharray="5 5" strokeWidth={2} />
                <ReferenceLine y={sloPct} stroke="hsl(25, 95%, 53%)" strokeDasharray="5 5" strokeWidth={2} />

                <ChartTooltip content={<CustomTooltip />} />

                {/* Main availability line */}
                <Line
                  dataKey="availabilityPct"
                  type="monotone"
                  stroke="hsl(220, 70%, 50%)"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* Right-side legend */}
          <div className="absolute top-4 right-4">
            <CustomLegend />
          </div>

          {/* Error Budget label */}
          <div className="absolute top-1/3 right-4 text-sm text-gray-600 font-medium">Error Budget</div>
        </div>

        {/* Bottom-left footnote */}
        <div className="absolute bottom-2 left-2 text-xs text-gray-500">Source: {source}</div>
      </CardContent>
    </Card>
  )
}
