export interface SplunkData {
  aiT_NUM: string
  aiT_NAME: string
  floW_DIRECTION?: string | null
  floW_AIT_NUM?: string | null
  floW_AIT_NAME?: string | null
  iS_TRAFFIC_FLOWING?: string
  iS_TRAFFIC_ON_TREND?: string | null
  averagE_TRANSACTION_COUNT?: string | null
  currenT_TRANSACTION_COUNT?: string | null
  historic_STD?: string | null
  historic_MEAN?: string | null
  currenT_STD_VARIATION?: string | null
}

export interface BackendNode {
  id: string
  label: string
  category: string
  isTrafficFlowing: boolean
  currentThruputTime30: number
  averageThruputTime30: number
  systemHealth: string
  splunkDatas: SplunkData[]
  step: number
}

export interface ProcessingSection {
  id: string
  title: string
  averageThroughputTime: number
  aitNumber: string[]
}

export interface SystemConnection {
  id: string
  source: string
  target: string[]
}

export interface LayoutConfig {
  id: string
  type: string
  position: { x: number; y: number }
  data: { title: string }
  draggable: boolean
  selectable: boolean
  zIndex: number
  style: { width: string; height: string }
  sectionPositions: {
    sections: {
      [key: string]: {
        baseX: number
        positions: { x: number; y: number }[]
      }
    }
  }
}

export interface BackendFlowData {
  averageThruputTime30: number
  nodes: BackendNode[]
  processingSections: ProcessingSection[]
  systemConnections: SystemConnection[]
  layOutConfig: LayoutConfig[]
}
