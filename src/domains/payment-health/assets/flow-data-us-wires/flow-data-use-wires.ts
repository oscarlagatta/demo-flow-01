"use client"

import React from "react"

import type { AppNode } from "../../types/app-node"
import { classToParentId } from "@/domains/payment-health/utils/shared-mappings"
import { transformBackendData } from "@/domains/payment-health/utils/transform-utils"
import type { BackendFlowData } from "../../types/backend-flow-data"
import { useGetBackendFlowData } from "../../hooks/use-get-backend-flow-data/use-get-backend-flow-data"

function validateBackendData(data: any): data is BackendFlowData {
  return (
    data &&
    typeof data === "object" &&
    Array.isArray(data.nodes) &&
    Array.isArray(data.processingSections) &&
    Array.isArray(data.systemConnections) &&
    Array.isArray(data.layOutConfig) &&
    typeof data.averageThruputTime30 === "number"
  )
}

export function useFlowData(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options

  const {
    data: backendData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    isSuccess,
  } = useGetBackendFlowData({ enabled })

  const flowData = React.useMemo(() => {
    if (!backendData || !validateBackendData(backendData)) {
      console.warn("[v0] Invalid or missing backend data, using fallback")
      return {
        nodes: initialNodes,
        edges: initialEdges,
        processingSections: [],
        systemConnections: [],
        isValid: false,
      }
    }

    try {
      const result = generateFlowData(backendData)
      return {
        ...result,
        isValid: true,
      }
    } catch (error) {
      console.error("[v0] Error generating flow data:", error)
      return {
        nodes: initialNodes,
        edges: initialEdges,
        processingSections: [],
        systemConnections: [],
        isValid: false,
      }
    }
  }, [backendData])

  return {
    ...flowData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    isSuccess,
    backendData,
  }
}

export function generateFlowData(backendData: BackendFlowData) {
  console.log("[v0] Generating flow data from backend:", backendData)

  const validSystemConnections = backendData.systemConnections.filter((connection) => {
    const hasValidSource = backendData.nodes.some((node) => node.id === connection.source)
    const hasValidTargets = connection.target.every((targetId) =>
      backendData.nodes.some((node) => node.id === targetId),
    )

    if (!hasValidSource || !hasValidTargets) {
      console.warn("[v0] Invalid system connection:", connection)
      return false
    }
    return true
  })

  // Extract background nodes from layout configuration
  const backgroundNodes: AppNode[] = backendData.layOutConfig.map((config) => ({
    id: config.id,
    type: "background" as const,
    position: config.position,
    data: {
      ...config.data,
      ...getProcessingSectionData(config.id, backendData.processingSections),
    },
    draggable: config.draggable,
    selectable: config.selectable,
    zIndex: config.zIndex,
    style: config.style,
  }))

  // Extract section positions from layout configuration
  const sectionPositions: Record<string, { baseX: number; positions: { x: number; y: number }[] }> = {}

  backendData.layOutConfig.forEach((config) => {
    if (config.sectionPositions?.sections) {
      Object.assign(sectionPositions, config.sectionPositions.sections)
    }
  })

  const { nodes, edges } = transformBackendData(backendData, backgroundNodes, classToParentId, sectionPositions)

  const systemEdges = validSystemConnections.flatMap((connection) =>
    connection.target.map((targetId) => ({
      id: `system-${connection.source}-${targetId}`,
      source: connection.source,
      target: targetId,
      type: "smoothstep" as const,
      style: { strokeWidth: 2, stroke: "#6b7280" },
      markerEnd: { type: "arrowclosed", color: "#6b7280" },
      animated: false,
      data: { isSystemConnection: true },
    })),
  )

  console.log("[v0] Generated system edges:", systemEdges.length)

  return {
    nodes,
    edges: [...edges, ...systemEdges], // Combine transformed edges with system edges
    processingSections: backendData.processingSections,
    systemConnections: validSystemConnections,
  }
}

function getProcessingSectionData(sectionId: string, processingSections: any[]) {
  const sectionData = processingSections.find((section) => section.id === sectionId)
  if (!sectionData) return {}

  return {
    averageThroughputTime: sectionData.averageThroughputTime,
    aitNumbers: sectionData.aitNumber,
    entryCount: sectionData.aitNumber?.length || 0,
  }
}

export const initialNodes: AppNode[] = []
export const initialEdges: any[] = []
export const processingSections: any[] = []
export const systemConnections: any[] = []
