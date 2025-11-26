"use client"

import { useState, useCallback } from "react"
import { Save, Check, AlertCircle, Edit3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import type { Node, Edge } from "@xyflow/react"
import type { CustomNodeData } from "@/types/custom-node-data"
import type { E2ERegionWireFlowModel } from "@/types/region-wire-flow-model"

interface NodeSaveToolbarProps {
  node: Node<CustomNodeData>
  getEdges: () => Edge[]
  getCurrentPosition: () => { x: number; y: number; width: number; height: number }
  onSave: (model: E2ERegionWireFlowModel) => Promise<void>
  isEditing?: boolean
  onEdit?: () => void
  hasUnsavedChanges?: boolean
}

export function NodeSaveToolbar({
  node,
  getEdges,
  getCurrentPosition,
  onSave,
  isEditing = false,
  onEdit,
  hasUnsavedChanges = false,
}: NodeSaveToolbarProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle")

  const buildRegionWireFlowModel = useCallback(
    (
      currentNode: Node<CustomNodeData>,
      positionData: { x: number; y: number; width: number; height: number },
      connectedEdges: Edge[],
    ): E2ERegionWireFlowModel => {
      const nodeFlows = connectedEdges.map((edge) => ({
        id: edge.data?.id,
        sourceId: Number.parseInt(edge.source),
        targetId: Number.parseInt(edge.target),
        sourceHandle: edge.sourceHandle || null,
        targetHandle: edge.targetHandle || null,
        label: edge.label || null,
      }))

      return {
        id: currentNode.data.id,
        region: currentNode.data.region || "US",
        area: currentNode.data.category || currentNode.data.icon || null,
        appId: currentNode.data.appId,
        mappedAppId: currentNode.data.subtext.match(/AIT (\d+)/)?.[1] || null,
        nodeWidth: Math.round(positionData.width),
        nodeHeight: Math.round(positionData.height),
        descriptions: currentNode.data.descriptions || null,
        xPosition: Math.round(positionData.x),
        yPosition: Math.round(positionData.y),
        appName: currentNode.data.title,
        mappedAppNames: null,
        nodeFlows: nodeFlows,
      }
    },
    [],
  )

  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true)
      setSaveStatus("idle")

      // Get current position and dimensions
      const positionData = getCurrentPosition()

      // Get all connected edges
      const allEdges = getEdges()
      const connectedEdges = allEdges.filter((edge) => edge.source === node.id || edge.target === node.id)

      // Build the model
      const regionWireFlowModel = buildRegionWireFlowModel(node, positionData, connectedEdges)

      // Call the save handler
      await onSave(regionWireFlowModel)

      // Show success feedback
      setSaveStatus("success")
      toast.success("Node saved successfully!", {
        description: `${node.data.title} with ${connectedEdges.length} connection(s)`,
        duration: 3000,
      })

      // Reset success status after 2 seconds
      setTimeout(() => setSaveStatus("idle"), 2000)
    } catch (error) {
      console.error("[v0] Failed to save node:", error)
      setSaveStatus("error")

      toast.error("Failed to save node", {
        description: error instanceof Error ? error.message : "Please try again",
        duration: 5000,
      })

      // Reset error status after 3 seconds
      setTimeout(() => setSaveStatus("idle"), 3000)
    } finally {
      setIsSaving(false)
    }
  }, [node, getEdges, getCurrentPosition, onSave, buildRegionWireFlowModel])

  return (
    <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <div className="bg-white border border-gray-300 rounded-lg shadow-lg px-2 py-1 flex items-center gap-2">
        {onEdit && (
          <Button
            onClick={onEdit}
            variant="ghost"
            size="sm"
            className={`h-7 px-2 text-xs font-medium transition-colors ${
              isEditing ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : "hover:bg-gray-100"
            }`}
            title={isEditing ? "Editing descriptions" : "Edit descriptions"}
          >
            <Edit3 className="h-3.5 w-3.5" />
          </Button>
        )}

        <Button
          onClick={handleSave}
          disabled={isSaving}
          variant="ghost"
          size="sm"
          className={`h-7 px-2 text-xs font-medium transition-colors relative ${
            saveStatus === "success"
              ? "bg-green-50 text-green-700 hover:bg-green-100"
              : saveStatus === "error"
                ? "bg-red-50 text-red-700 hover:bg-red-100"
                : "hover:bg-blue-50 hover:text-blue-600"
          }`}
          title="Save node details and connections"
        >
          {hasUnsavedChanges && saveStatus === "idle" && !isSaving && (
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-orange-500 rounded-full" />
          )}

          {isSaving ? (
            <>
              <div className="h-3.5 w-3.5 mr-1 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : saveStatus === "success" ? (
            <>
              <Check className="h-3.5 w-3.5 mr-1" />
              Saved!
            </>
          ) : saveStatus === "error" ? (
            <>
              <AlertCircle className="h-3.5 w-3.5 mr-1" />
              Failed
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5 mr-1" />
              Save
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
