import {
  AlertTriangle,
  Database,
  Shield,
  FileCheck,
  Network,
  FileText,
  Zap,
  Activity,
  SendHorizontal,
  Settings,
  type LucideIcon,
} from "lucide-react"

export type NodeCategory =
  | "validation"
  | "processing"
  | "security"
  | "database"
  | "middleware"
  | "network"
  | "monitoring"
  | "reporting"
  | "origination" // Added origination category
  | "default"

export type SectionId = "bg-origination" | "bg-validation" | "bg-middleware" | "bg-processing"

export const NODE_ICON_MAP: Record<NodeCategory, LucideIcon> = {
  validation: FileCheck,
  processing: Zap,
  security: Shield,
  database: Database,
  middleware: Settings, // Updated to Settings icon for middleware
  network: Network,
  monitoring: Activity,
  reporting: FileText,
  origination: SendHorizontal, // Added origination icon
  default: AlertTriangle,
}

export const SECTION_CATEGORY_MAP: Record<SectionId, NodeCategory> = {
  "bg-origination": "origination",
  "bg-validation": "validation",
  "bg-middleware": "middleware",
  "bg-processing": "processing",
}

export const NODE_TITLE_CATEGORY_MAP: Record<string, NodeCategory> = {
  // Validation nodes
  "CPO API Gateway": "validation",
  "Fraud Scoring": "security",
  "Sanctions Screening": "security",

  // Processing nodes
  "Payment Processing": "processing",
  "Settlement Engine": "processing",
  "Transaction Router": "processing",

  // Database nodes
  "Transaction DB": "database",
  "Audit Log": "database",

  // Middleware nodes
  WTX: "middleware",
  "Message Queue": "middleware",
  "ESB Gateway": "middleware",

  // Monitoring nodes
  "Health Monitor": "monitoring",
  "Performance Tracker": "monitoring",

  // Reporting nodes
  "Case Management": "reporting",
  "Compliance Reports": "reporting",

  "Payment Originator": "origination",
  "Transaction Initiator": "origination",
}

/**
 * Get category from section ID
 * @param sectionId - The parent section ID
 * @returns The category associated with this section
 */
export function getCategoryFromSection(sectionId?: string): NodeCategory | undefined {
  if (!sectionId) return undefined
  return SECTION_CATEGORY_MAP[sectionId as SectionId]
}

/**
 * Get the appropriate icon for a node based on its title, category, or section
 * Priority: explicit category > title mapping > section mapping > default
 * @param title - The node title
 * @param category - Optional explicit category
 * @param sectionId - Optional parent section ID for section-based icon assignment
 * @returns The Lucide icon component to render
 */
export function getNodeIcon(title: string, category?: NodeCategory, sectionId?: string): LucideIcon {
  // Priority 1: If explicit category provided, use it
  if (category && NODE_ICON_MAP[category]) {
    return NODE_ICON_MAP[category]
  }

  // Priority 2: Try to map from title
  const mappedCategory = NODE_TITLE_CATEGORY_MAP[title]
  if (mappedCategory && NODE_ICON_MAP[mappedCategory]) {
    return NODE_ICON_MAP[mappedCategory]
  }

  // Priority 3: Try to map from section ID
  const sectionCategory = getCategoryFromSection(sectionId)
  if (sectionCategory && NODE_ICON_MAP[sectionCategory]) {
    return NODE_ICON_MAP[sectionCategory]
  }

  // Default fallback
  return NODE_ICON_MAP.default
}

/**
 * Get icon color based on category for consistent theming
 * @param category - The node category
 * @param sectionId - Optional parent section ID
 * @returns Tailwind color class
 */
export function getNodeIconColor(category?: NodeCategory, sectionId?: string): string {
  const colorMap: Record<NodeCategory, string> = {
    validation: "text-blue-700",
    processing: "text-purple-700",
    security: "text-red-700",
    database: "text-green-700",
    middleware: "text-orange-700",
    network: "text-cyan-700",
    monitoring: "text-yellow-700",
    reporting: "text-indigo-700",
    origination: "text-emerald-700", // Added origination color
    default: "text-blue-700",
  }

  // Use provided category or derive from section
  const resolvedCategory = category || getCategoryFromSection(sectionId)
  return resolvedCategory ? colorMap[resolvedCategory] : colorMap.default
}

/**
 * Register a new node type with its icon mapping
 * This allows for runtime extension of the icon system
 * @param title - The node title to register
 * @param category - The category to assign
 */
export function registerNodeIcon(title: string, category: NodeCategory): void {
  NODE_TITLE_CATEGORY_MAP[title] = category
}

/**
 * Register a new section with its icon category
 * This allows all nodes within a section to share the same icon
 * @param sectionId - The section ID to register
 * @param category - The category to assign to all nodes in this section
 */
export function registerSectionIcon(sectionId: SectionId, category: NodeCategory): void {
  SECTION_CATEGORY_MAP[sectionId] = category
}
