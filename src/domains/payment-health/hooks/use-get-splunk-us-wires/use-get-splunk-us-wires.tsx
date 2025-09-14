"use client"

import { useState, useEffect } from "react"
import type { SplunkDataItem } from "../../types/splunk-data-item"
import splunkUsWiresData from "../../assets/flow-data-us-wires/get-splunk-us-wires-data.json"

interface UseGetSplunkUsWiresOptions {
  enabled?: boolean
}

export function useGetSplunkUsWires(options: UseGetSplunkUsWiresOptions) {
  const { enabled } = options
  const [data, setData] = useState<SplunkDataItem[] | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [isFetching, setIsFetching] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const refetch = () => {
    if (enabled) {
      fetchData()
    }
  }

  const fetchData = async () => {
    setIsLoading(true)
    setIsFetching(true)
    setIsError(false)
    setError(null)
    setIsSuccess(false)

    try {
      // Simulate network delay to demonstrate loading states
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Return the imported JSON data
      setData(splunkUsWiresData as SplunkDataItem[])
      setIsSuccess(true)
    } catch (err) {
      setIsError(true)
      setError(err instanceof Error ? err : new Error("Unknown error"))
    } finally {
      setIsLoading(false)
      setIsFetching(false)
    }
  }

  useEffect(() => {
    if (enabled) {
      fetchData()
    }
  }, [enabled])

  return {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    isSuccess,
  }
}
