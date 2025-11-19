"use client"

import { Save } from 'lucide-react'
import { Button } from "@/components/ui/button"

interface NodeSaveToolbarProps {
  onSave: () => void
  isSaving?: boolean
}

export function NodeSaveToolbar({ onSave, isSaving = false }: NodeSaveToolbarProps) {
  return (
    <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <div className="bg-white border border-gray-300 rounded-lg shadow-lg px-2 py-1 flex items-center gap-2">
        <Button
          onClick={onSave}
          disabled={isSaving}
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs font-medium hover:bg-blue-50 hover:text-blue-600"
          title="Save node details and connections"
        >
          <Save className="h-3.5 w-3.5 mr-1" />
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  )
}
