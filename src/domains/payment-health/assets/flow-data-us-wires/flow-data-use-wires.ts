import type { AppNode } from "../../types/app-node"
import { classToParentId } from "@/domains/payment-health/utils/shared-mappings"
import { transformBackendData } from "@/domains/payment-health/utils/transform-utils"
import type { BackendFlowData } from "../../types/backend-flow-data"

export function generateFlowData(backendData: BackendFlowData) {
  // Extract background nodes from layout configuration
  const backgroundNodes: AppNode[] = backendData.layOutConfig.map((config) => ({
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

  backendData.layOutConfig.forEach((config) => {
    if (config.sectionPositions?.sections) {
      Object.assign(sectionPositions, config.sectionPositions.sections)
    }
  })

  const { nodes, edges } = transformBackendData(backendData, backgroundNodes, classToParentId, sectionPositions)

  return {
    nodes,
    edges,
    processingSections: backendData.processingSections,
    systemConnections: backendData.systemConnections,
  }
}

export const initialNodes: AppNode[] = []
export const initialEdges: any[] = []
export const processingSections: any[] = []
export const systemConnections: any[] = []
