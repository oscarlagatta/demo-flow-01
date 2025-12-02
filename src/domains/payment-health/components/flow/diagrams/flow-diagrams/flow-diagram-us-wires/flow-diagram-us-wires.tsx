"use client"
import { type ReactNode, useCallback, useEffect, useMemo, useState, useRef } from "react"
import type React from "react"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  addEdge,
  Background,
  Controls,
  type Node,
  type NodeTypes,
  type OnConnect,
  ReactFlow,
  ReactFlowProvider,
  useStore,
  useReactFlow,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { AlertCircle, Loader2, RefreshCw, Save, Check } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { initialEdges, initialNodes } from "@/domains/payment-health/assets/flow-data-us-wires/flow-data-use-wires"
import { useGetSplunkUsWires } from "@/domains/payment-health/hooks/use-get-splunk-us-wires/use-get-splunk-us-wires"
import { useGetAverageProcessingTimes } from "@/domains/payment-health/hooks/use-get-splunk-us-wires/use-get-average-processing-times"
import { useTransactionSearchUsWiresContext } from "@/domains/payment-health/providers/us-wires/us-wires-transaction-search-provider"
import { computeTrafficStatusColors } from "@/domains/payment-health/utils/traffic-status-utils"
import PaymentSearchBoxUsWires from "@/domains/payment-health/components/search/payment-search-box-us-wires/payment-search-box-us-wires"
import SplunkTableUsWires from "@/domains/payment-health/components/tables/splunk-table-us-wires/splunk-table-us-wires"
import { TransactionDetailsTableAgGrid } from "@/domains/payment-health/components/tables/transaction-details-table-ag-grid/transaction-details-table-ag-grid"
import CustomNodeUsWires from "@/domains/payment-health/components/flow/nodes/custom-nodes-us-wires/custom-node-us-wires"
import SectionBackgroundNode from "@/domains/payment-health/components/flow/nodes/expandable-charts/section-background-node"
import { AnimatedInfoSection } from "../../../../indicators/info-section/animated-info-section"
import { useEdgeRemovalManager } from "@/domains/payment-health/hooks/use-edge-removal-manager"
import { buildRegionWireFlowModel } from "@/domains/payment-health/components/flow/nodes/custom-nodes-us-wires/custom-node-us-wires"
import { useRegionWireFlowPresenter } from "@/domains/payment-health/hooks/use-region-wire-flow-presenter"
import { useNodesState } from "@/domains/payment-health/hooks/use-nodes-state"
import { useEdgesState } from "@/domains/payment-health/hooks/use-edges-state"

const SECTION_IDS = ["bg-origination", "bg-validation", "bg-middleware", "bg-processing"]

const sectionDurations = {
  "bg-origination": 1.2,
  "bg-validation": 2.8,
  "bg-middleware": 1.9,
  "bg-processing": 3.4,
}

const SECTION_WIDTH_PROPORTIONS = [0.2, 0.2, 0.25, 0.35]
const GAP_WIDTH = 16

type ActionType = "flow" | "trend" | "balanced"

// Custom Draggable Component that works with React 19
const DraggablePanel = ({
  children,
  onStart,
  onStop,
}: {
  children: ReactNode
  onStart?: () => void
  onStop?: () => void
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const elementRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      })
      onStart?.()
    },
    [position, onStart],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return

      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    },
    [isDragging, dragStart],
  )

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false)
      onStop?.()
    }
  }, [isDragging, onStop])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)

      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <div
      ref={elementRef}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        cursor: isDragging ? "grabbing" : "grab",
      }}
      onMouseDown={handleMouseDown}
    >
      {children}
    </div>
  )
}

