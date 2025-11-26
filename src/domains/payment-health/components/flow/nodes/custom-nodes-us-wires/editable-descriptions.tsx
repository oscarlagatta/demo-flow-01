"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Plus, X } from "lucide-react"

interface EditableDescriptionsProps {
  items: string[]
  onUpdate: (items: string[]) => void
  bulletSize: number
  fontSize: number
  columns: number
  isEditing?: boolean
}

export function EditableDescriptions({
  items,
  onUpdate,
  bulletSize,
  fontSize,
  columns,
  isEditing = false,
}: EditableDescriptionsProps) {
  const [localItems, setLocalItems] = useState<string[]>(items)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([])

  useEffect(() => {
    setLocalItems(items)
  }, [items])

  const autoResizeTextarea = (textarea: HTMLTextAreaElement | null) => {
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }

  useEffect(() => {
    textareaRefs.current.forEach(autoResizeTextarea)
  }, [localItems])

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
    setTimeout(() => {
      const newTextarea = textareaRefs.current[updated.length - 1]
      if (newTextarea) {
        newTextarea.focus()
        autoResizeTextarea(newTextarea)
      }
    }, 0)
  }

  const handleRemoveItem = (index: number) => {
    const updated = localItems.filter((_, i) => i !== index)
    setLocalItems(updated)
    onUpdate(updated)
    if (editingIndex === index) {
      setEditingIndex(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleAddItem()
    } else if (e.key === "Backspace" && localItems[index] === "") {
      e.preventDefault()
      handleRemoveItem(index)
      if (index > 0) {
        setTimeout(() => textareaRefs.current[index - 1]?.focus(), 0)
      }
    }
  }

  return (
    <div className="flex-grow flex flex-col">
      {isEditing && (
        <div className="flex items-center justify-end mb-1 -mt-1">
          <button
            onClick={handleAddItem}
            className="nodrag text-blue-500 hover:text-blue-600 flex items-center gap-0.5 opacity-60 hover:opacity-100 transition-opacity"
            style={{ fontSize: `${Math.max(10, fontSize - 1)}px` }}
          >
            <Plus className="h-3 w-3" />
            <span>Add entry</span>
          </button>
        </div>
      )}

      {localItems.length === 0 ? (
        <div
          className="flex-grow flex items-center justify-center py-3 text-gray-400"
          style={{ fontSize: `${fontSize}px` }}
        >
          {isEditing ? (
            <span className="italic">Click "Add entry" above to add descriptions</span>
          ) : (
            <span className="italic">No descriptions available</span>
          )}
        </div>
      ) : (
        <ul className="space-y-0.5 list-none m-0 p-0">
          {localItems.map((item, index) => (
            <li
              key={index}
              className={`group/item flex items-start gap-1.5 rounded-sm px-1 py-0.5 -mx-1 transition-colors ${
                isEditing ? "cursor-text" : ""
              } ${editingIndex === index ? "bg-blue-50/70" : hoveredIndex === index && isEditing ? "bg-gray-50" : ""}`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => isEditing && textareaRefs.current[index]?.focus()}
            >
              <span
                className="rounded-full bg-gray-500 flex-shrink-0"
                style={{
                  width: `${bulletSize}px`,
                  height: `${bulletSize}px`,
                  marginTop: `${(fontSize * 1.4 - bulletSize) / 2}px`,
                }}
              />
              <div className="flex-1 min-w-0 flex items-start gap-0.5">
                {isEditing ? (
                  <textarea
                    ref={(el) => {
                      textareaRefs.current[index] = el
                    }}
                    value={item}
                    onChange={(e) => {
                      handleItemChange(index, e.target.value)
                      autoResizeTextarea(e.target)
                    }}
                    onFocus={() => setEditingIndex(index)}
                    onBlur={() => setEditingIndex(null)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    rows={1}
                    className={`nodrag w-full bg-transparent text-gray-700 leading-snug outline-none resize-none overflow-hidden border-b transition-colors ${
                      editingIndex === index ? "border-blue-400" : "border-transparent hover:border-gray-200"
                    }`}
                    style={{
                      fontSize: `${fontSize}px`,
                      minHeight: `${fontSize + 4}px`,
                      lineHeight: "1.4",
                    }}
                    placeholder="Enter description..."
                  />
                ) : (
                  <span
                    className="text-gray-700 leading-snug break-words whitespace-pre-wrap"
                    style={{
                      fontSize: `${fontSize}px`,
                      lineHeight: "1.4",
                    }}
                  >
                    {item}
                  </span>
                )}
                {isEditing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveItem(index)
                    }}
                    className={`nodrag p-0.5 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0 ${
                      hoveredIndex === index || editingIndex === index ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
