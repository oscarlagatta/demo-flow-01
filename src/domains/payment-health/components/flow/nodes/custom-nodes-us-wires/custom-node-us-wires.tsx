"use client"

import type React from "react"
import { memo, useMemo, useState, useRef, useCallback, useEffect } from "react"
import { Handle, Position, type NodeProps, type Node, useUpdateNodeInternals, useReactFlow } from "@xyflow/react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { IncidentSheet } from "@/domains/payment-health/components/sheets/incident-sheet"
import { Clock } from 'lucide-react'
import { toast } from "sonner"

import { useGetSplunkUsWires } from "@/domains/payment-health/hooks/use-get-splunk-us-wires/use-get-splunk-us-wires"
import { useTransactionSearchUsWiresContext } from "@/domains/payment-health/providers/us-wires/us-wires-transaction-search-provider"
import {
  computeTrafficStatusColors,
  getTrafficStatusColorClass,
  type TrafficStatusColor,
} from "../../../../utils/traffic-status-utils"
import { computeTrendColors, getTrendColorClass, type TrendColor } from "../../../../utils/trend-color-utils"
import { LoadingButton } from "../../../loading/loading-button"
import { CardLoadingSkeleton } from "../../../loading/loading-skeleton"

import { NodeToolbar } from "./node-toolbar"
import { NodeSaveToolbar } from "./node-save-toolbar"
import { PositionDisplayOverlay } from "./position-display-overlay"

import type { CustomNodeData } from "@/types/custom-node-data"
import { useNodeResizePersistence } from "@/domains/payment-health/hooks/use-node-resize-persistence"
import { getNodeIcon, getNodeIconColor, type NodeCategory } from "@/domains/payment-health/utils/node-icon-mapping"
import { useNodePosition } from "@/domains/payment-health/hooks/use-node-position"
import { useRegionWireFlowPresenter } from "@/domains/payment-health/hooks/use-region-wire-flow-presenter"
import type { E2ERegionWireFlowModel } from "@bofa/data-services"

const RESIZE_CONSTRAINTS = {
  minWidth: 150,
  maxWidth: 400,
  minHeight: 100,
  maxHeight: 600,
}

