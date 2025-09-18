"use client"
import { type ReactNode, useCallback, useEffect, useMemo, useState, useRef } from "react"
import type React from "react"
import { MarkerType } from "@xyflow/react" // Import MarkerType

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type NodeTypes,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
  ReactFlow,
  ReactFlowProvider,
  useStore,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { AlertCircle, Loader2, RefreshCw } from "lucide-react"
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

import type { TimingDataEntry } from "@/domains/payment-health/utils/timing-data-processor"

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

const Flow = ({
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
  const [nodes, setNodes] = useState<Node[]>(initialNodes)
  const [edges, setEdges] = useState<Edge[]>(initialEdges)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [connectedNodeIds, setConnectedNodeIds] = useState<Set<string>>(new Set())
  const [connectedEdgeIds, setConnectedEdgeIds] = useState<Set<string>>(new Set())
  const [lastRefetch, setLastRefetch] = useState<Date | null>(null)
  const [canvasHeight, setCanvasHeight] = useState<number>(500) // default height
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

  const mockTimingData: TimingDataEntry[] = [
    // Origination section entries
    {
      aitNumber: "999",
      aitName: "CPD_Strategic",
      healthstatusDateTime: "2025-09-16T09:30:00",
      averageThruputTime: "88.72",
      averageThruputTime30: "87.83",
    },
    {
      aitNumber: "999",
      aitName: "CPD_Strategic",
      healthstatusDateTime: "2025-09-16T10:00:00",
      averageThruputTime: "92.17",
      averageThruputTime30: "76.19",
    },
    {
      aitNumber: "11554",
      aitName: "Swift Gateway",
      healthstatusDateTime: "2025-09-16T09:30:00",
      averageThruputTime: "45.32",
      averageThruputTime30: "42.15",
    },
    {
      aitNumber: "48581",
      aitName: "Loan IQ",
      healthstatusDateTime: "2025-09-16T09:30:00",
      averageThruputTime: "67.89",
      averageThruputTime30: "65.44",
    },
    // Payment Validation and Routing section entries
    {
      aitNumber: "512",
      aitName: "Swift Alliance",
      healthstatusDateTime: "2025-09-16T09:30:00",
      averageThruputTime: "125.67",
      averageThruputTime30: "118.23",
    },
    {
      aitNumber: "70199",
      aitName: "GPO",
      healthstatusDateTime: "2025-09-16T09:30:00",
      averageThruputTime: "89.45",
      averageThruputTime30: "92.11",
    },
    {
      aitNumber: "28960",
      aitName: "CashPro Payments",
      healthstatusDateTime: "2025-09-16T09:30:00",
      averageThruputTime: "156.78",
      averageThruputTime30: "149.33",
    },
    {
      aitNumber: "15227",
      aitName: "FRP US",
      healthstatusDateTime: "2025-09-16T09:30:00",
      averageThruputTime: "78.92",
      averageThruputTime30: "81.67",
    },
    // Middleware section entries
    {
      aitNumber: "60745",
      aitName: "RPI",
      healthstatusDateTime: "2025-09-16T09:30:00",
      averageThruputTime: "234.56",
      averageThruputTime30: "228.91",
    },
    {
      aitNumber: "4679",
      aitName: "HRP",
      healthstatusDateTime: "2025-09-16T09:30:00",
      averageThruputTime: "198.34",
      averageThruputTime30: "205.77",
    },
    // Payment Processing, Sanctions & Investigation section entries
    {
      aitNumber: "515",
      aitName: "GPS Aries",
      healthstatusDateTime: "2025-09-16T09:30:00",
      averageThruputTime: "345.67",
      averageThruputTime30: "338.92",
    },
    {
      aitNumber: "62686",
      aitName: "GTMS (Limits)",
      healthstatusDateTime: "2025-09-16T09:30:00",
      averageThruputTime: "289.45",
      averageThruputTime30: "295.11",
    },
    {
      aitNumber: "46951",
      aitName: "ETS (Sanctions)",
      healthstatusDateTime: "2025-09-16T09:30:00",
      averageThruputTime: "412.78",
      averageThruputTime30: "398.33",
    },
    {
      aitNumber: "73929",
      aitName: "GFD (Fraud)",
      healthstatusDateTime: "2025-09-16T09:30:00",
      averageThruputTime: "367.92",
      averageThruputTime30: "371.67",
    },
  ]

  const {
    data: processingTimesData,
    isLoading: isLoadingProcessingTimes,
    refetch: refetchProcessingTimes,
  } = useGetAverageProcessingTimes({
    enabled: isAuthorized,
    refetchInterval: 30000,
    externalTimingData: mockTimingData,
  })

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
  const onNodesChange: OnNodesChange = useCallback(
    (changes: NodeChange<Node>[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes],
  )
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges],
  )
  const onConnect: OnConnect = useCallback(
    (connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: "smoothstep",
            markerStart: { type: MarkerType.ArrowClosed, color: "#6b7280" },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#6b7280" },
            style: { strokeWidth: 2, stroke: "#6b7280" },
          },
          eds,
        ),
      ),
    [setEdges],
  )
  const nodesForFlow = useMemo(() => {
    return nodes.map((node) => {
      const isSelected = selectedNodeId === node.id
      const isConnected = connectedNodeIds.has(node.id)
      const isDimmed = selectedNodeId && !isSelected && !isConnected

      let nodeData = {
        ...node.data,
        isSelected,
        isConnected,
        isDimmed,
        onClick: handleNodeClick,
        onActionClick: handleActionClick,
        isMonitorMode: isMonitorMode,
      }

      if (node.type === "background" && processingTimesData) {
        const processingTimeInfo = processingTimesData.find((pt) => pt.sectionId === node.id)
        if (processingTimeInfo) {
          nodeData = {
            ...nodeData,
            duration: processingTimeInfo.averageTime,
            maxDuration: processingTimeInfo.maxTime,
            trend: processingTimeInfo.trend,
            entryCount: processingTimeInfo.entryCount,
            aitNumbers: processingTimeInfo.aitNumbers,
            aitTimingData: processingTimeInfo.aitTimingData,
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
              <span className="text-muted-foreground text-xs">Last updated: {lastRefetch.toLocaleTimeString()}</span>
            )}
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
            nodeTypes={nodeTypes}
            proOptions={{ hideAttribution: true }}
            className="bg-white"
            style={{ background: "#eeeff3ff" }}
            panOnDrag={false}
            elementsSelectable={false}
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
          <Flow nodeTypes={nodeTypes} onShowSearchBox={() => setShowSearchBox(true)} isMonitorMode={isMonitorMode} />
        )}
      </ReactFlowProvider>
    </QueryClientProvider>
  )
}
