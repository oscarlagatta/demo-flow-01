import type { LucideIcon } from "lucide-react"

export interface CustomNodeData {
  title: string
  subtext?: string
  isSelected?: boolean
  isConnected?: boolean
  isDimmed?: boolean
  onClick?: (nodeId: string) => void
  onActionClick?: (aitNum: string, action: "flow" | "trend" | "balanced") => void
  isMonitorMode?: boolean
  duration?: number
  trend?: string
  icon?: LucideIcon | string // Can be a Lucide icon component or a string identifier
  iconColor?: string // Optional color override for the icon
  parentId?: string // Added parentId for section-based icon mapping
  isDragging?: boolean // Indicates if the node is currently being dragged
  position?: { x: number; y: number } // Current position coordinates
  descriptions?: string // Multi-line string separated by \n, e.g., "Handles origination requests\n- receives inbound\n- Send messages"
}
