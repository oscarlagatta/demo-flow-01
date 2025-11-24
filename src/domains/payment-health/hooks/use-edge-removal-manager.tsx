"use client"

import { useCallback, useState } from "react"
import type { Edge } from "@xyflow/react"
import { useRegionWireFlowPresenter } from "./use-region-wire-flow-presenter"
import type { E2ERegionWireFlowModel, NodeFlow } from "@bofa/data-services"

interface RemovedEdge {
  edgeId: string
  sourceNodeId: string
  targetNodeId: string
  sourceHandle?: string
  targetHandle?: string
  label?: string
}

/**
 * Hook to manage edge removal and persistence
 * Tracks removed edges and provides methods to sync with backend
 */
export const useEdgeRemovalManager = () => {
  const [removedEdges, setRemovedEdges] = useState<RemovedEdge[]>([])
  const { handleUpdateRegionWireFlow } = useRegionWireFlowPresenter()

  /**
   * Track an edge removal
   */
  const trackEdgeRemoval = useCallback((edge: Edge) => {
    const removedEdge: RemovedEdge = {
      edgeId: edge.id,
      sourceNodeId: edge.source,
      targetNodeId: edge.target,
      sourceHandle: edge.sourceHandle || undefined,
      targetHandle: edge.targetHandle || undefined,
      label: edge.label as string | undefined,
    }

    setRemovedEdges((prev) => [...prev, removedEdge])
  }, [])

  /**
   * Get current edges for a node, excluding removed ones
   */
  const getActiveNodeFlows = useCallback(
    (nodeId: string, allEdges: Edge[]): NodeFlow[] => {
      // Filter out removed edges
      const removedEdgeIds = new Set(removedEdges.map((e) => e.edgeId))

      return allEdges
        .filter((edge) => {
          // Skip if edge was removed
          if (removedEdgeIds.has(edge.id)) return false

          // Include if node is source or target
          return edge.source === nodeId || edge.target === nodeId
        })
        .map((edge) => ({
          sourceId: Number.parseInt(edge.source),
          targetId: Number.parseInt(edge.target),
          sourceHandle: edge.sourceHandle || null,
          targetHandle: edge.targetHandle || null,
          label: (edge.label as string) || null,
        }))
    },
    [removedEdges],
  )

  /**
   * Persist edge removals by updating affected nodes
   */
  const persistEdgeRemovals = useCallback(
    async (nodes: any[], allEdges: Edge[]) => {
      if (removedEdges.length === 0) {
        return { success: true, updatedCount: 0 }
      }

      try {
        // Get unique node IDs affected by removals
        const affectedNodeIds = new Set<string>()
        removedEdges.forEach((edge) => {
          affectedNodeIds.add(edge.sourceNodeId)
          affectedNodeIds.add(edge.targetNodeId)
        })

        // Update each affected node with current edge list
        const updatePromises = Array.from(affectedNodeIds).map(async (nodeId) => {
          const node = nodes.find((n) => n.id === nodeId)
          if (!node) return null

          const updatedNodeFlows = getActiveNodeFlows(nodeId, allEdges)

          const regionWireFlowModel: E2ERegionWireFlowModel = {
            id: node.data.dbId || Number.parseInt(nodeId),
            appId: node.data.aitNum || Number.parseInt(nodeId),
            mappedAppId: node.data.aitNum?.toString() || nodeId,
            region: "US", // Default or get from context
            area: node.data.category || node.data.icon || null,
            nodeWidth: node.style?.width ? Number.parseFloat(node.style.width as string) : 180,
            nodeHeight: node.style?.height ? Number.parseFloat(node.style.height as string) : 90,
            descriptions: node.data.descriptions || null,
            xPosition: Math.round(node.position.x),
            yPosition: Math.round(node.position.y),
            nodeFlows: updatedNodeFlows,
          }

          return handleUpdateRegionWireFlow(regionWireFlowModel)
        })

        await Promise.all(updatePromises.filter(Boolean))

        // Clear removed edges after successful persistence
        setRemovedEdges([])

        return {
          success: true,
          updatedCount: affectedNodeIds.size,
        }
      } catch (error) {
        console.error("[v0] Failed to persist edge removals:", error)
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }
      }
    },
    [removedEdges, handleUpdateRegionWireFlow, getActiveNodeFlows],
  )

  /**
   * Clear tracked removals (e.g., after cancel or refresh)
   */
  const clearRemovedEdges = useCallback(() => {
    setRemovedEdges([])
  }, [])

  return {
    trackEdgeRemoval,
    persistEdgeRemovals,
    clearRemovedEdges,
    getActiveNodeFlows,
    removedEdgesCount: removedEdges.length,
    removedEdges,
  }
}