const FlowDiagramUsWiresComponent = ({
  nodeTypes,
  onShowSearchBox,
  isMonitorMode,
}: {
  nodeTypes: NodeTypes
  onShowSearchBox: () => void
  isMonitorMode: boolean
}) => {
  // const { hasRequiredRole } = useAuthzRules();
  const { showTableView } = useTransactionSearchUsWiresContext()
  const { handleUpdateRegionWireFlow } = useRegionWireFlowPresenter()
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [connectedNodeIds, setConnectedNodeIds] = useState<Set<string>>(new Set())
  const [connectedEdgeIds, setConnectedEdgeIds] = useState<Set<string>>(new Set())
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null)
  const [lastRefetch, setLastRefetch] = useState<Date | null>(null)
  const [canvasHeight, setCanvasHeight] = useState<number>(500) // default height

  const [selectedNodes, setSelectedNodes] = useState<string[]>([])
  const [isBulkSaving, setIsBulkSaving] = useState(false)
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null)

  // Table mode state
  const [tableMode, setTableMode] = useState<{
    show: boolean
    aitNum: string | null
    action: ActionType | null
  }>({
    show: false,
    aitNum: null,
    action: null,
  })

  const { getNodes, getEdges, updateNode } = useReactFlow()
  const width = useStore((state) => state.width)
  const isAuthorized = true // hasRequiredRole();
  const {
    data: splunkData,
    isLoading,
    isError,
    refetch,
    isFetching,
    isSuccess,
  } = useGetSplunkUsWires({
    enabled: isAuthorized,
  })

  const {
    data: processingTimesData,
    isLoading: isLoadingProcessingTimes,
    refetch: refetchProcessingTimes,
  } = useGetAverageProcessingTimes({
    enabled: isAuthorized,
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const { trackEdgeRemoval, persistEdgeRemovals, removedEdgesCount } = useEdgeRemovalManager()

  const nodesWithUnsavedChanges = useMemo(() => {
    return nodes.filter((node) => node.data.hasUnsavedChanges === true).map((node) => node.id)
  }, [nodes])

  const handleBulkSave = useCallback(async () => {
    if (nodesWithUnsavedChanges.length === 0) return

    setIsBulkSaving(true)

    let successCount = 0
    let failedCount = 0

    try {
      // Get all nodes with unsaved changes
      const nodesToSave = nodes.filter((node) => nodesWithUnsavedChanges.includes(node.id))

      // Save all nodes using handleUpdateRegionWireFlow
      const savePromises = nodesToSave.map(async (node) => {
        try {
          const connectedEdges = edges.filter((edge) => edge.source === node.id || edge.target === node.id)

          const currentPosition = {
            x: node.position.x,
            y: node.position.y,
            width: (node as any).width || node.data.width || 180,
            height: (node as any).height || node.data.height || 90,
          }

          const model = buildRegionWireFlowModel(node, currentPosition, connectedEdges)

          await handleUpdateRegionWireFlow(model)

          // Clear the hasUnsavedChanges flag after successful save
          setNodes((nds) =>
            nds.map((n) => (n.id === node.id ? { ...n, data: { ...n.data, hasUnsavedChanges: false } } : n)),
          )

          successCount++
          return { nodeId: node.id, success: true }
        } catch (error) {
          failedCount++
          return { nodeId: node.id, success: false, error }
        }
      })

      await Promise.allSettled(savePromises)

      // Update last save time
      setLastSaveTime(new Date())

      // Show toast notification with results
      if (failedCount === 0) {
        toast.success("All Changes Saved", {
          description: `Successfully saved ${successCount} node${successCount > 1 ? "s" : ""}`,
          icon: <Check className="h-4 w-4 text-green-500" />,
        })
      } else if (successCount > 0) {
        toast.warning("Partial Save Complete", {
          description: `Saved ${successCount} of ${nodesWithUnsavedChanges.length} nodes. ${failedCount} failed.`,
          icon: <AlertCircle className="h-4 w-4 text-orange-500" />,
        })
      } else {
        toast.error("Save Failed", {
          description: `Failed to save all ${nodesWithUnsavedChanges.length} nodes`,
          icon: <AlertCircle className="h-4 w-4 text-red-500" />,
        })
      }
    } catch (error) {
      toast.error("Save Failed", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      })
    } finally {
      setIsBulkSaving(false)
    }
  }, [nodesWithUnsavedChanges, nodes, edges, handleUpdateRegionWireFlow, setNodes])

  const handleSave = handleBulkSave

  const onSelectionChange = useCallback(({ nodes: selectedNodesList }: { nodes: Node[] }) => {
    const selectedIds = selectedNodesList.map((node) => node.id)
    setSelectedNodes(selectedIds)
    console.log("[v0] Selected nodes:", selectedIds)
  }, [])

  const handleRefetch = async () => {
    try {
      await Promise.all([refetch(), refetchProcessingTimes()])
      setLastRefetch(new Date())
      toast.success("Data successfully refreshed!", {
        description: "The latest data has been loaded",
        icon: <RefreshCw className="h-4 w-4 text-green-500" />,
      })
    } catch (error) {
      console.error("Refetch failed:", error)
      toast.error("Failed to refresh data.", {
        description: "Please check your connection and try again.",
      })
    }
  }

  // Function to find connected nodes and edges
  const findConnections = useCallback(
    (nodeId: string) => {
      const connectedNodes = new Set<string>()
      const connectedEdges = new Set<string>()
      edges.forEach((edge) => {
        if (edge.source === nodeId || edge.target === nodeId) {
          connectedEdges.add(edge.id)
          if (edge.source === nodeId) {
            connectedNodes.add(edge.target)
          }
          if (edge.target === nodeId) {
            connectedNodes.add(edge.source)
          }
        }
      })
      return { connectedNodes, connectedEdges }
    },
    [edges],
  )
  // Handle node click
  const handleNodeClick = useCallback(
    (nodeId: string) => {
      if (isLoading || isFetching) return
      if (selectedNodeId === nodeId) {
        // clicking the same node deselects it
        setSelectedNodeId(null)
        setConnectedNodeIds(new Set())
        setConnectedEdgeIds(new Set())
      } else {
        // Select new node and find its connections
        const { connectedNodes, connectedEdges } = findConnections(nodeId)
        setSelectedNodeId(nodeId)
        setConnectedNodeIds(connectedNodes)
        setConnectedEdgeIds(connectedEdges)
      }
    },
    [selectedNodeId, findConnections, isLoading, isFetching],
  )
  const handleActionClick = useCallback((aitNum: string, action: ActionType) => {
    setTableMode({
      show: true,
      aitNum,
      action,
    })
  }, [])
  // Get connected systems names for display
  const getConnectedSystemNames = useCallback(() => {
    if (!selectedNodeId) {
      return []
    }
    return Array.from(connectedNodeIds)
      .map((nodeId) => {
        const node = nodes.find((n) => n.id === nodeId)
        return node?.data?.["title"] || nodeId
      })
      .sort()
  }, [selectedNodeId, connectedNodeIds, nodes])

  useEffect(() => {
    if (width > 0) {
      setNodes((currentNodes) => {
        const totalGapWidth = GAP_WIDTH * (SECTION_IDS.length - 1)
        const availableWidth = width - totalGapWidth
        let currentX = 0
        const newNodes = [...currentNodes]
        const sectionDimensions: Record<string, { x: number; width: number }> = {}
        // First pass: update background nodes and store their new dimensions
        for (let i = 0; i < SECTION_IDS.length; i++) {
          const sectionId = SECTION_IDS[i]
          const nodeIndex = newNodes.findIndex((n) => n.id === sectionId)
          if (nodeIndex !== -1) {
            const sectionWidth = availableWidth * SECTION_WIDTH_PROPORTIONS[i]
            sectionDimensions[sectionId] = { x: currentX, width: sectionWidth }
            newNodes[nodeIndex] = {
              ...newNodes[nodeIndex],
              position: { x: currentX, y: 0 },
              style: {
                ...newNodes[nodeIndex].style,
                width: `${sectionWidth}px`,
              },
            }
            currentX += sectionWidth + GAP_WIDTH
          }
        }
        // second pass: update child nodes based on their parent's new dimensions
        for (let i = 0; i < newNodes.length; i++) {
          const node = newNodes[i]
          if (node.parentId && sectionDimensions[node.parentId]) {
            const parentDimensions = sectionDimensions[node.parentId]
            const originalNode = initialNodes.find((n) => n.id === node.id)
            const originalParent = initialNodes.find((n) => n.id === node.parentId)
            if (originalNode && originalParent && originalParent.style?.width) {
              const originalParentWidth = Number.parseFloat(originalParent.style.width as string)
              const originalRelativeXOffset = originalNode.position.x - originalParent.position.x
              const newAbsoluteX =
                parentDimensions.x + (originalRelativeXOffset / originalParentWidth) * parentDimensions.width
              newNodes[i] = {
                ...node,
                position: {
                  x: newAbsoluteX,
                  y: node.position.y,
                },
              }
            }
          }
        }
        return newNodes
      })
    }
  }, [width])
  useEffect(() => {
    // calculate the bounding box of all nodes and adjust the canvas height
    const updateCanvasHeight = () => {
      if (nodes.length === 0) return
      let minY = Number.POSITIVE_INFINITY
      let maxY = Number.NEGATIVE_INFINITY
      nodes.forEach((node) => {
        const nodeY = node.position.y
        const nodeHeight = node.style?.height ? Number.parseFloat(node.style?.height as string) : 0
        minY = Math.min(minY, nodeY)
        maxY = Math.max(maxY, nodeY + nodeHeight)
      })
      const calculatedHeight = maxY - minY + 50
      setCanvasHeight(calculatedHeight)
    }
    updateCanvasHeight()
  }, [nodes])
  const onNodeDragStart = useCallback((_event: React.MouseEvent, node: Node) => {
    setDraggingNodeId(node.id)
  }, [])

  const onNodeDrag = useCallback((_event: React.MouseEvent, node: Node) => {
    // Update node position during drag
    setNodes((nds) =>
      nds.map((n) =>
        n.id === node.id ? { ...n, position: node.position, data: { ...n.data, position: node.position } } : n,
      ),
    )
  }, [])

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node, _nodes: Node[]) => {
      setDraggingNodeId(null)

      // Mark node as having unsaved changes
      setNodes((nds) => nds.map((n) => (n.id === node.id ? { ...n, data: { ...n.data, hasUnsavedChanges: true } } : n)))
    },
    [setNodes],
  )

  const onConnect: OnConnect = useCallback((connection) => setEdges((eds) => addEdge(connection, eds)), [setEdges])

  const nodesForFlow = useMemo(() => {
    return nodes.map((node) => {
      const isSelected = selectedNodeId === node.id
      const isConnected = connectedNodeIds.has(node.id)
      const isDimmed = selectedNodeId && !isSelected && !isConnected
      const isDragging = draggingNodeId === node.id

      let nodeData = {
        ...node.data,
        isSelected,
        isConnected,
        isDimmed,
        isDragging, // Pass drag state to node
        position: node.position, // Pass current position to node
        onClick: handleNodeClick,
        onActionClick: handleActionClick,
        isMonitorMode: isMonitorMode,
      }

      // Add processing time data for background nodes (sections)
      if (node.type === "background" && processingTimesData) {
        const processingTimeInfo = processingTimesData.find((pt) => pt.sectionId === node.id)
        if (processingTimeInfo) {
          nodeData = {
            ...nodeData,
            duration: processingTimeInfo.averageTime,
            trend: processingTimeInfo.trend,
          }
        }
      }

      if (node.parentId) {
        const { parentId, ...rest } = node
        return {
          ...rest,
          parentNode: parentId,
          data: nodeData,
        }
      }
      return {
        ...(node as Node),
        data: nodeData,
      }
    })
  }, [nodes, selectedNodeId, connectedNodeIds, handleNodeClick, handleActionClick, processingTimesData, isMonitorMode])

  const edgesForFlow = useMemo(() => {
    return edges.map((edge) => {
      const isConnected = connectedEdgeIds.has(edge.id)
      const isDimmed = selectedNodeId && !isConnected
      return {
        ...edge,
        style: {
          ...edge.style,
          strokeWidth: isConnected ? 3 : 2,
          stroke: isConnected ? "#1d4ed8" : isDimmed ? "#d1d5db" : "#6b7280",
          opacity: isDimmed ? 0.3 : 1,
        },
        animated: isConnected,
      }
    })
  }, [edges, connectedEdgeIds, selectedNodeId])
  const renderDataPanel = () => {
    if (isLoading || isLoadingProcessingTimes) {
      return (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            <span className="text-sm font-medium text-blue-600">Loading data...</span>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      )
    }
    if (isError) {
      return (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Error loading data</span>
          </div>
          <Button
            onClick={handleRefetch}
            size="sm"
            variant="outline"
            disabled={isFetching}
            className="w-full border-red-200 bg-transparent hover:border-red-300 hover:bg-red-50"
          >
            {isFetching ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-3 w-3" />
                Retry Connection
              </>
            )}
          </Button>
        </div>
      )
    }
    if (isSuccess && splunkData && processingTimesData) {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="mb-1 text-xs font-medium">Traffic Status Summary:</h4>
            <div className="flex items-center gap-1">
              {isFetching && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
              <Button
                onClick={handleRefetch}
                size="sm"
                variant="ghost"
                disabled={isFetching}
                className="h-5 w-5 p-0 hover:bg-blue-50"
                title="Refresh data"
              >
                <RefreshCw className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
          <div className="rounded bg-gray-50 p-2 text-xs">
            {Object.entries(computeTrafficStatusColors(splunkData)).map(([aitNum, color]) => (
              <div key={aitNum} className="flex justify-between">
                <span>AIT {aitNum}:</span>
                <span
                  className={`rounded px-1 text-white ${color === "green" ? "bg-green-500" : color === "red" ? "bg-red-500" : "bg-gray-400"}`}
                >
                  {color}
                </span>
              </div>
            ))}
          </div>
          <div>
            <h4 className="mb-1 text-xs font-medium">Raw Data (first 5 entries):</h4>
            <pre className="max-h-32 overflow-auto rounded bg-gray-50 p-2 text-xs">
              {JSON.stringify(splunkData.slice(0, 5), null, 2)}
            </pre>
          </div>
          <div>
            <h4 className="mb-1 text-xs font-medium">Average Processing Times:</h4>
            <pre className="max-h-32 overflow-auto rounded bg-gray-50 p-2 text-xs">
              {JSON.stringify(processingTimesData, null, 2)}
            </pre>
          </div>
        </div>
      )
    }
    return null
  }
  if (showTableView) {
    return <TransactionDetailsTableAgGrid />
  }
  return (
    <div className="relative h-full w-full" style={{ height: `${canvasHeight}px` }}>
      {/*If table mode is on, render the AG Grid and hide flow*/}
      {tableMode.show ? (
        <SplunkTableUsWires
          aitNum={tableMode.aitNum!}
          action={tableMode.action!}
          onBack={() => {
            setTableMode({
              show: false,
              aitNum: null,
              action: null,
            })
            onShowSearchBox()
          }}
        />
      ) : (
        <>
          {/* Refresh Data Button - Icon only, docked top-right */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            {lastRefetch && !isFetching && (
              <span className="text-muted-foreground text-xs">Data updated: {lastRefetch.toLocaleTimeString()}</span>
            )}

            {/* Refresh Button */}
            <Button
              onClick={handleRefetch}
              disabled={isFetching}
              variant="outline"
              size="sm"
              className="h-8 w-8 border-blue-200 bg-white p-0 shadow-sm hover:border-blue-300 hover:bg-blue-50"
              title="Refresh data"
              aria-label="Refresh data"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>

          <ReactFlow
            nodes={nodesForFlow}
            edges={edgesForFlow}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDragStart={onNodeDragStart}
            onNodeDrag={onNodeDrag}
            onNodeDragStop={onNodeDragStop}
            onSelectionChange={onSelectionChange}
            nodeTypes={nodeTypes}
            proOptions={{ hideAttribution: true }}
            className="bg-white"
            style={{ background: "#eeeff3ff" }}
            panOnDrag={false}
            elementsSelectable={true}
            multiSelectionKeyCode="Shift"
            minZoom={1}
            maxZoom={1}
          >
            <Controls />
            <Background gap={16} size={1} />
          </ReactFlow>

          {/* Connected System Panel */}
          {selectedNodeId && (
            <DraggablePanel
              onStart={() => {
                // Optional: Add any start drag logic
              }}
              onStop={() => {
                // Optional: Add any stop drag logic
              }}
            >
              <div className="absolute top-4 left-4 z-10 max-w-sm rounded-lg border bg-white p-4 shadow-lg">
                <h3 className="mb-2 text-sm font-semibold text-gray-800">
                  Selected System:{" "}
                  {(nodes.find((n) => n.id === selectedNodeId)?.data?.["title"] as ReactNode) || "Unknown"}
                </h3>
                <div className="space-y-2">
                  <div>
                    <h4 className="mb-1 text-xs font-medium text-gray-600">
                      Connected Systems ({connectedNodeIds.size}):
                    </h4>
                    <div className="max-h-32 overflow-y-auto">
                      {getConnectedSystemNames().map((systemName, index) => (
                        <div key={index} className="mb-1 rounded bg-blue-50 px-2 py-1 text-xs text-gray-700">
                          {typeof systemName === "string" ? systemName : JSON.stringify(systemName)}
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => handleNodeClick(selectedNodeId)}
                    className="text-xs text-blue-600 underline hover:text-blue-800 disabled:opacity-50"
                    disabled={isLoading || isFetching}
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            </DraggablePanel>
          )}

          {/* Save All Button */}
          {nodesWithUnsavedChanges.length > 0 && (
            <div className="absolute bottom-6 right-6 z-50">
              <Button
                onClick={handleBulkSave}
                disabled={isBulkSaving}
                className="relative bg-orange-500 hover:bg-orange-600 text-white shadow-lg animate-pulse"
                size="lg"
              >
                {isBulkSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save All ({nodesWithUnsavedChanges.length})
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Last Save Time Display */}
          {lastSaveTime && (
            <div className="absolute top-4 right-4 z-40 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md text-sm text-gray-600">
              Last saved: {lastSaveTime.toLocaleTimeString()}
            </div>
          )}
        </>
      )}
    </div>
  )
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 3,
    },
  },
})

interface FlowDiagramUsWiresProps {
  isMonitorMode?: boolean
}

export function FlowDiagramUsWires({ isMonitorMode = false }: FlowDiagramUsWiresProps) {
  const { showAmountSearchResults, amountSearchParams, hideAmountResults } = useTransactionSearchUsWiresContext()
  const [showSearchBox, setShowSearchBox] = useState(true)

  const nodeTypes: NodeTypes = useMemo(
    () => ({
      custom: (props) => <CustomNodeUsWires {...props} onHideSearch={() => setShowSearchBox((prev) => !prev)} />,
      background: (props) => <SectionBackgroundNode {...props} />,
    }),
    [],
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ReactFlowProvider>
        {showSearchBox && <PaymentSearchBoxUsWires />}
        <AnimatedInfoSection isVisible={isMonitorMode} />
        {showAmountSearchResults && amountSearchParams ? (
          <>
            <div>TransactionSearchResultsGrid Shows</div>
            {/*<TransactionSearchResultsGrid*/}
            {/*  transactionAmount={amountSearchParams.amount}*/}
            {/*  dateStart={amountSearchParams.dateStart}*/}
            {/*  dateEnd={amountSearchParams.dateEnd}*/}
            {/*  onBack={hideAmountResults}*/}
            {/*/>*/}
          </>
        ) : (
          <FlowDiagramUsWiresComponent
            nodeTypes={nodeTypes}
            onShowSearchBox={() => setShowSearchBox(true)}
            isMonitorMode={isMonitorMode}
          />
        )}
      </ReactFlowProvider>
    </QueryClientProvider>
  )
}

export { buildRegionWireFlowModel }
