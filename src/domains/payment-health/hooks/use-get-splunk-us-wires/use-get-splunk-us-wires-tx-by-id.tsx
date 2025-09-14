"use client"

import { useState, useEffect } from "react"

export function useGetSplunkUsWiresTransactionDetails(
  txId: string,
  datestart?: string,
  enddate?: string,
  enabled = !!txId,
) {
  const [data, setData] = useState<any>(undefined)
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
        if (datestart) params.append("datestart", datestart)
        if (enddate) params.append("enddate", enddate)

        const response = await fetch(`/api/v2/SplunkData/GetTransactionDetailsData?${params}`)

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`)
        }

        const result = await response.json()
        setData(result)
      } catch (err) {
        setIsError(true)
        setError(err instanceof Error ? err : new Error("Unknown error"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [txId, datestart, enddate, enabled])

  return { data, isLoading, isError, error }
}

export function useGetSplunkUsWiresTransactionDetailsByAmount(
  amount: string,
  startdate?: string,
  enddate?: string,
  enabled = !!amount,
) {
  const [data, setData] = useState<any>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!enabled || !amount) return

    const fetchData = async () => {
      setIsLoading(true)
      setIsError(false)
      setError(null)

      try {
        const params = new URLSearchParams()
        params.append("amount", amount)
        if (startdate) params.append("startdate", startdate)
        if (enddate) params.append("enddate", enddate)

        const response = await fetch(`/api/v2/SplunkData/GetAmountTransactionDetailsData?${params}`)

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`)
        }

        const result = await response.json()
        setData(result)
      } catch (err) {
        setIsError(true)
        setError(err instanceof Error ? err : new Error("Unknown error"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [amount, startdate, enddate, enabled])

  return { data, isLoading, isError, error }
}
