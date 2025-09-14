"use client"
import { useMemo, useState } from "react"
import { AlertTriangle, ChevronDown, ChevronRight } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

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

const StatusCellRenderer = ({ status }: { status: "✅" | "❌" | undefined }) => {
  if (!status) return null
  return (
    <div className="flex h-full items-center justify-center">
      <StatusIcon status={status} />
    </div>
  )
}

const AverageWithWarningRenderer = ({ value }: { value: string }) => {
  if (!value) return null
  return (
    <div className="flex h-full items-center justify-center gap-2">
      <AlertTriangle className="h-4 w-4 text-amber-500" />
      <span>{value}</span>
    </div>
  )
}

const ServiceTable = () => {
  const { data: rowData, isLoading } = useServices()
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const dateColumns = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const day = date.toLocaleDateString("en-US", { day: "numeric" })
      const month = date.toLocaleDateString("en-US", { month: "short" })
      const key = `${day} ${month}`
      return {
        key,
        label: i === 0 ? "Today" : key,
      }
    })
  }, [])

  const toggleRow = (serviceId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(serviceId)) {
      newExpanded.delete(serviceId)
    } else {
      newExpanded.add(serviceId)
    }
    setExpandedRows(newExpanded)
  }

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
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Service</TableHead>
            {dateColumns.map((col) => (
              <TableHead key={col.key} className="text-center">
                {col.label}
              </TableHead>
            ))}
            <TableHead className="text-center">Current Hourly Average</TableHead>
            <TableHead className="text-center">Average per day</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rowData?.map((service: ServiceStatus) => (
            <>
              <TableRow key={service.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => toggleRow(service.id)} className="p-1">
                      {expandedRows.has(service.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    {service.service}
                  </div>
                </TableCell>
                {dateColumns.map((col) => (
                  <TableCell key={col.key} className="text-center">
                    <StatusCellRenderer status={service.statuses[col.key]} />
                  </TableCell>
                ))}
                <TableCell className="text-center">
                  <AverageWithWarningRenderer value={service.currentHourlyAverage} />
                </TableCell>
                <TableCell className="text-center">
                  <AverageWithWarningRenderer value={service.averagePerDay} />
                </TableCell>
              </TableRow>
              {expandedRows.has(service.id) && (
                <TableRow>
                  <TableCell colSpan={dateColumns.length + 3} className="p-0">
                    <div className="h-96 w-full">
                      <ExpandableCharts />
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default ServiceTable