const buildRegionWireFlowModel = (
  node: Node<CustomNodeData>,
  currentPosition: { x: number; y: number; width: number; height: number } | null,
  connectedEdges: any[]
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

  return {
    id: node.id ? Number.parseInt(node.id, 10) : undefined,
    region: "US", // Default region, could be extracted from data if available
    area: node.data.parentId?.replace("bg-", "") || null, // Extract area from parent section
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
  onHideSearch,
}: NodeProps<Node<CustomNodeData>> & { onHideSearch: () => void }) => {
  const updateNodeInternals = useUpdateNodeInternals()
  const { getNode, getEdges } = useReactFlow()
  
  const { handleUpdateRegionWireFlow } = useRegionWireFlowPresenter()
  const [isSavingNode, setIsSavingNode] = useState(false)
  
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


  const handleSaveNode = useCallback(async () => {
    try {
      setIsSavingNode(true)
      
      // Get current node data
      const currentNode = getNode(id)
      if (!currentNode) {
        throw new Error("Node not found")
      }

      // Get current position
      const positionData = getCurrentPosition()
      
      // Get all edges connected to this node
      const allEdges = getEdges()
      const connectedEdges = allEdges.filter(
        (edge) => edge.source === id || edge.target === id
      )

      // Build the E2ERegionWireFlowModel
      const regionWireFlowModel = buildRegionWireFlowModel(
        currentNode,
        positionData,
        connectedEdges
      )

      // Call the update handler
      await handleUpdateRegionWireFlow(regionWireFlowModel)

      toast.success("Node saved successfully!", {
        description: `${data.title} has been updated`,
      })
    } catch (error) {
      console.error("[v0] Failed to save node:", error)
      toast.error("Failed to save node", {
        description: error instanceof Error ? error.message : "Please try again",
      })
    } finally {
      setIsSavingNode(false)
    }
  }, [id, data.title, getNode, getEdges, getCurrentPosition, handleUpdateRegionWireFlow])


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
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => line.startsWith('-') ? line.substring(1).trim() : line)
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
      setLivePosition(prev => ({
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
      const cursor = activeHandle === "e" || activeHandle === "w" ? "ew-resize" : activeHandle === "n" || activeHandle === "s" ? "ns-resize" : "default"
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
      if (e.message.includes('ResizeObserver loop')) {
        e.stopImmediatePropagation()
        e.preventDefault()
      }
    }
    window.addEventListener('error', errorHandler)
    return () => window.removeEventListener('error', errorHandler)
  }, [])

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

        <NodeSaveToolbar onSave={handleSaveNode} isSaving={isSavingNode} />

        {data.isSelected && (
          <NodeToolbar onAddNode={handleAddNode} onCreateIncident={handleCreateIncident} onDelete={handleDeleteNode} />
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
            {data.descriptions && descriptionItems.length > 0 ? (
              <div 
                className={`flex-grow pl-2 grid gap-x-4 gap-y-2 ${
                  descriptionColumns === 3 ? 'grid-cols-3' : 
                  descriptionColumns === 2 ? 'grid-cols-2' : 
                  'grid-cols-1'
                }`}
              >
                {descriptionItems.map((item, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div 
                      className="rounded-full bg-gray-700 flex-shrink-0 mt-1" 
                      style={{ 
                        width: `${bulletSize}px`, 
                        height: `${bulletSize}px` 
                      }}
                    />
                    <span
                      className="text-gray-700 font-medium leading-snug"
                      style={{ fontSize: `${descriptionFontSize}px` }}
                    >
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col justify-center items-center gap-1.5 flex-grow py-2">
                <span
                  className="text-gray-500 text-center italic leading-tight"
                  style={{ fontSize: `${Math.max(10, fontSize * 0.85)}px` }}
                >
                  {aitNum 
                    ? `No data available for this AIT (${aitNum})`
                    : 'No data available for this node'
                  }
                </span>
              </div>
            )}

            <div className="flex gap-1.5 mt-auto w-full">
              {inDefaultMode && (
                <>
                  <LoadingButton
                    isLoading={isFetching}
                    loadingText="..."
                    variant="outline"
                    style={{
                      height: `${buttonHeight}px`,
                      fontSize: `${Math.max(11, fontSize * 0.9)}px`,
                    }}
                    className={`flex-1 px-2 font-semibold shadow-sm rounded-full border-0 transition-all duration-200 ${
                      isError ? "bg-gray-400 hover:bg-gray-500" : `${trafficStatusColorClass} hover:opacity-90`
                    }`}
                    onClick={(e) => {
                      e.stopPropagation()
                      triggerAction("flow")
                    }}
                    disabled={trafficStatusColorClass === "bg-gray-400"}
                  >
                    Flow
                  </LoadingButton>
                  <LoadingButton
                    isLoading={isFetching}
                    loadingText="..."
                    variant="outline"
                    style={{
                      height: `${buttonHeight}px`,
                      fontSize: `${Math.max(11, fontSize * 0.9)}px`,
                    }}
                    className={`flex-1 px-2 font-semibold shadow-sm rounded-full border-0 transition-all duration-200 ${
                      isError ? "bg-gray-400 hover:bg-gray-500" : `${trendColorClass} hover:opacity-90`
                    }`}
                    onClick={(e) => {
                      e.stopPropagation()
                      triggerAction("trend")
                    }}
                    disabled={trendColorClass === "bg-gray-400"}
                  >
                    Trend
                  </LoadingButton>
                  <LoadingButton
                    isLoading={isFetching}
                    loadingText="..."
                    variant="outline"
                    style={{
                      height: `${buttonHeight}px`,
                      fontSize: `${Math.max(11, fontSize * 0.9)}px`,
                    }}
                    className="flex-1 px-2 font-semibold shadow-sm rounded-full border-0 bg-gray-400 hover:bg-gray-500 transition-all duration-200"
                    onClick={(e) => {
                      e.stopPropagation()
                      triggerAction("balanced")
                    }}
                    disabled={trendColorClass === "bg-gray-400"}
                  >
                    Balanced
                  </LoadingButton>
                </>
              )}

              {inLoadingMode && (
                <>
                  <LoadingButton
                    isLoading={true}
                    loadingText="..."
                    variant="outline"
                    style={{
                      height: `${buttonHeight}px`,
                      fontSize: `${Math.max(11, fontSize * 0.9)}px`,
                    }}
                    aria-label="Trigger Summary Action"
                    className="flex-1 items-center justify-center border-blue-500 bg-blue-500 px-2 font-semibold shadow-sm rounded-full hover:bg-blue-600 transition-all duration-200"
                  >
                    Summary
                  </LoadingButton>
                  <LoadingButton
                    isLoading={true}
                    loadingText="..."
                    variant="outline"
                    style={{
                      height: `${buttonHeight}px`,
                      fontSize: `${Math.max(11, fontSize * 0.9)}px`,
                    }}
                    aria-label="Trigger Details Action"
                    className="flex-1 items-center justify-center border-blue-500 bg-blue-500 px-2 font-semibold shadow-sm rounded-full hover:bg-blue-600 transition-all duration-200"
                  >
                    Details
                  </LoadingButton>
                </>
              )}

              {inResultsMode && (
                <>
                  <LoadingButton
                    isLoading={false}
                    loadingText="..."
                    variant="outline"
                    style={{
                      height: `${buttonHeight}px`,
                      fontSize: `${Math.max(11, fontSize * 0.9)}px`,
                    }}
                    aria-label="Trigger Summary Action"
                    className={`flex-1 px-2 font-semibold shadow-sm rounded-full border transition-all duration-200 ${
                      isMatched
                        ? "border-blue-500 bg-blue-500 text-white hover:bg-blue-600 hover:border-blue-600"
                        : "cursor-not-allowed border-gray-300 bg-gray-100 text-gray-400"
                    }`}
                    disabled={!isMatched}
                  >
                    Summary
                  </LoadingButton>
                  <LoadingButton
                    isLoading={false}
                    loadingText="..."
                    variant="outline"
                    style={{
                      height: `${buttonHeight}px`,
                      fontSize: `${Math.max(11, fontSize * 0.9)}px`,
                    }}
                    aria-label="Trigger Summary Action"
                    className={`flex-1 px-2 font-semibold shadow-sm rounded-full border transition-all duration-200 ${
                      isMatched
                        ? "border-blue-500 bg-blue-500 text-white hover:bg-blue-600 hover:border-blue-600"
                        : "cursor-not-allowed border-gray-300 bg-gray-100 text-gray-400"
                    }`}
                    onClick={isMatched ? handleDetailsClick : undefined}
                    disabled={!isMatched || isDetailsLoading}
                  >
                    Details
                  </LoadingButton>
                </>
              )}
            </div>
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
