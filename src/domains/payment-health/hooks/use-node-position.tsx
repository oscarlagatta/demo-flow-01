import { useCallback, useRef } from "react"
import { useReactFlow, type Node } from "@xyflow/react"
import { getNodePositionData, type NodePositionData } from "../utils/node-position-utils"

/**
 * Hook for retrieving and monitoring node position and size data
 * 
 * @param nodeId - The ID of the node to track
 * @param nodeRef - Optional ref to the node's DOM element for accurate measurements
 * @returns Object with methods to get current position data
 */
export function useNodePosition(nodeId: string, nodeRef?: React.RefObject<HTMLElement>) {
  const { getNode } = useReactFlow()
  const lastPositionRef = useRef<NodePositionData | null>(null)

  /**
   * Gets the current position and size data for the node
   * Uses React Flow's internal state and optionally the DOM element for accuracy
   */
  const getCurrentPosition = useCallback((): NodePositionData | null => {
    const node = getNode(nodeId) as Node | undefined
    
    if (!node) {
      console.warn(`[v0] Node ${nodeId} not found in React Flow state`)
      return null
    }

    const positionData = getNodePositionData(node, nodeRef?.current)
    lastPositionRef.current = positionData
    
    console.log("[v0] Node position retrieved:", {
      nodeId,
      position: { x: positionData.x, y: positionData.y },
      dimensions: { width: positionData.width, height: positionData.height },
    })
    
    return positionData
  }, [nodeId, getNode, nodeRef])

  /**
   * Gets the last cached position data without querying React Flow
   * Useful for comparison or when you need the previous state
   */
  const getLastPosition = useCallback((): NodePositionData | null => {
    return lastPositionRef.current
  }, [])

  /**
   * Logs the current position data to console for debugging
   */
  const logPosition = useCallback(() => {
    const position = getCurrentPosition()
    if (position) {
      console.log("[v0] Node position data:", {
        nodeId,
        coordinates: `(${position.x}, ${position.y})`,
        size: `${position.width}x${position.height}`,
        timestamp: new Date(position.timestamp).toISOString(),
        boundingRect: position.boundingRect ? {
          top: position.boundingRect.top,
          left: position.boundingRect.left,
          right: position.boundingRect.right,
          bottom: position.boundingRect.bottom,
        } : null,
      })
    }
  }, [nodeId, getCurrentPosition])

  return {
    getCurrentPosition,
    getLastPosition,
    logPosition,
  }
}
