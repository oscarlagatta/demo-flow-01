"use client"

import { Plus, Maximize2, Trash2, Edit3 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NodeToolbarProps {
  onAddNode?: () => void
  onToggleExpand?: () => void
  onDelete?: () => void
  onEdit?: () => void
}

export function NodeToolbar({ onAddNode, onToggleExpand, onDelete, onEdit }: NodeToolbarProps) {
  return (
    <div
      className="nodrag absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30"
      onClick={(e) => e.stopPropagation()}
    >
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
          onToggleExpand?.()
        }}
        title="Toggle expansion"
      >
        <Maximize2 className="h-4 w-4" />
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

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors"
        onClick={(e) => {
          e.stopPropagation()
          onEdit?.()
        }}
        title="Edit node"
      >
        <Edit3 className="h-4 w-4" />
      </Button>
    </div>
  )
}
