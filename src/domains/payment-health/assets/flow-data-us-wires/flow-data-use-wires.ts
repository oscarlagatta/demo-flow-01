// Checked
import type { AppNode } from "../../types/app-node"
import { classToParentId } from "@/domains/payment-health/utils/shared-mappings"
import { transformBackendData } from "@/domains/payment-health/utils/transform-utils"

import backendData from "./us-wires-data.json"
import type { BackendFlowData } from "../../types/backend-flow-data"

const typedBackendData = backendData as BackendFlowData

// Extract background nodes from layout configuration
const backgroundNodes: AppNode[] = typedBackendData.layOutConfig.map((config) => ({
  id: config.id,
  type: "background" as const,
  position: config.position,
  data: config.data,
  draggable: config.draggable,
  selectable: config.selectable,
  zIndex: config.zIndex,
  style: config.style,
}))

// Extract section positions from layout configuration
const sectionPositions: Record<string, { baseX: number; positions: { x: number; y: number }[] }> = {}

typedBackendData.layOutConfig.forEach((config) => {
  if (config.sectionPositions?.sections) {
    Object.assign(sectionPositions, config.sectionPositions.sections)
  }
})

export const { nodes: initialNodes, edges: initialEdges } = transformBackendData(
  typedBackendData,
  backgroundNodes,
  classToParentId,
  sectionPositions,
)

export const processingSections = typedBackendData.processingSections
export const systemConnections = typedBackendData.systemConnections
