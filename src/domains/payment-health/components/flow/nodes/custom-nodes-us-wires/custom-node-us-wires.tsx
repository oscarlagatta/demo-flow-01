"use client"

import type React from "react"
import { memo, useMemo, useState, useRef, useCallback, useEffect } from "react"
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { IncidentSheet } from "@/domains/payment-health/components/sheets/incident-sheet"
import { Clock } from "lucide-react"

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

import type { CustomNodeData } from "@/types/custom-node-data"
import { useNodeResizePersistence } from "@/domains/payment-health/hooks/use-node-resize-persistence"
import { getNodeIcon, getNodeIconColor, type NodeCategory } from "@/domains/payment-health/utils/node-icon-mapping"

const RESIZE_CONSTRAINTS = {
  minWidth: 150,
  maxWidth: 400,
}

const CustomNodeUsWires = ({
  data,
  id,
  onHideSearch,
}: NodeProps<Node<CustomNodeData>> & { onHideSearch: () => void }) => {
  const [dimensions, setDimensions] = useState({
    width: 220,
  })
  const [isResizing, setIsResizing] = useState(false)
  const [activeHandle, setActiveHandle] = useState<"e" | "w" | null>(null)
  const resizeStartRef = useRef({ x: 0, width: 0 })
  const nodeRef = useRef<HTMLDivElement>(null)

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
    (e: React.MouseEvent, handle: "e" | "w") => {
      e.stopPropagation()
      e.preventDefault()
      e.nativeEvent.stopImmediatePropagation()

      setIsResizing(true)
      setActiveHandle(handle)
      resizeStartRef.current = {
        x: e.clientX,
        width: dimensions.width,
      }
    },
    [dimensions],
  )

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !activeHandle) return

      requestAnimationFrame(() => {
        const deltaX = e.clientX - resizeStartRef.current.x

        let newWidth = resizeStartRef.current.width

        if (activeHandle === "e") {
          newWidth = resizeStartRef.current.width + deltaX
        } else if (activeHandle === "w") {
          newWidth = resizeStartRef.current.width - deltaX
        }

        // Apply width constraints only
        newWidth = Math.max(RESIZE_CONSTRAINTS.minWidth, Math.min(RESIZE_CONSTRAINTS.maxWidth, newWidth))

        setDimensions({ width: newWidth })
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
  const buttonHeight = 32 // Fixed button height for consistency

  const { loadDimensions } = useNodeResizePersistence({
    nodeId: id,
    onConflict: (serverVersion, clientVersion) => {
      loadDimensions().then((dims) => {
        if (dims) {
          setDimensions({ width: dims.width })
        }
      })
    },
  })

  useEffect(() => {
    loadDimensions().then((dims) => {
      if (dims) {
        setDimensions({ width: dims.width })
      }
    })
  }, [id, loadDimensions])

  useEffect(() => {
    const errorHandler = (e: ErrorEvent) => {
      if (e.message.includes("ResizeObserver loop")) {
        e.stopImmediatePropagation()
      }
    }
    window.addEventListener("error", errorHandler)

    return () => {
      window.removeEventListener("error", errorHandler)
    }
  }, [])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleResizeMove)
      document.addEventListener("mouseup", handleResizeEnd)
      document.body.style.cursor = activeHandle === "e" || activeHandle === "w" ? "ew-resize" : "default"
      document.body.style.userSelect = "none"

      return () => {
        document.removeEventListener("mousemove", handleResizeMove)
        document.removeEventListener("mouseup", handleResizeEnd)
        document.body.style.cursor = "default"
        document.body.style.userSelect = "auto"
      }
    }
  }, [isResizing, handleResizeMove, handleResizeEnd, activeHandle])

  const handleClick = () => {
    if (data.onClick && id && !isLoading && !isResizing) {
      data.onClick(id)
    }
  }

  const triggerAction = (action: "flow" | "trend" | "balanced") => {
    if (!isLoading && !isFetching && aitNum && data.onActionClick) {
      data.onActionClick(aitNum, action)
    }
    onHideSearch()
  }

  const handleAddNode = () => {
    console.log("[v0] Add node clicked for:", id)
  }

  const handleDeleteNode = () => {
    console.log("[v0] Delete node clicked for:", id)
  }

  const NodeIcon = useMemo(() => {
    if (data.icon) {
      // If icon is directly provided in data, use it
      if (typeof data.icon === "string") {
        // If it's a string, treat it as a category and map it with section context
        return getNodeIcon(data.icon as NodeCategory, data.parentId)
      }
      // Otherwise it's already a Lucide icon component
      return data.icon
    }
    // Fall back to automatic mapping based on section only
    return getNodeIcon(undefined, data.parentId)
  }, [data.icon, data.parentId])

  const iconColorClass = useMemo(() => {
    if (data.iconColor) {
      return data.iconColor
    }
    // Auto-determine color based on category or section
    const category = data.icon && typeof data.icon === "string" ? (data.icon as NodeCategory) : undefined
    return getNodeIconColor(category, data.parentId)
  }, [data.icon, data.iconColor, data.parentId])

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
      <div ref={nodeRef} className="relative group" style={{ width: dimensions.width }}>
        {data.isSelected && (
          <NodeToolbar onAddNode={handleAddNode} onCreateIncident={handleCreateIncident} onDelete={handleDeleteNode} />
        )}

        <Card
          className={getCardClassName()}
          style={{ width: "100%" }}
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

          <CardContent className="p-2 pt-1.5 flex flex-col justify-between min-h-[80px]">
            <div className="flex flex-col justify-center gap-1.5 mb-auto">
              <div className="flex items-start gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-700 flex-shrink-0 mt-1" />
                <span
                  className="text-gray-700 font-medium leading-tight"
                  style={{ fontSize: `${Math.max(11, fontSize * 0.9)}px` }}
                >
                  Fraud Scoring
                </span>
              </div>
              <div className="flex items-start gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-700 flex-shrink-0 mt-1" />
                <span
                  className="text-gray-700 font-medium leading-tight"
                  style={{ fontSize: `${Math.max(11, fontSize * 0.9)}px` }}
                >
                  Case Management
                </span>
              </div>
            </div>

            <div className="flex gap-1.5 mt-2">
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
                    className={`min-w-0 flex-1 px-2 font-semibold shadow-sm rounded-full border-0 transition-all duration-200 ${
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
                    className={`min-w-0 flex-1 px-2 font-semibold shadow-sm rounded-full border-0 transition-all duration-200 ${
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
                    className="min-w-0 flex-1 px-2 font-semibold shadow-sm rounded-full border-0 bg-gray-400 hover:bg-gray-500 transition-all duration-200"
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
                    className="flex flex-1 items-center justify-center border-blue-500 bg-blue-500 px-2 font-semibold shadow-sm rounded-full hover:bg-blue-600 transition-all duration-200"
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
                    className="flex flex-1 items-center justify-center border-blue-500 bg-blue-500 px-2 font-semibold shadow-sm rounded-full hover:bg-blue-600 transition-all duration-200"
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
                    className={`min-w-0 flex-1 px-2 font-semibold shadow-sm rounded-full border transition-all duration-200 ${
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
                    className={`min-w-0 flex-1 px-2 font-semibold shadow-sm rounded-full border transition-all duration-200 ${
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
