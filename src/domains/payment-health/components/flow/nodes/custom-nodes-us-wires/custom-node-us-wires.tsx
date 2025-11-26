"use client"

import type React from "react"
import { memo, useMemo, useState, useRef, useCallback, useEffect } from "react"
import { Handle, Position, type NodeProps, type Node, useUpdateNodeInternals, useReactFlow } from "@xyflow/react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { IncidentSheet } from "@/domains/payment-health/components/sheets/incident-sheet"
import { Clock } from "lucide-react"
import { Loader2, Check, AlertCircle } from "lucide-react"

import { useGetSplunkUsWires } from "@/domains/payment-health/hooks/use-get-splunk-us-wires/use-get-splunk-us-wires"
import { useTransactionSearchUsWiresContext } from "@/domains/payment-health/providers/us-wires/us-wires-transaction-search-provider"
import {
  computeTrafficStatusColors,
  getTrafficStatusColorClass,
  type TrafficStatusColor,
} from "../../../../utils/traffic-status-utils"
import { computeTrendColors, getTrendColorClass, type TrendColor } from "../../../../utils/trend-color-utils"
import { CardLoadingSkeleton } from "../../../loading/loading-skeleton"
import { EditableDescriptions } from "./editable-descriptions"

import { NodeToolbar } from "./node-toolbar"
import { NodeSaveToolbar } from "./node-save-toolbar"
import { PositionDisplayOverlay } from "./position-display-overlay"

import type { CustomNodeData } from "@/types/custom-node-data"
import type { E2ERegionWireFlowModel } from "@/types/region-wire-flow-model"
import { useNodeResizePersistence } from "@/domains/payment-health/hooks/use-node-resize-persistence"
import { getNodeIcon, getNodeIconColor, type NodeCategory } from "@/domains/payment-health/utils/node-icon-mapping"
import { useNodePosition } from "@/domains/payment-health/hooks/use-node-position"
import { useRegionWireFlowPresenter } from "@/domains/payment-health/hooks/use-region-wire-flow-presenter"

const RESIZE_CONSTRAINTS = {
  minWidth: 150,
  maxWidth: 400,
  minHeight: 100,
  maxHeight: 600,
}

const buildRegionWireFlowModel = (
  node: Node<CustomNodeData>,
  currentPosition: { x: number; y: number; width: number; height: number } | null,
  connectedEdges: any[],
): E2ERegionWireFlowModel => {
  // Extract AIT number from subtext (e.g., "AIT 512" -> 512)
  const aitMatch = node.data.subtext?.match(/AIT\s*(\d+)/)
  const aitNumber = aitMatch ? Number.parseInt(aitMatch[1], 10) : undefined

  // Build nodeFlows from connected edges
  const nodeFlows = connectedEdges.map((edge) => ({
    id: undefined, // Let the backend assign the ID
    sourceId: Number.parseInt(edge.source, 10),
    targetId: Number.parseInt(edge.target, 10),
    sourceHandle: edge.sourceHandle || "Right",
    targetHandle: edge.targetHandle || "Left",
    label: edge.label || null,
  }))

  // Priority: explicit category field > icon field (which contains category) > parentId extraction
  const area =
    node.data.category ||
    (typeof node.data.icon === "string" ? node.data.icon : null) ||
    node.data.parentId?.replace("bg-", "") ||
    null

  return {
    id: node.id ? Number.parseInt(node.id, 10) : undefined,
    region: "US", // Default region, could be extracted from data if available
    area: area, // Use category from node data as area
    appId: aitNumber,
    mappedAppId: node.data.subtext || null,
    nodeWidth: currentPosition?.width || 180,
    nodeHeight: currentPosition?.height || 90,
    descriptions: node.data.descriptions || null,
    xPosition: Math.round(currentPosition?.x || node.position.x),
    yPosition: Math.round(currentPosition?.y || node.position.y),
    appName: node.data.title || null,
    nodeFlows: nodeFlows.length > 0 ? nodeFlows : null,
    createdUserId: 408, // Default user ID, should come from auth context
    updatedUserId: 408, // Default user ID, should come from auth context
  }
}

