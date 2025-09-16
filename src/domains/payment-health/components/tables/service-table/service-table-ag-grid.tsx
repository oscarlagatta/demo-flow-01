"use client"
import { useMemo, useState, useCallback } from "react"
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model"
import { ModuleRegistry } from "@ag-grid-community/core"
import type { ColDef, ICellRendererParams } from "@ag-grid-community/core"
import { AgGridReact } from "@ag-grid-community/react"
import "@ag-grid-community/styles/ag-grid.css"
import "@ag-grid-community/styles/ag-theme-quartz.css"
import { MasterDetailModule } from "@ag-grid-enterprise/master-detail"

import { AlertTriangle } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"

import { useServices } from "@/domains/payment-health/hooks/hooks"
import ExpandableCharts from "@/domains/payment-health/components/flow/nodes/expandable-charts/section-background-node"
import StatusIcon from "@/domains/payment-health/components/indicators/status-indicator/status-indicator"

interface ServiceStatus {
  id: string
  service: string
  statuses: Record<string, "✅" | "❌">
  currentHourlyAverage: string
  averagePerDay: string
}

// Register the required AG Grid modules
ModuleRegistry.registerModules([ClientSideRowModelModule, MasterDetailModule])

const StatusCellRenderer = (props: ICellRendererParams) => {
  if (!props.value) return null
  return (
    <div className="flex h-full items-center justify-center">
      <StatusIcon status={props.value} />
    </div>
  )
}

const AverageWithWarningRenderer = (props: ICellRendererParams) => {
  if (!props.value) return null
  return (
    <div className="flex h-full items-center justify-center gap-2">
      <AlertTriangle className="h-4 w-4 text-amber-500" />
      <span>{props.value}</span>
    </div>
  )
}

const ServiceTable = () => {
  const { data: rowData, isLoading } = useServices()
  const [rowHeights, setRowHeights] = useState<Record<string, number>>({})

  const handleHeightChange = useCallback((rowId: string, height: number) => {
    setRowHeights((prev) => ({
      ...prev,
      [rowId]: Math.max(height + 40, 400), // Add padding and minimum height
    }))
  }, [])

  const [colDefs] = useState<ColDef<ServiceStatus>[]>([
    {
      field: "service" as keyof ServiceStatus,
      headerName: "Service",
      pinned: "left",
      cellRenderer: "agGroupCellRenderer",
      minWidth: 200,
      flex: 2,
      headerClass: "centered-header",
    },
    ...Array.from({ length: 7 }).map((_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const day = date.toLocaleDateString("en-US", { day: "numeric" })
      const month = date.toLocaleDateString("en-US", { month: "short" })
      const key = `${day} ${month}`
      return {
        field: `statuses.${key}` as keyof ServiceStatus,
        headerName: i === 0 ? "Today" : key,
        cellRenderer: StatusCellRenderer,
        minWidth: 100,
        flex: 1,
        headerClass: "text-center",
        cellStyle: {
          textAlign: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
      }
    }),
    {
      field: "currentHourlyAverage",
      headerName: "Current Hourly Average",
      minWidth: 180,
      flex: 1.5,
      headerClass: "centered-header",
      cellRenderer: AverageWithWarningRenderer,
      cellStyle: {
        textAlign: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
    },
    {
      field: "averagePerDay" as keyof ServiceStatus,
      headerName: "Average per day",
      minWidth: 150,
      flex: 1.5,
      headerClass: "centered-header",
      cellRenderer: AverageWithWarningRenderer,
      cellStyle: {
        textAlign: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
    },
  ])

  const detailCellRenderer = useMemo(() => {
    return (params: any) => {
      const rowId = params.data.id
      return <ExpandableCharts {...params} onHeightChange={(height: number) => handleHeightChange(rowId, height)} />
    }
  }, [handleHeightChange])

  const getDetailRowHeight = useCallback(
    (params: any) => {
      const rowId = params.data.id
      const customHeight = rowHeights[rowId]

      // Return custom height if available, otherwise use default based on service type
      if (customHeight) {
        return customHeight
      }

      // Default heights based on service type
      if (rowId === "service-1") {
        return 1200 // US Wires service with grids needs more space
      }

      return 600 // Default height for other services
    },
    [rowHeights],
  )

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="ag-theme-quartz ag-grid-centered-headers w-full shadow-sm">
      <AgGridReact<ServiceStatus>
        rowData={rowData}
        columnDefs={colDefs}
        masterDetail={true}
        detailCellRenderer={detailCellRenderer}
        detailCellRenderParams={{
          getDetailRowData: (params: any) => {
            params.successCallback([params.data])
          },
        }}
        getDetailRowHeight={getDetailRowHeight}
        domLayout="autoHeight"
        suppressColumnVirtualisation={true}
        pagination={true}
        paginationPageSize={10}
        paginationPageSizeSelector={[10, 20, 50]}
        animateRows={true}
      />
    </div>
  )
}

export default ServiceTable
