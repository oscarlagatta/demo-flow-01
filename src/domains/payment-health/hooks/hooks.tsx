"use client"

import { useState, useEffect } from "react"
import type { KPIStats, ServiceStatus, ServiceCharts } from "./types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useKpis() {
  const [data, setData] = useState<KPIStats | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await fetcher("/api/monitor/kpis")
        setData(result)
      } catch (error) {
        setIsError(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  return { data, isLoading, isError }
}

export function useServices() {
  const [data, setData] = useState<ServiceStatus[] | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await fetcher("/api/monitor/services")
        setData(result)
      } catch (error) {
        setIsError(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  return { data, isLoading, isError }
}

export function useServiceCharts(serviceId: string) {
  const [data, setData] = useState<ServiceCharts | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    if (!serviceId) return

    const fetchData = async () => {
      try {
        const result = await fetcher(`/api/monitor/charts/${serviceId}`)
        setData(result)
      } catch (error) {
        setIsError(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [serviceId])

  return { data, isLoading, isError }
}
