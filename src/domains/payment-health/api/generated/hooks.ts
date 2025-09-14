"use client"

import { useState, useEffect } from "react"
import type { GetApiV2SplunkDataGetTransactionDetailsDataResponse } from "@/domains/payment-health/types/transaction-details-data-response"

export function useGetSplunkUsWiresTransactionDetails(
  txId: string,
  dateStart?: string,
  dateEnd?: string,
  enabled = true,
) {
  const [data, setData] = useState<GetApiV2SplunkDataGetTransactionDetailsDataResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!enabled || !txId) return

    const fetchData = async () => {
      setIsLoading(true)
      setIsError(false)
      setError(null)

      try {
        const params = new URLSearchParams()
        params.append("transactionId", txId)
        if (dateStart) params.append("dateStart", dateStart)
        if (dateEnd) params.append("dateEnd", dateEnd)

        const response = await fetch(`/api/v2/SplunkData/GetTransactionDetailsData?${params}`)

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`)
        }

        const result = await response.json()
        setData(Array.isArray(result) ? result : [result])
      } catch (err) {
        setIsError(true)
        setError(err instanceof Error ? err : new Error("Unknown error"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [txId, dateStart, dateEnd, enabled])

  return { data, isLoading, isError, error }
}

export function useGetSplunkUsWiresTransactionDetailsByAmount(
  transactionAmount: string,
  dateStart?: string,
  dateEnd?: string,
  enabled = true,
) {
  const [data, setData] = useState<GetApiV2SplunkDataGetTransactionDetailsDataResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!enabled || !transactionAmount) return

    const fetchData = async () => {
      setIsLoading(true)
      setIsError(false)
      setError(null)

      try {
        const params = new URLSearchParams()
        params.append("transactionAmount", transactionAmount)
        if (dateStart) params.append("dateStart", dateStart)
        if (dateEnd) params.append("dateEnd", dateEnd)

        const response = await fetch(`/api/v2/SplunkData/GetTransactionDetailsByAmountData?${params}`)

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`)
        }

        const result = await response.json()
        setData(Array.isArray(result) ? result : [result])
      } catch (err) {
        setIsError(true)
        setError(err instanceof Error ? err : new Error("Unknown error"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [transactionAmount, dateStart, dateEnd, enabled])

  return { data, isLoading, isError, error }
}