const CustomNodeUsWires = ({
  data,
  id,
  position,
  onHideSearch,
}: NodeProps<Node<CustomNodeData>> & { onHideSearch: () => void }) => {
  const updateNodeInternals = useUpdateNodeInternals()
  const { getNode, getEdges, updateNode } = useReactFlow()

  const { handleUpdateRegionWireFlow } = useRegionWireFlowPresenter()
  const [isSavingNode, setIsSavingNode] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle")

  const [dimensions, setDimensions] = useState({
    width: 220,
    height: 180,
  })
  const [isResizing, setIsResizing] = useState(false)
  const [activeHandle, setActiveHandle] = useState<"e" | "w" | "n" | "s" | null>(null)
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 })
  const nodeRef = useRef<HTMLDivElement>(null)

  const [isDragging, setIsDragging] = useState(false)
  const [livePosition, setLivePosition] = useState({ x: 0, y: 0, width: 0, height: 0 })

  const isAuthorized = true

  const {
    data: splunkData,
    isLoading,
    isError,
    isFetching,
  } = useGetSplunkUsWires({
    enabled: isAuthorized,
  })

  const {
    active: txActive,
    isFetching: txFetching,
    matchedAitIds,
    showTable,
    searchParams,
  } = useTransactionSearchUsWiresContext()

  const { loadDimensions } = useNodeResizePersistence({
    nodeId: id,
    onConflict: (serverVersion, clientVersion) => {
      loadDimensions().then((dims) => {
        if (dims) {
          setDimensions({ width: dims.width, height: dims.height })
        }
      })
    },
  })

  const { getCurrentPosition, logPosition } = useNodePosition(id, nodeRef)

  const [isEditingDescriptions, setIsEditingDescriptions] = useState(false)
  const [localDescriptions, setLocalDescriptions] = useState<string[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const handleSaveNode = useCallback(
    async (model: E2ERegionWireFlowModel) => {
      setSaveStatus("saving")
      setIsSavingNode(true)
      try {
        await handleUpdateRegionWireFlow(model)
        setSaveStatus("success")
        setTimeout(() => setSaveStatus("idle"), 2000)
      } catch (error) {
        setSaveStatus("error")
        setTimeout(() => setSaveStatus("idle"), 3000)
      } finally {
        setIsSavingNode(false)
      }
    },
    [handleUpdateRegionWireFlow],
  )

  const handleSaveNodeWrapper = async () => {
    const positionData = getCurrentPosition()
    if (!positionData) return

    const connectedEdges = getEdges().filter((edge) => edge.source === id || edge.target === id)

    const nodeFlows = connectedEdges.map((edge) => ({
      sourceId: Number.parseInt(edge.source),
      targetId: Number.parseInt(edge.target),
      sourceHandle: edge.sourceHandle || null,
      targetHandle: edge.targetHandle || null,
      label: edge.label || null,
    }))

    const updatedDescriptions = localDescriptions.join("\n")

    const model: E2ERegionWireFlowModel = {
      id: Number.parseInt(id),
      name: data.title,
      positionX: positionData.x,
      positionY: positionData.y,
      width: dimensions.width,
      height: dimensions.height,
      descriptions: updatedDescriptions,
      area: data.category || (typeof data.icon === "string" ? data.icon : undefined) || data.parentId || "default",
      nodeFlows,
    }

    await handleSaveNode(model)
    updateNode(id, { ...data, descriptions: updatedDescriptions })
    setHasUnsavedChanges(false)
    setIsEditingDescriptions(false)
  }

  const aitNum = useMemo(() => {
    const match = data.subtext.match(/AIT (\d+)/)
    return match ? match[1] : null
  }, [data.subtext])

  const trendColorMapping = useMemo(() => {
    if (!splunkData) return {}
    return computeTrendColors(splunkData)
  }, [splunkData])

  const trafficStatusMapping = useMemo(() => {
    if (!splunkData) return {}
    return computeTrafficStatusColors(splunkData)
  }, [splunkData])

  const trendColor: TrendColor = aitNum && trendColorMapping[aitNum] ? trendColorMapping[aitNum] : "grey"
  const trafficStatusColor: TrafficStatusColor =
    aitNum && trafficStatusMapping[aitNum] ? trafficStatusMapping[aitNum] : "grey"

  const trendColorClass = getTrendColorClass(trendColor)
  const trafficStatusColorClass = getTrafficStatusColorClass(trafficStatusColor)

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, handle: "e" | "w" | "n" | "s") => {
      e.stopPropagation()
      e.preventDefault()
      e.nativeEvent.stopImmediatePropagation()

      setIsResizing(true)
      setActiveHandle(handle)
      resizeStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        width: dimensions.width,
        height: dimensions.height,
      }
    },
    [dimensions],
  )

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !activeHandle) return

      requestAnimationFrame(() => {
        const deltaX = e.clientX - resizeStartRef.current.x
        const deltaY = e.clientY - resizeStartRef.current.y

        let newWidth = resizeStartRef.current.width
        let newHeight = resizeStartRef.current.height

        if (activeHandle === "e") {
          newWidth = resizeStartRef.current.width + deltaX
        } else if (activeHandle === "w") {
          newWidth = resizeStartRef.current.width - deltaX
        }

        if (activeHandle === "s") {
          newHeight = resizeStartRef.current.height + deltaY
        } else if (activeHandle === "n") {
          newHeight = resizeStartRef.current.height - deltaY
        }

        newWidth = Math.max(RESIZE_CONSTRAINTS.minWidth, Math.min(RESIZE_CONSTRAINTS.maxWidth, newWidth))
        newHeight = Math.max(RESIZE_CONSTRAINTS.minHeight, Math.min(RESIZE_CONSTRAINTS.maxHeight, newHeight))

        setDimensions({ width: newWidth, height: newHeight })
      })
    },
    [isResizing, activeHandle],
  )

  const handleResizeEnd = useCallback(() => {
    if (!isResizing) return

    setIsResizing(false)
    setActiveHandle(null)
    document.body.style.cursor = "default"
  }, [isResizing])

  const [isDetailsLoading, setIsDetailsLoading] = useState(false)
  const [isIncidentSheetOpen, setIsIncidentSheetOpen] = useState(false)

  const handleDetailsClick = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (aitNum && !isDetailsLoading) {
      setIsDetailsLoading(true)
      try {
        await showTable(aitNum)
      } finally {
        setTimeout(() => {
          setIsDetailsLoading(false)
        }, 500)
      }
    }
  }

  const handleCreateIncident = () => {
    setIsIncidentSheetOpen(true)
  }

  const handleToggleEdit = () => {
    setIsEditingDescriptions(!isEditingDescriptions)
  }

  const handleDescriptionsUpdate = (items: string[]) => {
    setLocalDescriptions(items)
    setHasUnsavedChanges(true)
  }

  const getCardClassName = () => {
    let baseClass = "border-2 border-[rgb(10, 49,97)] shadow-md cursor-pointer transition-all duration-200"

    if (isLoading || isFetching) {
      baseClass += " bg-gray-50"
    } else if (isError) {
      baseClass += " bg-red-50 border-red-200"
    } else {
      baseClass += " bg-white"
    }

    if (data.isSelected && !isLoading) {
      baseClass += " ring-2 ring-blue-700 shadow-lg scale-105"
    } else if (data.isConnected && !isLoading) {
      baseClass += " ring-2 ring-blue-300 shadow-lg"
    } else if (data.isDimmed) {
      baseClass += " opacity-40"
    }

    return baseClass
  }

  const fontSize = Math.max(8, Math.min(12, dimensions.width / 20))
  const buttonHeight = Math.max(28, Math.min(40, dimensions.height / 5))

  const descriptionItems = useMemo(() => {
    if (!data.descriptions) return []
    return data.descriptions
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => (line.startsWith("-") ? line.substring(1).trim() : line))
  }, [data.descriptions])

  const descriptionColumns = useMemo(() => {
    const itemCount = descriptionItems.length
    if (itemCount === 0) return 1

    if (itemCount >= 4 && dimensions.width >= 280) return 2

    if (itemCount >= 9 && dimensions.width >= 350) return 3

    return 1
  }, [descriptionItems.length, dimensions.width])

  const descriptionFontSize = useMemo(() => {
    const baseSize = Math.max(10, Math.min(14, dimensions.width / 25))
    return baseSize
  }, [dimensions.width])

  const bulletSize = useMemo(() => {
    return Math.max(4, descriptionFontSize * 0.35)
  }, [descriptionFontSize])

  useEffect(() => {
    if (data.isDragging !== undefined) {
      setIsDragging(data.isDragging)

      if (data.isDragging) {
        const positionData = getCurrentPosition()
        if (positionData && nodeRef.current) {
          const rect = nodeRef.current.getBoundingClientRect()
          setLivePosition({
            x: positionData.x,
            y: positionData.y,
            width: positionData.width,
            height: rect.height,
          })
        }
      }
    }
  }, [data.isDragging, getCurrentPosition])

  useEffect(() => {
    if (isDragging && data.position && nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect()
      setLivePosition((prev) => ({
        x: data.position?.x || prev.x,
        y: data.position?.y || prev.y,
        width: dimensions.width,
        height: rect.height,
      }))
    }
  }, [isDragging, data.position, dimensions.width])

  useEffect(() => {
    if (isResizing && nodeRef.current) {
      const positionData = getCurrentPosition()
      const rect = nodeRef.current.getBoundingClientRect()
      if (positionData) {
        setLivePosition({
          x: positionData.x,
          y: positionData.y,
          width: dimensions.width,
          height: rect.height,
        })
      }
    }
  }, [isResizing, dimensions.width, dimensions.height, getCurrentPosition])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleResizeMove)
      document.addEventListener("mouseup", handleResizeEnd)
      const cursor =
        activeHandle === "e" || activeHandle === "w"
          ? "ew-resize"
          : activeHandle === "n" || activeHandle === "s"
            ? "ns-resize"
            : "default"
      document.body.style.cursor = cursor

      return () => {
        document.removeEventListener("mousemove", handleResizeMove)
        document.removeEventListener("mouseup", handleResizeEnd)
        document.body.style.cursor = "default"
      }
    }
  }, [isResizing, handleResizeMove, handleResizeEnd, activeHandle])

  useEffect(() => {
    updateNodeInternals(id)
  }, [id, dimensions, updateNodeInternals])

  const handleAddNode = () => {
    logPosition()
  }

  const handleDeleteNode = () => {
    console.log("[v0] Delete node clicked for:", id)
  }

  const NodeIcon = useMemo(() => {
    if (data.icon) {
      if (typeof data.icon === "string") {
        return getNodeIcon(data.icon as NodeCategory, data.parentId)
      }
      return data.icon
    }
    return getNodeIcon(undefined, data.parentId)
  }, [data.icon, data.parentId])

  const iconColorClass = useMemo(() => {
    if (data.iconColor) {
      return data.iconColor
    }
    const category = data.icon && typeof data.icon === "string" ? (data.icon as NodeCategory) : undefined
    return getNodeIconColor(category, data.parentId)
  }, [data.icon, data.iconColor, data.parentId])

  const handleClick = (e: React.MouseEvent) => {
    // Handle node click
  }

  const triggerAction = (action: string) => {
    console.log("[v0] Action triggered:", action)
  }

  useEffect(() => {
    const errorHandler = (e: ErrorEvent) => {
      if (e.message.includes("ResizeObserver loop")) {
        e.stopImmediatePropagation()
        e.preventDefault()
      }
    }
    window.addEventListener("error", errorHandler)
    return () => window.removeEventListener("error", errorHandler)
  }, [])

  useEffect(() => {
    if (data.descriptions) {
      const items = data.descriptions
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => (line.startsWith("-") ? line.substring(1).trim() : line))
      setLocalDescriptions(items)
    } else {
      setLocalDescriptions([])
    }
    setHasUnsavedChanges(false)
  }, [data.descriptions])

  if (isLoading) {
    return <CardLoadingSkeleton className="w-full" />
  }

  if (isError) {
    return <div className="text-red-500">Failed to load data. Please try again later.</div>
  }

  const inDefaultMode = !txActive
  const inLoadingMode = txActive && txFetching
  const inResultsMode = txActive && !txFetching
  const isMatched = !!aitNum && matchedAitIds.has(aitNum)

  return (
    <>
      <div ref={nodeRef} className="relative group" style={{ width: dimensions.width, height: dimensions.height }}>
        <PositionDisplayOverlay
          x={livePosition.x}
          y={livePosition.y}
          width={livePosition.width}
          height={livePosition.height}
          isVisible={isDragging || isResizing}
        />

        <NodeSaveToolbar
          nodeTitle={data.title}
          onSave={handleSaveNodeWrapper}
          isEditing={isEditingDescriptions}
          onEdit={() => setIsEditingDescriptions(!isEditingDescriptions)}
          hasUnsavedChanges={hasUnsavedChanges}
        />

        {data.isSelected && (
          <NodeToolbar
            onAddNode={handleAddNode}
            onCreateIncident={handleCreateIncident}
            onDelete={handleDeleteNode}
            onSave={handleSaveNodeWrapper}
            onEdit={handleToggleEdit}
            isEditing={isEditingDescriptions}
            hasUnsavedChanges={hasUnsavedChanges}
          />
        )}

        <Card
          className={getCardClassName()}
          style={{ width: "100%", height: "100%" }}
          onClick={handleClick}
          data-testid={`custom-node-${id}`}
        >
          <Handle type="target" position={Position.Left} className="h-2 w-2 !bg-gray-400" />
          <Handle type="source" position={Position.Right} className="h-2 w-2 !bg-gray-400" />
          <Handle type="source" position={Position.Top} className="h-2 w-2 !bg-gray-400" />
          <Handle type="source" position={Position.Bottom} className="h-2 w-2 !bg-gray-400" />

          <CardHeader className="p-2 pb-1.5 space-y-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <NodeIcon className={`h-4 w-4 flex-shrink-0 ${iconColorClass}`} strokeWidth={2.5} />
                <CardTitle
                  className="font-bold text-gray-900 leading-none truncate"
                  style={{ fontSize: `${Math.max(13, fontSize * 1.1)}px` }}
                >
                  {data.title}
                </CardTitle>
                {saveStatus !== "idle" && (
                  <div className="flex items-center gap-1 ml-1">
                    {saveStatus === "saving" && (
                      <>
                        <Loader2 className="h-3.5 w-3.5 text-blue-600 animate-spin" />
                        <span className="text-[10px] text-blue-600 font-medium">Saving...</span>
                      </>
                    )}
                    {saveStatus === "success" && (
                      <>
                        <Check className="h-3.5 w-3.5 text-green-600" />
                        <span className="text-[10px] text-green-600 font-medium">Saved</span>
                      </>
                    )}
                    {saveStatus === "error" && (
                      <>
                        <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                        <span className="text-[10px] text-red-600 font-medium">Error</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <Clock className="h-4 w-4 text-blue-700" strokeWidth={2.5} />
                <span
                  className="font-bold text-blue-700 leading-none"
                  style={{ fontSize: `${Math.max(13, fontSize * 1.1)}px` }}
                >
                  3.2s
                </span>
              </div>
            </div>
            <div className="mt-1.5 border-t border-gray-300" />
          </CardHeader>

          <CardContent className="p-2 pt-1.5 flex flex-col min-h-[80px]">
            {isEditingDescriptions ? (
              <EditableDescriptions
                items={localDescriptions}
                onUpdate={handleDescriptionsUpdate}
                bulletSize={bulletSize}
                fontSize={descriptionFontSize}
                columns={descriptionColumns}
                isEditing={true}
              />
            ) : data.descriptions && descriptionItems.length > 0 ? (
              <ul className="flex-grow list-none m-0 p-0 space-y-0.5">
                {descriptionItems.map((item, index) => (
                  <li key={index} className="flex items-start gap-1.5">
                    <span
                      className="rounded-full bg-gray-500 flex-shrink-0"
                      style={{
                        width: `${bulletSize}px`,
                        height: `${bulletSize}px`,
                        marginTop: `${(descriptionFontSize * 1.4 - bulletSize) / 2}px`,
                      }}
                    />
                    <span
                      className="text-gray-700 leading-snug break-words whitespace-pre-wrap"
                      style={{
                        fontSize: `${descriptionFontSize}px`,
                        lineHeight: "1.4",
                      }}
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex-grow flex items-center justify-center text-gray-400 text-sm italic">
                No descriptions available
              </div>
            )}
          </CardContent>
        </Card>

        <div
          className="nodrag absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-6 bg-blue-500 border border-white rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-ew-resize z-20 shadow-lg hover:bg-blue-600"
          onMouseDown={(e) => handleResizeStart(e, "w")}
          onPointerDown={(e) => e.stopPropagation()}
          title="Resize width from left"
        />
        <div
          className="nodrag absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-6 bg-blue-500 border border-white rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-ew-resize z-20 shadow-lg hover:bg-blue-600"
          onMouseDown={(e) => handleResizeStart(e, "e")}
          onPointerDown={(e) => e.stopPropagation()}
          title="Resize width from right"
        />
        <div
          className="nodrag absolute left-1/2 -translate-x-1/2 -top-1 w-6 h-2 bg-blue-500 border border-white rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-ns-resize z-20 shadow-lg hover:bg-blue-600"
          onMouseDown={(e) => handleResizeStart(e, "n")}
          onPointerDown={(e) => e.stopPropagation()}
          title="Resize height from top"
        />
        <div
          className="nodrag absolute left-1/2 -translate-x-1/2 -bottom-1 w-6 h-2 bg-blue-500 border border-white rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-ns-resize z-20 shadow-lg hover:bg-blue-600"
          onMouseDown={(e) => handleResizeStart(e, "s")}
          onPointerDown={(e) => e.stopPropagation()}
          title="Resize height from bottom"
        />
      </div>

      <IncidentSheet
        isOpen={isIncidentSheetOpen}
        onClose={() => setIsIncidentSheetOpen(false)}
        nodeTitle={data.title}
        aitId={data.subtext}
        transactionId={searchParams?.transactionId}
      />
    </>
  )
}

export default memo(CustomNodeUsWires)
