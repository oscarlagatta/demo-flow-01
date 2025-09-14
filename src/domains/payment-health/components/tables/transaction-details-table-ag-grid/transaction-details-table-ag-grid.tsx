"use client"
import { useMemo, useState } from "react"
import { ArrowLeft, ChevronDown, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { useTransactionSearchUsWiresContext } from "@/domains/payment-health/providers/us-wires/us-wires-transaction-search-provider"
import type { SplunkTransactionDetail } from "@/domains/payment-health/types/splunk-transaction"

interface TransactionRow {
  id: string
  [key: string]: any
}

const formatSourceType = (sourceType: string) => {
  return sourceType
    .replace(/[-_]/g, " ") // replace dashes and underscores with spaces
    .replace(/([a-z])([A-Z])/g, " $1 $2")
    .replace(/\b\w/g, (l) => l.toUpperCase())
}

export function TransactionDetailsTableAgGrid() {
  const { results, selectedAitId, hideTable, id } = useTransactionSearchUsWiresContext()

  const { sourceTypeTables, allColumns } = useMemo(() => {
    if (!results || !selectedAitId) return { sourceTypeTables: [], allColumns: [] }

    const relevantResults = results.filter((detail: SplunkTransactionDetail) => {
      return detail.aitNumber === selectedAitId
    })

    const groupedBySourceType: Record<string, SplunkTransactionDetail[]> = relevantResults.reduce(
      (acc, detail) => {
        const sourceType: string = detail.sourceType || "Unknown Source Type"
        if (!acc[sourceType]) {
          acc[sourceType] = []
        }
        acc[sourceType].push(detail)
        return acc
      },
      {} as Record<string, typeof relevantResults>,
    )

    const allColumnsSet = new Set<string>()
    relevantResults.forEach((detail) => {
      if (detail._raw) {
        const rawData = detail._raw as Record<string, any>
        Object.keys(rawData).forEach((key) => {
          if (key.toLowerCase() !== "ait_name" && key.toLowerCase() !== "ait_number") {
            allColumnsSet.add(key)
          }
        })
      }
    })

    const allColumns = Array.from(allColumnsSet).sort()

    const sourceTypeTables = Object.entries(groupedBySourceType).map(([sourceType, details]) => {
      const rowData: TransactionRow[] = details.map((detail, index) => {
        const row: TransactionRow = {
          id: `${sourceType}-${index}`,
        }

        if (detail._raw) {
          const rawData = detail._raw as Record<string, any>
          Object.keys(rawData).forEach((column) => {
            const value = rawData[column]
            row[column] = value !== null && value !== undefined ? value : ""
          })
        }

        return row
      })

      return {
        sourceType,
        aitName: details[0].aitName || "Unknown AIT Name",
        aitNumber: details[0].aitNumber || "Unknown AIT Number",
        recordCount: details.length,
        rowData,
      }
    })

    return { sourceTypeTables, allColumns }
  }, [results, selectedAitId])

  // Initialize expanded tables with the first sourceType if available
  const [expandedTables, setExpandedTables] = useState<Set<string>>(() => {
    if (sourceTypeTables.length > 0) {
      return new Set([sourceTypeTables[0].sourceType])
    }
    return new Set()
  })

  const formatColumnName = (columnName: string) => {
    return columnName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const formatCellValue = (value: any, columnName: string) => {
    if (value === null || value === undefined || value === "" || value === "null") {
      return "-"
    }

    if (columnName.includes("DATE") || columnName.includes("TS")) {
      const timestamp = Date.parse(value)
      if (!isNaN(timestamp)) {
        const date = new Date(timestamp)
        return date.toLocaleDateString() + " " + date.toLocaleTimeString()
      }
      return value
    }

    if (columnName.includes("AMT") && !isNaN(Number(value))) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      }).format(Number(value))
    }

    return String(value)
  }

  const toggleTable = (sourceType: string) => {
    const newExpanded = new Set(expandedTables)
    if (newExpanded.has(sourceType)) {
      newExpanded.delete(sourceType)
    } else {
      newExpanded.add(sourceType)
    }
    setExpandedTables(newExpanded)
  }

  const expandAllTables = () => {
    setExpandedTables(new Set(sourceTypeTables.map((table) => table.sourceType)))
  }

  const collapseAllTables = () => {
    setExpandedTables(new Set())
  }

  if (!results || !selectedAitId || !sourceTypeTables.length) {
    return (
      <div className="w-full">
        <div className="rounded-lg border-b bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center space-x-4">
            <Button
              onClick={hideTable}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2 bg-transparent"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <div>
              <h1 className="text-grey-900 text-xl font-semibold">Transaction Details</h1>
              <p className="text-sm text-gray-600">No transaction data available</p>
            </div>
          </div>
        </div>
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-gray-500">No transaction data found</p>
            <p className="mt-2 text-sm text-gray-400">Please perform a search to view transaction details</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="mb-3 rounded-lg border-b bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center space-x-4">
          <Button
            onClick={hideTable}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2 bg-transparent"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div>
            <p className="text-sm text-gray-600">
              {selectedAitId} - Transaction ID: {id} - {sourceTypeTables.length} Source Type(s)
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={expandAllTables} variant="outline" size="sm" className="bg-transparent text-xs">
            <span>Expand All</span>
          </Button>
          <Button onClick={collapseAllTables} variant="outline" size="sm" className="bg-transparent text-xs">
            <span>Collapse All</span>
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {sourceTypeTables.map((table) => {
          const isExpanded = expandedTables.has(table.sourceType)
          return (
            <div key={table.sourceType} className="overflow-hidden rounded-lg border-gray-200 shadow-sm">
              <div
                className="cursor-pointer border-b bg-gray-50 px-4 py-3 transition-colors hover:bg-gray-100"
                onClick={() => toggleTable(table.sourceType)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <h3 className="text-l font-semibold text-gray-900">
                      {table.aitName} ({table.aitNumber}) - {formatSourceType(table.sourceType)}
                    </h3>
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-sm font-medium text-blue-800">
                      {table.recordCount} records
                    </span>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {allColumns.map((column) => (
                          <TableHead key={column}>{formatColumnName(column)}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {table.rowData.map((row, index) => (
                        <TableRow key={row.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          {allColumns.map((column) => (
                            <TableCell key={column}>{formatCellValue(row[column], column)}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
