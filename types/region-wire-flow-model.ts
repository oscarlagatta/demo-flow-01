// Type definitions for E2E Region Wire Flow data models
// Replaces @bofa/data-services types for v0 environment

export type NodeFlow = {
  id?: number
  sourceId?: number
  targetId?: number
  sourceHandle?: string | null
  targetHandle?: string | null
  label?: string | null
}

export type E2ERegionWireFlowModel = {
  id?: number
  region?: string | null
  area?: string | null
  appId?: number
  nodeHeight?: number
  nodeWidth?: number
  descriptions?: string | null
  xPosition?: number
  yPosition?: number
  appName?: string | null
  mappedAppId?: string | null
  mappedAppNames?: string | null
  createdUserId?: number
  createdDateTime?: string
  updatedUserId?: number
  updatedDateTime?: string
  createdBy?: string | null
  updatedBy?: string | null
  nodeFlows?: Array<NodeFlow> | null
}

export type ApplicationModel = {
  aitNumber?: number
  aitName?: string | null
  description?: string | null
  status?: string | null
}
