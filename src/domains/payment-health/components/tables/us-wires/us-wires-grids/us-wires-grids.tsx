"use client"

import { useMemo } from "react"
import { Loader2 } from "lucide-react"

import { AgGridReact } from "@ag-grid-community/react"
import "@ag-grid-community/styles/ag-grid.css"
import "@ag-grid-community/styles/ag-theme-quartz.css"

import usWiresData from "../../../../assets/flow-data-us-wires/us-wires-data.json"

import { useGetSplunkUsWires } from "../../../../hooks/use-get-splunk-us-wires/use-get-splunk-us-wires"

import { directionFormatter, formatNumber, formatPercent } from "../../../../utils/formatters"

const UsWiresGrids = () => {
  const { data: splunkData, isLoading, isError } = useGetSplunkUsWires()

  // Group nodes by class
  const groupedNodes = useMemo(() => {
    const nodes = usWiresData.nodes || []
    return nodes.reduce(
      (acc, node) => {
        const group = node.class || "unknown"
        if (!acc[group]) acc[group] = []
        acc[group].push(node.id)
        return acc
      },
      {} as Record<string, string[]>,
    )
  }, [])

  // Filter data for each class
  const groupedData = useMemo(() => {
    if (!splunkData) return {}
    return Object.entries(groupedNodes).reduce(
      (acc, [className, ids]) => {
        acc[className] = splunkData.filter((item) => ids.includes(item.aiT_NUM))
        return acc
      },
      {} as Record<string, any[]>,
    )
  }, [splunkData, groupedNodes])

  // Define column definitions (reuse from splunk-table-us-wires)
  const columnDefs = useMemo(
    () => [
      { headerName: "AIT Number", field: "aiT_NUM", minWidth: 120 },
      { headerName: "AIT Name", field: "aiT_NAME", minWidth: 160 },
      { headerName: "Flow Direction", field: "_normDirection", minWidth: 150 },

      {
        headerName: "Is Traffic Flowing",
        field: "iS_TRAFFIC_FLOWING",
        minWidth: 150,
        cellClassRules: {
          "bg-[rgb(0,146,35)] text-white font-semibold": (params: any) => params.value === "Yes", // Custom green background with white text for "Yes"
          "bg-[rgb(230,22,34)] text-white font-semibold": (params: any) => params.value === "No", // Custom red background with white text for "No"
        },
        cellStyle: {
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        },
      },

      {
        headerName: "Is Traffic On Trend",
        field: "_balanced",
        minWidth: 150,
        cellClassRules: {
          "bg-[rgb(0,146,35)] text-white font-semibold": (params: any) => /on-trend/i.test(params.value), // Custom green background with white text for "On-Trend"
          "bg-[rgb(230,22,34)] text-white font-semibold": (params: any) => /off-trend/i.test(params.value), // Custom red background with white text for "Off-Trend"
          "bg-[rgb(234,118,0)] text-white font-semibold": (params: any) => /approaching-trend/i.test(params.value), // Custom amber background with white text for "Approaching-Trend"
        } as Record<string, (params: any) => boolean>,
      },
      {
        headerName: "Current Transaction Count",
        field: "currenT_TRANSACTION_COUNT",
        minWidth: 200,
        valueFormatter: (p: { value: any }) => formatNumber(p.value),
      },

      {
        headerName: "Average Transaction Count",
        field: "averagE_TRANSACTION_COUNT",
        minWidth: 200,
        valueFormatter: (p: { value: any }) => formatNumber(p.value),
      },

      {
        headerName: "Average Transaction Delta",
        field: "_deltaPct",
        minWidth: 190,
        valueFormatter: (p: { value: any }) => formatPercent(p.value),
      },

      {
        headerName: "Analytics Context",
        field: "_analytics",
        minWidth: 220,
      },
    ],
    [],
  )

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">Loading data, please wait...</p>
      </div>
    )
  }

  if (isError) {
    return <p>Error loading data.</p>
  }

  // Render grids for each class
  return (
    <div className="space-y-6">
      {Object.entries(groupedData).map(([className, data]: [string, any[]]) => {
        return (
          <div key={className}>
            <h3 className="mb-2 text-lg font-semibold">
              {className
                .toLowerCase()
                .split(" ")
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")}
            </h3>

            <div className="ag-theme-quartz w-full shadow-md">
              <AgGridReact
                rowData={data.map((r: any) => ({
                  ...r,
                  _deltaPct:
                    Number.isFinite(r.averagE_TRANSACTION_COUNT) && r.averagE_TRANSACTION_COUNT !== 0
                      ? ((r.currenT_TRANSACTION_COUNT - r.averagE_TRANSACTION_COUNT) / r.averagE_TRANSACTION_COUNT) *
                        100
                      : 0,
                  _balanced: /on-trend/i.test(r.iS_TRAFFIC_ON_TREND || "")
                    ? "On-Trend"
                    : /approaching-trend/i.test(r.iS_TRAFFIC_ON_TREND || "")
                      ? "Approaching-Trend"
                      : "Off-Trend",
                  _analytics: /on-trend/i.test(r.iS_TRAFFIC_ON_TREND || "")
                    ? ""
                    : "Current Volume is Statistically Low",
                  _normDirection: directionFormatter(r.floW_DIRECTION),
                }))}
                columnDefs={columnDefs}
                defaultColDef={{
                  sortable: true,
                  filter: true,
                  resizable: true,
                  flex: 1,
                  minWidth: 120,
                }}
                domLayout="autoHeight"
                pagination={true}
                paginationPageSize={10}
                paginationPageSizeSelector={[10, 20, 50]}
                animateRows={true}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default UsWiresGrids
