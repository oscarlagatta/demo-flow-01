"use client"

import { Plus, TicketPlus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NodeToolbarProps {
  onAddNode?: () => void
  onCreateIncident?: () => void
  onDelete?: () => void
}

export function NodeToolbar({ onAddNode, onCreateIncident, onDelete }: NodeToolbarProps) {
  return (
    <div
      className="nodrag absolute -top-[34px] left-1/2 -translate-x-1/2 flex items-center gap-1 bg-gray-50/95 backdrop-blur-sm rounded-lg shadow-md border border-gray-200 p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30"
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
