"use client"

import type React from "react"
import { memo, useMemo, useState, useRef, useCallback, useEffect } from "react"
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { IncidentSheet } from "@/domains/payment-health/components/sheets/incident-sheet" // Fixed import path for IncidentSheet
import { Server } from "lucide-react"

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

import type { CustomNodeData } from "@/types/custom-node-data" // Import CustomNodeData
import { useNodeResizePersistence } from "@/domains/payment-health/hooks/use-node-resize-persistence"

const RESIZE_CONSTRAINTS = {
  minWidth: 150,
  minHeight: 80,
  maxWidth: 400,
  maxHeight: 200,
}

const CustomNodeUsWires = ({
  data,
  id,
  onHideSearch,
}: NodeProps<Node<CustomNodeData>> & { onHideSearch: () => void }) => {
  const [dimensions, setDimensions] = useState({
    width: 220,
    height: 110,
  })
  const [isResizing, setIsResizing] = useState(false)
  const [activeHandle, setActiveHandle] = useState<"nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w" | null>(null)
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 })
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
    (e: React.MouseEvent, handle: "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w") => {
      e.stopPropagation()
      e.preventDefault()
      // Prevent React Flow from capturing this event
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

        // Calculate new dimensions based on handle position
        if (activeHandle.includes("e")) {
          newWidth = resizeStartRef.current.width + deltaX
        } else if (activeHandle.includes("w")) {
          newWidth = resizeStartRef.current.width - deltaX
        }

        if (activeHandle.includes("s")) {
          newHeight = resizeStartRef.current.height + deltaY
        } else if (activeHandle.includes("n")) {
          newHeight = resizeStartRef.current.height - deltaY
        }

        // Apply constraints
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

    // Queue with current position (x, y) - for now using 0, 0 as React Flow manages position
    const queueDimensions = (width: number, height: number, x: number, y: number) => {
      console.log("[v0] Dimensions queued after resize")
    }

    if (queueDimensions) {
      queueDimensions(dimensions.width, dimensions.height, 0, 0)
    } else {
      console.warn("[v0] queueDimensions function not available")
    }
  }, [isResizing, dimensions])

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
  const buttonHeight = Math.max(24, Math.min(32, dimensions.height / 4))

  const { loadDimensions } = useNodeResizePersistence({
    nodeId: id,
    onConflict: (serverVersion, clientVersion) => {
      console.warn(`[v0] Dimension conflict for node ${id}. Server: ${serverVersion}, Client: ${clientVersion}`)
      // Optionally reload dimensions from server
      loadDimensions().then((dims) => {
        if (dims) {
          setDimensions({ width: dims.width, height: dims.height })
        }
      })
    },
  })

  useEffect(() => {
    loadDimensions().then((dims) => {
      if (dims) {
        console.log("[v0] Loaded saved dimensions for node:", id, dims)
        setDimensions({ width: dims.width, height: dims.height })
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
      document.body.style.cursor = getCursorStyle(activeHandle)
      document.body.style.userSelect = "none"

      return () => {
        document.removeEventListener("mousemove", handleResizeMove)
        document.removeEventListener("mouseup", handleResizeEnd)
        document.body.style.cursor = "default"
        document.body.style.userSelect = "auto"
      }
    }
  }, [isResizing, handleResizeMove, handleResizeEnd, activeHandle])

  const getCursorStyle = (handle: "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w" | null) => {
    if (!handle) return "default"
    const cursors: Record<"nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w", string> = {
      nw: "nwse-resize",
      ne: "nesw-resize",
      sw: "nesw-resize",
      se: "nwse-resize",
      n: "ns-resize",
      s: "ns-resize",
      e: "ew-resize",
      w: "ew-resize",
    }
    return cursors[handle]
  }

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
    // TODO: Implement add node logic
  }

  const handleDeleteNode = () => {
    console.log("[v0] Delete node clicked for:", id)
    // TODO: Implement delete node logic
  }

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

          <CardHeader className="p-3 pb-2 space-y-0">
            {/* Title row with server icon and signal strength */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-gray-700 flex-shrink-0" />
                <CardTitle
                  className="font-bold whitespace-nowrap overflow-hidden text-ellipsis"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {data.title}
                </CardTitle>
              </div>
              {/* Signal strength indicator */}
              <div className="flex gap-0.5 items-end">
                {[1, 2, 3, 4].map((bar) => (
                  <div
                    key={bar}
                    className={`w-1.5 rounded-sm ${
                      trafficStatusColor === "green"
                        ? "bg-green-500"
                        : trafficStatusColor === "red"
                          ? "bg-red-500"
                          : "bg-gray-400"
                    }`}
                    style={{ height: `${bar * 2.5 + 3}px` }}
                  />
                ))}
              </div>
            </div>

            {/* ATM number - directly below title */}
            <p className="text-muted-foreground text-xs mb-2" style={{ fontSize: `${fontSize * 0.85}px` }}>
              {data.subtext}
            </p>

            <div className="border-b border-gray-200 mb-2" />
          </CardHeader>

          <CardContent className="p-3 pt-0">
            <div className="flex gap-1.5 transition-all duration-200">
              {!isAuthorized ? (
                <>
                  <LoadingButton
                    isLoading={inLoadingMode}
                    loadingText="..."
                    variant="outline"
                    style={{ height: `${buttonHeight}px`, fontSize: `${fontSize * 0.83}px` }}
                    className={`min-w-0 flex-1 px-2 font-medium shadow-sm rounded-md border transition-all duration-200 ${
                      inResultsMode && isMatched
                        ? "border-blue-500 bg-blue-500 text-white hover:bg-blue-600 hover:border-blue-600"
                        : inResultsMode && !isMatched
                          ? "cursor-not-allowed border-gray-300 bg-gray-100 text-gray-400"
                          : "border-blue-500 bg-blue-500 text-white hover:bg-blue-600 hover:border-blue-600"
                    }`}
                    disabled={!isMatched}
                  >
                    Summary
                  </LoadingButton>
                  <LoadingButton
                    isLoading={true}
                    loadingText="..."
                    variant="outline"
                    style={{ height: `${buttonHeight}px`, fontSize: `${fontSize * 0.83}px` }}
                    className={`min-w-0 flex-1 px-2 font-medium shadow-sm rounded-md border transition-all duration-200 ${
                      inResultsMode && isMatched
                        ? "border-blue-500 bg-blue-500 text-white hover:bg-blue-600 hover:border-blue-600"
                        : inResultsMode && !isMatched
                          ? "cursor-not-allowed border-gray-300 bg-gray-100 text-gray-400"
                          : "border-blue-500 bg-blue-500 text-white hover:bg-blue-600 hover:border-blue-600"
                    }`}
                    onClick={inResultsMode && isMatched ? handleDetailsClick : undefined}
                    disabled={!isMatched || isDetailsLoading}
                  >
                    Details
                  </LoadingButton>
                </>
              ) : (
                <>
                  {inDefaultMode && (
                    <>
                      <LoadingButton
                        isLoading={isFetching}
                        loadingText="..."
                        variant="outline"
                        style={{ height: `${buttonHeight}px`, fontSize: `${fontSize * 0.83}px` }}
                        className={`min-w-0 flex-1 px-2 text-white shadow-sm rounded-md border-0 transition-all duration-200 ${
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
                        style={{ height: `${buttonHeight}px`, fontSize: `${fontSize * 0.83}px` }}
                        className={`min-w-0 flex-1 px-2 text-white shadow-sm rounded-md border-0 transition-all duration-200 ${
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
                        style={{ height: `${buttonHeight}px`, fontSize: `${fontSize * 0.83}px` }}
                        className="min-w-0 flex-1 px-2 font-medium text-white shadow-sm rounded-md border-0 bg-slate-500 hover:bg-slate-600 hover:scale-105 transition-all duration-200"
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
                        style={{ height: `${buttonHeight}px`, fontSize: `${fontSize * 0.83}px` }}
                        aria-label="Trigger Summary Action"
                        className="flex flex-1 items-center justify-center border-blue-500 bg-blue-500 px-2 font-medium text-white shadow-sm rounded-md hover:bg-blue-600 transition-all duration-200"
                      >
                        Summary
                      </LoadingButton>
                      <LoadingButton
                        isLoading={true}
                        loadingText="..."
                        variant="outline"
                        style={{ height: `${buttonHeight}px`, fontSize: `${fontSize * 0.83}px` }}
                        aria-label="Trigger Details Action"
                        className="flex flex-1 items-center justify-center border-blue-500 bg-blue-500 px-2 font-medium text-white shadow-sm rounded-md hover:bg-blue-600 transition-all duration-200"
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
                        style={{ height: `${buttonHeight}px`, fontSize: `${fontSize * 0.83}px` }}
                        aria-label="Trigger Summary Action"
                        className={`min-w-0 flex-1 px-2 font-medium shadow-sm rounded-md border transition-all duration-200 ${
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
                        style={{ height: `${buttonHeight}px`, fontSize: `${fontSize * 0.83}px` }}
                        aria-label="Trigger Summary Action"
                        className={`min-w-0 flex-1 px-2 font-medium shadow-sm rounded-md border transition-all duration-200 ${
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
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Corner handles */}
        <div
          className="nodrag absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-nwse-resize z-20 shadow-lg hover:scale-125 hover:bg-blue-600"
          onMouseDown={(e) => handleResizeStart(e, "nw")}
          onPointerDown={(e) => e.stopPropagation()}
          title="Resize from top-left corner"
        />
        <div
          className="nodrag absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-nesw-resize z-20 shadow-lg hover:scale-125 hover:bg-blue-600"
          onMouseDown={(e) => handleResizeStart(e, "ne")}
          onPointerDown={(e) => e.stopPropagation()}
          title="Resize from top-right corner"
        />
        <div
          className="nodrag absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-nesw-resize z-20 shadow-lg hover:scale-125 hover:bg-blue-600"
          onMouseDown={(e) => handleResizeStart(e, "sw")}
          onPointerDown={(e) => e.stopPropagation()}
          title="Resize from bottom-left corner"
        />
        <div
          className="nodrag absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-nwse-resize z-20 shadow-lg hover:scale-125 hover:bg-blue-600"
          onMouseDown={(e) => handleResizeStart(e, "se")}
          onPointerDown={(e) => e.stopPropagation()}
          title="Resize from bottom-right corner"
        />

        {/* Edge handles */}
        <div
          className="nodrag absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-2 bg-blue-500 border border-white rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-ns-resize z-20 shadow-lg hover:bg-blue-600"
          onMouseDown={(e) => handleResizeStart(e, "n")}
          onPointerDown={(e) => e.stopPropagation()}
          title="Resize height from top"
        />
        <div
          className="nodrag absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-2 bg-blue-500 border border-white rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-ns-resize z-20 shadow-lg hover:bg-blue-600"
          onMouseDown={(e) => handleResizeStart(e, "s")}
          onPointerDown={(e) => e.stopPropagation()}
          title="Resize height from bottom"
        />
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
