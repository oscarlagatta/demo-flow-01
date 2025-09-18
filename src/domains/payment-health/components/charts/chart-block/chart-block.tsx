"use client"
import { useState } from "react"
import { Info, Loader2 } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis, ReferenceLine } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import type { ChartPoint } from "@/domains/payment-health/types/chart-point"

interface ChartBlockProps {
  title: string
  description: string
  data: ChartPoint[]
  timeRanges: string[]
  yAxisLabel: string
  xAxisLabel: string
  isLoading?: boolean
  isError?: boolean
  thresholdValue?: number
  thresholdLabel?: string
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid gap-2">
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">Time</span>
            <span className="font-bold text-muted-foreground">{label}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">Throughput Time</span>
            <span className="font-bold" style={{ color: payload[0].color }}>
              {typeof value === "number" ? value.toFixed(2) : value} seconds
            </span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

export default function ChartBlock({
  title,
  description,
  data,
  timeRanges,
  yAxisLabel,
  xAxisLabel,
  isLoading = false,
  isError = false,
  thresholdValue,
  thresholdLabel,
}: ChartBlockProps) {
  const [timeRange, setTimeRange] = useState(timeRanges[0])

  const chartConfig = {
    duration: {
      label: "Throughput Time (sec)",
      color: "hsl(var(--chart-1))",
    },
    threshold: {
      label: thresholdLabel || "Threshold",
      color: "hsl(var(--destructive))",
    },
  }

  const filteredData = data.filter((point) => {
    const value = typeof point.y === "number" ? point.y : Number.parseFloat(String(point.y))
    return value >= 0 && value < 1000 && !isNaN(value) && isFinite(value)
  })

  const yValues = filteredData.map((point) =>
    typeof point.y === "number" ? point.y : Number.parseFloat(String(point.y)),
  )
  const maxY = Math.max(...yValues)
  const minY = Math.min(...yValues)
  const yAxisDomain = [Math.max(0, minY - (maxY - minY) * 0.1), maxY + (maxY - minY) * 0.1]

  return (
    <Card className="flex h-full flex-col">
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
      <CardContent className="flex flex-1">
        {isLoading ? (
          <div className="flex h-[250px] w-full items-center justify-center">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading health metrics...</span>
            </div>
          </div>
        ) : isError ? (
          <div className="flex h-[250px] w-full items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p>Failed to load health data</p>
              <p className="text-sm">Please try refreshing the page</p>
            </div>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <LineChart
              accessibilityLayer
              data={filteredData}
              margin={{
                left: 12,
                right: 12,
                top: 5,
                bottom: 20,
              }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="x"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(0, 5)}
                label={{
                  value: xAxisLabel,
                  position: "insideBottom",
                  offset: -15,
                  style: { textAnchor: "middle" },
                }}
              />
              <YAxis
                domain={yAxisDomain}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                label={{
                  value: yAxisLabel,
                  angle: -90,
                  position: "insideLeft",
                  style: { textAnchor: "middle" },
                }}
                tickFormatter={(value) => `${value.toFixed(1)}s`}
              />
              <ChartTooltip cursor={{ strokeDasharray: "3 3" }} content={<CustomTooltip />} />
              {thresholdValue && (
                <ReferenceLine
                  y={thresholdValue}
                  stroke="var(--color-threshold)"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{
                    value: thresholdLabel,
                    position: "top",
                    style: { fontSize: "12px", fontWeight: "bold" },
                  }}
                />
              )}
              <Line
                dataKey="y"
                type="monotone"
                stroke="var(--color-duration)"
                strokeWidth={3}
                dot={false}
                activeDot={{
                  r: 8,
                  stroke: "var(--color-duration)",
                  strokeWidth: 3,
                  fill: "var(--background)",
                  style: { filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" },
                }}
                connectNulls={false}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
      {data.length !== filteredData.length && (
        <div className="px-6 pb-4">
          <div className="rounded-md bg-muted/50 p-2">
            <p className="text-xs text-muted-foreground">
              📊 Note: {data.length - filteredData.length} extreme outlier value(s) filtered for optimal visualization
            </p>
          </div>
        </div>
      )}
    </Card>
  )
}
