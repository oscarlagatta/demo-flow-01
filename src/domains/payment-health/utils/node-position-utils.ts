import { type Node } from "@xyflow/react"

/**
 * Represents the complete positional and dimensional data for a node
 */
export interface NodePositionData {
  /** Node's X coordinate in the React Flow canvas */
  x: number
  /** Node's Y coordinate in the React Flow canvas */
  y: number
  /** Node's width in pixels */
  width: number
  /** Node's height in pixels */
  height: number
  /** Optional: The node's bounding rectangle relative to the viewport */
  boundingRect?: DOMRect
  /** Timestamp when the data was captured */
  timestamp: number
}

/**
 * Gets the current position and size of a node from React Flow state
 * 
 * @param node - The React Flow node object
 * @param nodeElement - Optional DOM element reference for accurate measurements
 * @returns Complete position and dimension data
 */
export function getNodePositionData(
  node: Node,
  nodeElement?: HTMLElement | null
): NodePositionData {
  const data: NodePositionData = {
    x: node.position.x,
    y: node.position.y,
    width: node.measured?.width || node.width || 0,
    height: node.measured?.height || node.height || 0,
    timestamp: Date.now(),
  }

  // If DOM element is provided, get accurate bounding rectangle
  if (nodeElement) {
    const rect = nodeElement.getBoundingClientRect()
    data.boundingRect = rect
    // Override with actual DOM measurements if available
    data.width = rect.width
    data.height = rect.height
  }

  return data
}

/**
 * Formats node position data for API persistence
 * 
 * @param positionData - The node position data to format
 * @returns Formatted data ready for API submission
 */
export function formatForPersistence(positionData: NodePositionData) {
  return {
    x: Math.round(positionData.x),
    y: Math.round(positionData.y),
    width: Math.round(positionData.width),
    height: Math.round(positionData.height),
    updatedAt: new Date(positionData.timestamp).toISOString(),
  }
}

/**
 * Calculates the center point of a node
 * 
 * @param positionData - The node position data
 * @returns Object with centerX and centerY coordinates
 */
export function getNodeCenter(positionData: NodePositionData) {
  return {
    centerX: positionData.x + positionData.width / 2,
    centerY: positionData.y + positionData.height / 2,
  }
}

/**
 * Checks if a node's position or size has changed significantly
 * 
 * @param previous - Previous position data
 * @param current - Current position data
 * @param threshold - Minimum change in pixels to consider significant (default: 1)
 * @returns True if position or size has changed beyond threshold
 */
export function hasPositionChanged(
  previous: NodePositionData,
  current: NodePositionData,
  threshold = 1
): boolean {
  return (
    Math.abs(previous.x - current.x) > threshold ||
    Math.abs(previous.y - current.y) > threshold ||
    Math.abs(previous.width - current.width) > threshold ||
    Math.abs(previous.height - current.height) > threshold
  )
}
