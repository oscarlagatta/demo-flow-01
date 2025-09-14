"use client"
import { useEffect, useMemo } from "react"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { useGetSplunkUsWires } from "@/domains/payment-health/hooks/use-get-splunk-us-wires/use-get-splunk-us-wires"

type ActionType = "flow" | "trend" | "balanced"

interface SplunkAgGridProps {
  aitNum: string
  action: ActionType
  onBack: () => void
}

function formatNumber(value: string | number | null | undefined, decimals = 0) {
  if (value === null || value === undefined) return ""
  const num = typeof value === "string" ? Number.parseFloat(value) : value
  if (Number.isNaN(num)) return ""
  return num.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

function formatPercent(num: number, decimals = 2) {
  const sign = num > 0 ? "+" : ""
  return `${sign}${num.toFixed(decimals)}%`
}

function directionFormatter(direction: string) {
  if (!direction) return ""
  return direction
    .toLowerCase()
    .split("_")
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ")
}

function Pill({ ok, neutral }: { ok?: boolean; neutral?: boolean }) {
  const color = neutral ? "bg-gray-400" : ok ? "bg-green-600" : "bg-red-500"
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} aria-hidden="true" />
}

function TrafficCellRenderer({ value }: { value: "Yes" | "No" | null }) {
  if (value === "Yes") {
    return (
      <div className="flex items-center gap-2">
        <Pill ok />
        <span className="text-foreground text-xs">Yes</span>
      </div>
    )
  }
  if (value === "No") {
    return (
      <div className="flex items-center gap-2">
        <Pill />
        <span className="text-foreground text-xs">No</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2">
      <Pill neutral />
      <span className="text-muted-foreground text-xs">N/A</span>
    </div>
  )
}

function OnTrendCellRenderer({ value }: { value: string }) {
  const txt: string = String(value ?? "")
  const isOn = /on-trend/i.test(txt)
  const isOff = /off-trend/i.test(txt)
  if (isOn || isOff) {
    return (
      <div className="flex items-center gap-2">
        <Pill ok={isOn} />
        <span className={`text-xs ${isOn ? "text-foreground" : "text-foreground"}`}>{txt}</span>
      </div>
    )
  }
  return <span className="text-muted-foreground text-xs">{txt || "-"}</span>
}

function AnalyticsContextRenderer({ value }: { value: string }) {
  const txt: string = String(value ?? "")
  return <span className="text-xs text-red-600">{txt}</span>
}

export default function SplunkTableUsWires({ aitNum, action, onBack }: SplunkAgGridProps) {
  const isAuthorized: boolean = true

  const { data, isLoading, isError } = useGetSplunkUsWires({
    enabled: false,
  })

  const rows = useMemo(() => {
    if (!data) return []
    return data.filter((r) => r.aiT_NUM === aitNum)
  }, [data, aitNum])

  const rowData = useMemo(() => {
    return rows.map((r) => {
      const avg = Number.parseFloat(r.averagE_TRANSACTION_COUNT)
      const curr = Number.parseFloat(r.currenT_TRANSACTION_COUNT)
      const deltaPct = Number.isFinite(avg) && avg !== 0 ? ((curr - avg) / avg) * 100 : 0
      const isOn = /on-trend/i.test(r.iS_TRAFFIC_ON_TREND || "")
      let analytics = ""
      if (!isOn && deltaPct < -10) {
        analytics = "Current Volume is Statistically Low"
      }
      return {
        ...r,
        _deltaPct: deltaPct,
        _balanced: isOn,
        _onTrend: isOn ? `On-Trend (${formatPercent(Math.abs(deltaPct))})` : r.iS_TRAFFIC_ON_TREND || "",
        _analytics: analytics,
        _normDirection: directionFormatter(r.floW_DIRECTION),
      }
    })
  }, [rows])

  const actionHighlightCols = useMemo(() => {
    if (action === "flow") return new Set(["iS_TRAFFIC_FLOWING", "currenT_TRANSACTION_COUNT"])
    if (action === "trend") return new Set(["iS_TRAFFIC_ON_TREND", "_deltaPct"])
    return new Set<string>(["_balanced"])
  }, [action])

  // ESC to go back
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onBack()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onBack])

  return (
    <div className="flex h-full w-full flex-col">
      <Card className="rounded-none border-b">
        <CardHeader className="px-4 py-3">
          <div className="flex w-full items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={onBack} aria-label="Back to Flow Graph">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="w-full">
        {isLoading ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-6 w-60" />
            <Skeleton className="h-96 w-full" />
          </div>
        ) : isError ? (
          <div className="p-6">
            <p className="text-sm text-red-600">Failed to load data. Please try refreshing.</p>
          </div>
        ) : rowData.length === 0 ? (
          <div className="p-6">
            <p className="text-muted-foreground text-sm">No rows found for AIT {aitNum}.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>AIT Number</TableHead>
                <TableHead>AIT Name</TableHead>
                <TableHead>Flow Direction</TableHead>
                <TableHead>Flow AIT Number</TableHead>
                <TableHead>Flow AIT Name</TableHead>
                <TableHead className={actionHighlightCols.has("iS_TRAFFIC_FLOWING") ? "bg-blue-50" : ""}>
                  Is Traffic Flowing
                </TableHead>
                <TableHead className={actionHighlightCols.has("iS_TRAFFIC_ON_TREND") ? "bg-blue-50" : ""}>
                  Is Traffic On Trend
                </TableHead>
                <TableHead>Current Std Variation</TableHead>
                <TableHead>Historic Mean</TableHead>
                <TableHead>Historic Std Dev</TableHead>
                <TableHead className={actionHighlightCols.has("currenT_TRANSACTION_COUNT") ? "bg-blue-50" : ""}>
                  Current Transaction Count
                </TableHead>
                <TableHead>Average Transaction Count</TableHead>
                <TableHead className={actionHighlightCols.has("_deltaPct") ? "bg-blue-50" : ""}>
                  Average Transaction Delta
                </TableHead>
                <TableHead className={actionHighlightCols.has("_balanced") ? "bg-blue-50" : ""}>Balanced</TableHead>
                <TableHead>Analytics Context</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rowData.map((row, index) => (
                <TableRow key={index}>
                  <TableCell className="text-center">{row.aIT_NUM}</TableCell>
                  <TableCell>{row.aIT_NAME}</TableCell>
                  <TableCell>{row._normDirection}</TableCell>
                  <TableCell className="text-center">{row.floW_AIT_NUM}</TableCell>
                  <TableCell>{row.flowW_AIT_NAME}</TableCell>
                  <TableCell
                    className={`text-center ${actionHighlightCols.has("iS_TRAFFIC_FLOWING") ? "bg-blue-50" : ""}`}
                  >
                    <TrafficCellRenderer value={row.iS_TRAFFIC_FLOWING} />
                  </TableCell>
                  <TableCell
                    className={`text-center ${actionHighlightCols.has("iS_TRAFFIC_ON_TREND") ? "bg-blue-50" : ""}`}
                  >
                    <OnTrendCellRenderer value={row.iS_TRAFFIC_ON_TREND} />
                  </TableCell>
                  <TableCell className="text-center">{formatNumber(row.currentT_STD_VARIATION, 2)}</TableCell>
                  <TableCell className="text-center">{formatNumber(row.historiC_MEAN, 2)}</TableCell>
                  <TableCell className="text-center">{formatNumber(row.historiC_STD, 2)}</TableCell>
                  <TableCell
                    className={`text-center ${actionHighlightCols.has("currenT_TRANSACTION_COUNT") ? "bg-blue-50" : ""}`}
                  >
                    {formatNumber(row.currenT_TRANSACTION_COUNT)}
                  </TableCell>
                  <TableCell className="text-center">{formatNumber(row.averagE_TRANSACTION_COUNT, 2)}</TableCell>
                  <TableCell className={`text-center ${actionHighlightCols.has("_deltaPct") ? "bg-blue-50" : ""}`}>
                    {formatPercent(row._deltaPct)}
                  </TableCell>
                  <TableCell className={`text-center ${actionHighlightCols.has("_balanced") ? "bg-blue-50" : ""}`}>
                    {row._balanced ? "Yes" : "No"}
                  </TableCell>
                  <TableCell>
                    <AnalyticsContextRenderer value={row._analytics} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
