"use client"

import type React from "react"

import { Plus, TicketPlus, Trash2, Save, Check, Loader2, AlertCircle, Edit3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface NodeToolbarProps {
  onAddNode?: () => void
  onCreateIncident?: () => void
  onDelete?: () => void
  onSave?: () => Promise<void>
  onEdit?: () => void
  isEditing?: boolean
  hasUnsavedChanges?: boolean
}

export function NodeToolbar({
  onAddNode,
  onCreateIncident,
  onDelete,
  onSave,
  onEdit,
  isEditing,
  hasUnsavedChanges,
}: NodeToolbarProps) {
  const [saveState, setSaveState] = useState<"idle" | "saving" | "success" | "error">("idle")

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onSave || saveState === "saving") return

    setSaveState("saving")
    try {
      await onSave()
      setSaveState("success")
      setTimeout(() => setSaveState("idle"), 2000)
    } catch (error) {
      setSaveState("error")
      setTimeout(() => setSaveState("idle"), 3000)
    }
  }

  const getSaveButtonContent = () => {
    switch (saveState) {
      case "saving":
        return { icon: <Loader2 className="h-4 w-4 animate-spin" />, color: "hover:bg-blue-50 hover:text-blue-600" }
      case "success":
        return { icon: <Check className="h-4 w-4" />, color: "bg-green-50 text-green-600" }
      case "error":
        return { icon: <AlertCircle className="h-4 w-4" />, color: "bg-red-50 text-red-600" }
      default:
        return { icon: <Save className="h-4 w-4" />, color: "hover:bg-blue-50 hover:text-blue-600" }
    }
  }

  const { icon, color } = getSaveButtonContent()

  return (
    <div
      className="nodrag absolute -top-[34px] left-1/2 -translate-x-1/2 flex items-center gap-1 bg-gray-50/95 backdrop-blur-sm rounded-lg shadow-md border border-gray-200 p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30"
      onClick={(e) => e.stopPropagation()}
    >
      {onEdit && (
        <Button
          variant="ghost"
          size="icon"
          className={`h-7 w-7 rounded-full transition-colors ${
            isEditing ? "bg-blue-100 text-blue-700" : "hover:bg-blue-50 hover:text-blue-600"
          }`}
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
          title={isEditing ? "Exit edit mode" : "Edit descriptions"}
        >
          <Edit3 className="h-4 w-4" />
        </Button>
      )}

      {onSave && (
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 rounded-full transition-colors ${color}`}
            onClick={handleSave}
            disabled={saveState === "saving"}
            title={
              saveState === "saving"
                ? "Saving..."
                : saveState === "success"
                  ? "Saved!"
                  : saveState === "error"
                    ? "Failed to save"
                    : "Save node"
            }
          >
            {icon}
          </Button>
          {hasUnsavedChanges && saveState === "idle" && (
            <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-orange-500 border border-white" />
          )}
        </div>
      )}

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors"
        onClick={(e) => {
          e.stopPropagation()
          onAddNode?.()
        }}
        title="Add connected node"
      >
        <Plus className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors"
        onClick={(e) => {
          e.stopPropagation()
          onCreateIncident?.()
        }}
        title="Create incident ticket"
      >
        <TicketPlus className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors"
        onClick={(e) => {
          e.stopPropagation()
          onDelete?.()
        }}
        title="Delete node"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
