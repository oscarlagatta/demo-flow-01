"use client"

import { useCallback, useMemo, useState } from "react"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { useGetSplunkUsWiresTransactionDetailsByAmount } from "@/domains/payment-health/api/generated/hooks"
import { useTransactionSearchUsWiresContext } from "@/domains/payment-health/providers/us-wires/us-wires-transaction-search-provider"

interface TransactionRow {
  id: string
  transactionRef: string
  amount: string
  currency: string
  date: string
  source: string
  destination: string
  country: string
  status: string
  aitNumber: string
  aitName: string
  [key: string]: any
}

interface TransactionSearchResultsGridProps {
  transactionAmount: string
  dateStart?: string
  dateEnd?: string
  onBack: () => void
}

export function TransactionSearchResultsGrid({
  transactionAmount,
  dateStart,
  dateEnd,
  onBack,
}: TransactionSearchResultsGridProps) {
  const { search } = useTransactionSearchUsWiresContext()
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionRow | null>()

  const {
    data: apiResponse,
    isLoading,
    isError,
    error,
  } = useGetSplunkUsWiresTransactionDetailsByAmount(transactionAmount, dateStart, dateEnd)

  console.log("[] Amount search API response: ", apiResponse)

  const formatCellValue = useCallback((value: any, columnName: string) => {
    if (value === null || value === undefined || value === "" || value === "null") {
      return "-"
    }

    // Format Dates
    if (columnName.includes("DATE") || columnName.includes("TS")) {
      try {
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString() + " " + date.toLocaleTimeString()
        }
      } catch (e) {
        // if date parsing fails return original value
        return value
      }
    }

    // Format amounts
    if (columnName.includes("AMT") || columnName === "amount") {
      const numValue = Number.parseFloat(value)
      if (!isNaN(numValue)) {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
        }).format(numValue)
      }
    }

    return String(value)
  }, [])

  const { rowData, totalTransactions } = useMemo(() => {
    if (!apiResponse || !Array.isArray(apiResponse)) {
      return { rowData: [], totalTransactions: 0 }
    }

    const transformedData: TransactionRow[] = apiResponse.map((transaction, index) => ({
      id: `txn-${index}-${Date.now()}`,
      transactionRef: `REF-${index}`,
      amount: "0.00",
      currency: "USD",
      date: new Date().toISOString(),
      source: "TEMP_SOURCE",
      destination: "TEMP_DESTINATION",
      country: "US",
      status: "PENDING",
      aitNumber: "TEMP_AIT",
      aitName: "Temporary AIT System",
      // Preserve original data
      _originalData: transaction,
    }))

    return {
      rowData: transformedData,
      totalTransactions: transformedData.length,
    }
  }, [apiResponse])

  const onRowClicked = useCallback(
    (transaction: TransactionRow) => {
      const transactionId = transaction.id

      console.log("transaction selected: ", transactionId)

      // set the selected transaction to display details
      setSelectedTransaction(transaction)

      // use the existing search functionality to load transaction details
      search(transaction.id)
    },
    [search],
  )

  if (isLoading) {
    return (
      <div className="h-full w-full">
        <div className="mb-3 rounded-lg border border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={onBack}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 bg-transparent"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <div>
                <Skeleton className="mb-2 h-6 w-48" />
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-2 p-4">
          <Skeleton className="h-6 w-60" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <p className="mb-2 text-lg text-red-600">Error loading transaction data</p>
          <p className="mb-4 text-gray-600">{error?.message || "Failed to fetch transactions"}</p>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      {/*HEADER*/}
      <div className="mb-3 rounded-lg border border-b border-gray-200 bg-white px-6 py-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button onClick={onBack} variant="outline" size="sm" className="flex items-center space-x-2 bg-transparent">
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <div>
              <p className="text-sm text-gray-600">
                Amount: ${transactionAmount} - {totalTransactions} Transactions found
                {dateStart && ` - From: ${dateStart}`}
                {dateEnd && ` - To: ${dateEnd}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/*TABLE*/}
      <div className="h-full w-full overflow-hidden rounded-lg border border-gray-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Transaction Ref</TableHead>
              <TableHead className="w-[180px]">SBK Ref</TableHead>
              <TableHead className="w-[120px] text-right">Amount</TableHead>
              <TableHead className="w-[100px] text-center">Currency</TableHead>
              <TableHead className="w-[150px] text-right">Date</TableHead>
              <TableHead className="w-[100px] text-center">Source</TableHead>
              <TableHead className="w-[120px]">Destination</TableHead>
              <TableHead className="w-[100px] text-center">Country</TableHead>
              <TableHead className="w-[150px]">AIT System</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rowData.map((transaction, index) => (
              <TableRow
                key={transaction.id}
                className={`cursor-pointer hover:bg-gray-50 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                onClick={() => onRowClicked(transaction)}
              >
                <TableCell className="text-right">{transaction.transactionRef}</TableCell>
                <TableCell className="text-right">{transaction.id}</TableCell>
                <TableCell className="text-right">{formatCellValue(transaction.amount, "amount")}</TableCell>
                <TableCell className="text-center">{transaction.currency}</TableCell>
                <TableCell className="text-right">{formatCellValue(transaction.date, "DATE")}</TableCell>
                <TableCell className="text-center">{transaction.source}</TableCell>
                <TableCell>{transaction.destination}</TableCell>
                <TableCell className="text-center">{transaction.country}</TableCell>
                <TableCell>{transaction.aitName}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
