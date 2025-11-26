"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface EditableDescriptionsProps {
  items: string[]
  onUpdate: (items: string[]) => void
  bulletSize: number
  fontSize: number
  columns: number
}

export function EditableDescriptions({ items, onUpdate, bulletSize, fontSize, columns }: EditableDescriptionsProps) {
  const [localItems, setLocalItems] = useState<string[]>(items)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const handleItemChange = (index: number, value: string) => {
    const updated = [...localItems]
    updated[index] = value
    setLocalItems(updated)
    onUpdate(updated)
  }

  const handleAddItem = () => {
    const updated = [...localItems, ""]
    setLocalItems(updated)
    onUpdate(updated)
    setEditingIndex(updated.length - 1)
  }

  const handleRemoveItem = (index: number) => {
    const updated = localItems.filter((_, i) => i !== index)
    setLocalItems(updated)
    onUpdate(updated)
    if (editingIndex === index) {
      setEditingIndex(null)
    }
  }

  if (localItems.length === 0) {
    return (
      <div className="flex-grow flex items-center justify-center p-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddItem}
          className="nodrag text-blue-600 border-blue-300 hover:bg-blue-50 bg-transparent"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add First Item
        </Button>
      </div>
    )
  }

  return (
    <div className="flex-grow pl-2">
      <div
        className={`grid gap-x-4 gap-y-2 ${
          columns === 3 ? "grid-cols-3" : columns === 2 ? "grid-cols-2" : "grid-cols-1"
        }`}
      >
        {localItems.map((item, index) => (
          <div key={index} className="flex items-start gap-2 group/item">
            <div
              className="rounded-full bg-gray-700 flex-shrink-0 mt-1"
              style={{
                width: `${bulletSize}px`,
                height: `${bulletSize}px`,
              }}
            />
            <div className="flex-1 flex items-center gap-1">
              <Input
                value={item}
                onChange={(e) => handleItemChange(index, e.target.value)}
                onFocus={() => setEditingIndex(index)}
                onBlur={() => setEditingIndex(null)}
                className="nodrag h-auto py-0.5 px-1 text-gray-700 font-medium leading-snug border-transparent hover:border-blue-300 focus:border-blue-500 bg-transparent hover:bg-blue-50/50 focus:bg-white transition-colors"
                style={{ fontSize: `${fontSize}px` }}
                placeholder="Enter description..."
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveItem(index)}
                className="nodrag h-5 w-5 opacity-0 group-hover/item:opacity-100 hover:bg-red-50 hover:text-red-600 transition-opacity flex-shrink-0"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleAddItem}
        className="nodrag mt-2 text-blue-600 hover:bg-blue-50 h-7 text-xs"
      >
        <Plus className="h-3 w-3 mr-1" />
        Add Item
      </Button>
    </div>
  )
}
