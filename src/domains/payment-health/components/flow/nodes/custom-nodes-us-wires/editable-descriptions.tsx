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
    } else if (e.key === "Escape") {
      setEditingIndex(null)
      textareaRefs.current[index]?.blur()
    }
  }

  const bulletMarginTop = `${(fontSize * 1.4 - bulletSize) / 2}px`

  return (
    <div className="flex-grow flex flex-col w-full overflow-hidden">
      {isEditing && (
        <div className="flex items-center justify-end mb-1.5 flex-shrink-0">
          <button
            onClick={handleAddItem}
            className="nodrag text-blue-500 hover:text-blue-600 flex items-center gap-0.5 hover:bg-blue-50 px-1.5 py-0.5 rounded transition-colors"
            style={{ fontSize: `${Math.max(10, fontSize - 1)}px` }}
          >
            <Plus className="h-3 w-3" />
            <span>Add entry</span>
          </button>
        </div>
      )}

      {localItems.length === 0 ? (
        <div
          className="flex-grow flex items-center justify-center py-2 text-gray-400"
          style={{ fontSize: `${fontSize}px` }}
        >
          {isEditing ? (
            <span className="italic text-center">Click "Add entry" to add descriptions</span>
          ) : (
            <span className="italic">No descriptions available</span>
          )}
        </div>
      ) : (
        <ul className="space-y-0.5 list-none m-0 p-0 flex-grow overflow-y-auto">
          {localItems.map((item, index) => (
            <li
              key={index}
              className={`group/item flex items-start gap-1.5 rounded px-1 py-0.5 -mx-1 transition-colors ${
                isEditing ? "cursor-text" : ""
              } ${
                editingIndex === index
                  ? "bg-blue-50 ring-1 ring-blue-200"
                  : hoveredIndex === index && isEditing
                    ? "bg-gray-50"
                    : ""
              }`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => {
                if (isEditing) {
                  setEditingIndex(index)
                  textareaRefs.current[index]?.focus()
                }
              }}
            >
              <span
                className="rounded-full bg-gray-500 flex-shrink-0"
                style={{
                  width: `${bulletSize}px`,
                  height: `${bulletSize}px`,
                  marginTop: bulletMarginTop,
                }}
              />

              <div className="flex-1 min-w-0 overflow-hidden">
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
                    className={`nodrag w-full bg-transparent text-gray-700 outline-none resize-none overflow-hidden ${
                      editingIndex === index ? "" : ""
                    }`}
                    style={{
                      fontSize: `${fontSize}px`,
                      lineHeight: "1.4",
                      minHeight: `${fontSize + 4}px`,
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                    }}
                    placeholder="Enter description..."
                  />
                ) : (
                  <span
                    className="text-gray-700 block"
                    style={{
                      fontSize: `${fontSize}px`,
                      lineHeight: "1.4",
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {item}
                  </span>
                )}
              </div>

              {isEditing && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveItem(index)
                  }}
                  className={`nodrag p-0.5 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0 ${
                    hoveredIndex === index || editingIndex === index ? "opacity-100" : "opacity-0"
                  }`}
                  style={{ marginTop: `${(fontSize * 1.4 - 14) / 2}px` }}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
