# Managing Descriptions in custom-node-us-wires Component

This guide provides a complete line-by-line explanation of how the description editing system works in the custom-node-us-wires component. Use this as a reference for implementing similar functionality in other codebases.

---

## 1. State Management (custom-node-us-wires.tsx)

### Initialize State Variables

\`\`\`typescript
const [isEditingDescriptions, setIsEditingDescriptions] = useState(false)
const [localDescriptions, setLocalDescriptions] = useState<string[]>([])
\`\`\`

- `isEditingDescriptions`: Boolean flag that controls whether the descriptions are in edit mode or view mode
- `localDescriptions`: Array of strings that holds the working copy of descriptions before saving to backend
- These are React state variables that trigger re-renders when updated

---

## 2. Loading Data from Backend (custom-node-us-wires.tsx)

### useEffect Hook to Parse Backend Data

\`\`\`typescript
useEffect(() => {
  if (data.descriptions) {
    // Split the newline-separated string from backend into array
    const items = data.descriptions
      .split("\n")                    // Split by newline characters
      .map((line) => line.trim())     // Remove whitespace from each line
      .filter((line) => line.length > 0)  // Remove empty lines
      .map((line) => (line.startsWith("-") ? line.substring(1).trim() : line))  // Remove leading dashes if present
    setLocalDescriptions(items)       // Store in local state for editing
  } else {
    setLocalDescriptions([])          // If no descriptions, initialize empty array
  }
  setHasUnsavedChanges(false)        // Reset unsaved changes flag
}, [data.descriptions])              // Re-run when data.descriptions changes
\`\`\`

**What's happening:**
1. Backend sends descriptions as a single string: `"Item 1\nItem 2\nItem 3"`
2. We split by `\n` to get an array: `["Item 1", "Item 2", "Item 3"]`
3. Clean up each item (trim whitespace, remove bullet markers)
4. Store in `localDescriptions` state for editing

---

## 3. Toggling Edit Mode (custom-node-us-wires.tsx)

### Toggle Edit Function

\`\`\`typescript
const handleToggleEdit = () => {
  setIsEditingDescriptions(!isEditingDescriptions)  // Flip the boolean
}
\`\`\`

**Connected to Toolbar:**
The toolbar receives this function via props and calls it when Edit button is clicked.

---

## 4. Handling Description Updates (custom-node-us-wires.tsx)

### Update Handler

\`\`\`typescript
const handleDescriptionsUpdate = (items: string[]) => {
  setLocalDescriptions(items)         // Update local state with new items
  setHasUnsavedChanges(true)         // Mark that there are unsaved changes
}
\`\`\`

**What's happening:**
- The `EditableDescriptions` child component calls this function whenever user adds/edits/removes items
- We update `localDescriptions` state with the new array
- We set `hasUnsavedChanges` to true, which shows an orange dot on the Save button

---

## 5. Saving to Backend (custom-node-us-wires.tsx)

### Save Function

\`\`\`typescript
const handleSaveNodeWrapper = async () => {
  // Step 1: Get current node position
  const positionData = getCurrentPosition()
  if (!positionData) return

  // Step 2: Get all connected edges (connections between nodes)
  const connectedEdges = getEdges().filter((edge) => edge.source === id || edge.target === id)

  // Step 3: Map edges to nodeFlows format
  const nodeFlows = connectedEdges.map((edge) => ({
    sourceId: Number.parseInt(edge.source),
    targetId: Number.parseInt(edge.target),
    sourceHandle: edge.sourceHandle || null,
    targetHandle: edge.targetHandle || null,
    label: edge.label || null,
  }))

  // Step 4: CRITICAL - Join array back into newline-separated string
  const updatedDescriptions = localDescriptions.join("\n")
  // Example: ["Item 1", "Item 2"] becomes "Item 1\nItem 2"

  // Step 5: Build model object for backend
  const model: E2ERegionWireFlowModel = {
    id: Number.parseInt(id),
    name: data.title,
    positionX: positionData.x,
    positionY: positionData.y,
    width: dimensions.width,
    height: dimensions.height,
    descriptions: updatedDescriptions,  // Send as newline-separated string
    area: data.category || (typeof data.icon === "string" ? data.icon : undefined) || data.parentId || "default",
    nodeFlows,
  }

  // Step 6: Call backend save function
  await handleSaveNode(model)

  // Step 7: Update React Flow node data to match what was saved
  updateNode(id, { ...data, descriptions: updatedDescriptions })

  // Step 8: Reset UI state
  setHasUnsavedChanges(false)        // Clear unsaved changes indicator
  setIsEditingDescriptions(false)    // Exit edit mode
}
\`\`\`

**Key Points:**
- We convert the array back to a newline-separated string before sending to backend
- Backend receives the same format it originally sent: `"Item 1\nItem 2\nItem 3"`
- After successful save, we update the React Flow node and exit edit mode

---

## 6. Rendering the UI (custom-node-us-wires.tsx)

### Conditional Rendering

\`\`\`typescript
{isEditingDescriptions ? (
  // EDIT MODE: Show editable interface
  <EditableDescriptions
    items={localDescriptions}               // Pass current array
    onUpdate={handleDescriptionsUpdate}     // Callback when items change
    bulletSize={bulletSize}                 // Styling
    fontSize={descriptionFontSize}          // Styling
    columns={descriptionColumns}            // Layout
    isEditing={true}                        // Tell component it's in edit mode
  />
) : data.descriptions && descriptionItems.length > 0 ? (
  // VIEW MODE: Show read-only bulleted list
  <ul className="flex-grow list-none m-0 p-0 space-y-0.5">
    {descriptionItems.map((item, index) => (
      <li key={index} className="flex items-start gap-1.5">
        <span /* bullet marker styles */ />
        <span /* text styles */>{item}</span>
      </li>
    ))}
  </ul>
) : (
  // EMPTY STATE
  <span>No descriptions available</span>
)}
\`\`\`

---

## 7. Editable Descriptions Component

### State Management (EditableDescriptions.tsx)

\`\`\`typescript
const [localItems, setLocalItems] = useState<string[]>(items)  // Working copy
const [editingIndex, setEditingIndex] = useState<number | null>(null)  // Which item is being edited
const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)  // Which item is hovered
const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([])  // References to all textareas
\`\`\`

### Sync with Parent

\`\`\`typescript
useEffect(() => {
  setLocalItems(items)  // Update when parent passes new items
}, [items])
\`\`\`

### Auto-resize Textarea

\`\`\`typescript
const autoResizeTextarea = (textarea: HTMLTextAreaElement | null) => {
  if (textarea) {
    textarea.style.height = "auto"          // Reset height
    textarea.style.height = `${textarea.scrollHeight}px`  // Set to content height
  }
}
\`\`\`

This makes textareas grow/shrink based on content.

### Handle Item Change

\`\`\`typescript
const handleItemChange = (index: number, value: string) => {
  const updated = [...localItems]    // Copy array
  updated[index] = value             // Update specific item
  setLocalItems(updated)             // Update local state
  onUpdate(updated)                  // Notify parent (calls handleDescriptionsUpdate)
}
\`\`\`

### Add New Item

\`\`\`typescript
const handleAddItem = () => {
  const updated = [...localItems, ""]     // Add empty string to array
  setLocalItems(updated)
  onUpdate(updated)                       // Notify parent
  setEditingIndex(updated.length - 1)     // Focus on new item
  setTimeout(() => {
    const newTextarea = textareaRefs.current[updated.length - 1]
    if (newTextarea) {
      newTextarea.focus()                 // Auto-focus new textarea
      autoResizeTextarea(newTextarea)
    }
  }, 0)
}
\`\`\`

### Remove Item

\`\`\`typescript
const handleRemoveItem = (index: number) => {
  const updated = localItems.filter((_, i) => i !== index)  // Remove item at index
  setLocalItems(updated)
  onUpdate(updated)                       // Notify parent
  if (editingIndex === index) {
    setEditingIndex(null)                 // Clear editing state if this item was being edited
  }
}
\`\`\`

### Keyboard Shortcuts

\`\`\`typescript
const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault()
    handleAddItem()                        // Enter = add new item
  } else if (e.key === "Backspace" && localItems[index] === "") {
    e.preventDefault()
    handleRemoveItem(index)                // Backspace on empty item = delete it
    if (index > 0) {
      setTimeout(() => textareaRefs.current[index - 1]?.focus(), 0)  // Focus previous
    }
  } else if (e.key === "Escape") {
    setEditingIndex(null)
    textareaRefs.current[index]?.blur()    // Escape = exit edit mode
  }
}
\`\`\`

### Rendering Each Item

\`\`\`typescript
{localItems.map((item, index) => (
  <li
    key={index}
    className={/* highlight classes based on hover/edit state */}
    onMouseEnter={() => setHoveredIndex(index)}
    onMouseLeave={() => setHoveredIndex(null)}
    onClick={() => {
      if (isEditing) {
        setEditingIndex(index)
        textareaRefs.current[index]?.focus()  // Click item to edit
      }
    }}
  >
    {/* Bullet point */}
    <span className="rounded-full bg-gray-500" />

    {/* Editable textarea */}
    <textarea
      ref={(el) => { textareaRefs.current[index] = el }}
      value={item}
      onChange={(e) => {
        handleItemChange(index, e.target.value)
        autoResizeTextarea(e.target)
      }}
      onFocus={() => setEditingIndex(index)}
      onBlur={() => setEditingIndex(null)}
      onKeyDown={(e) => handleKeyDown(e, index)}
      /* styling for word wrap and auto-resize */
    />

    {/* Delete button (shows on hover) */}
    <button onClick={() => handleRemoveItem(index)}>
      <X />
    </button>
  </li>
))}
\`\`\`

---

## 8. Toolbar Integration

### NodeToolbar Props

\`\`\`typescript
interface NodeToolbarProps {
  onEdit?: () => void              // Callback to toggle edit mode
  isEditing?: boolean              // Whether currently editing
  hasUnsavedChanges?: boolean      // Whether there are unsaved changes
  onSave?: () => Promise<void>     // Callback to save
}
\`\`\`

### Edit Button

\`\`\`typescript
<Button
  className={isEditing ? "bg-blue-100 text-blue-700" : ""}  // Highlight when active
  onClick={onEdit}                 // Calls handleToggleEdit
  title={isEditing ? "Exit edit mode" : "Edit descriptions"}
>
  <Edit3 />
</Button>
\`\`\`

### Save Button with State

\`\`\`typescript
const [saveState, setSaveState] = useState<"idle" | "saving" | "success" | "error">("idle")

const handleSave = async () => {
  setSaveState("saving")          // Show spinner
  try {
    await onSave()                // Calls handleSaveNodeWrapper
    setSaveState("success")       // Show checkmark
    setTimeout(() => setSaveState("idle"), 2000)
  } catch (error) {
    setSaveState("error")         // Show error icon
    setTimeout(() => setSaveState("idle"), 3000)
  }
}

// Visual feedback based on state
const icon = saveState === "saving" ? <Loader2 className="animate-spin" />
           : saveState === "success" ? <Check />
           : saveState === "error" ? <AlertCircle />
           : <Save />

// Orange dot indicator for unsaved changes
{hasUnsavedChanges && saveState === "idle" && (
  <div className="absolute top-0 right-0 h-2 w-2 bg-orange-500" />
)}
\`\`\`

---

## Complete Data Flow Summary

### Backend → Frontend
- Backend sends: `"Item 1\nItem 2\nItem 3"`
- useEffect splits into: `["Item 1", "Item 2", "Item 3"]`
- Stored in `localDescriptions` state

### User Edits
- User clicks Edit button → `isEditingDescriptions = true`
- `EditableDescriptions` component renders with textareas
- User adds/edits/removes items
- Each change calls `handleDescriptionsUpdate(newArray)`
- Updates `localDescriptions` and sets `hasUnsavedChanges = true`

### User Saves
- User clicks Save button → calls `handleSaveNodeWrapper()`
- Joins array: `["Item 1", "Item 2"]` → `"Item 1\nItem 2"`
- Sends to backend in original format
- Updates React Flow node data
- Exits edit mode and clears unsaved changes flag

### Visual Feedback
- Edit button turns blue when active
- Save button shows orange dot when changes pending
- Save button shows spinner → checkmark → returns to idle
- Items highlight on hover/focus
- Delete button appears on hover

---

## Implementation Checklist

When implementing this in another codebase:

1. **Add State Variables**
   - [ ] `isEditingDescriptions` (boolean)
   - [ ] `localDescriptions` (string array)
   - [ ] `hasUnsavedChanges` (boolean)

2. **Create Data Loading**
   - [ ] useEffect to parse backend string into array
   - [ ] Split by `\n` and clean up items
   - [ ] Handle empty state

3. **Create Update Handlers**
   - [ ] `handleToggleEdit()` to toggle edit mode
   - [ ] `handleDescriptionsUpdate()` to receive changes from child
   - [ ] Mark unsaved changes when items change

4. **Create Save Handler**
   - [ ] Join array back to `\n` separated string
   - [ ] Send to backend
   - [ ] Update local node data
   - [ ] Reset edit mode and unsaved changes

5. **Create EditableDescriptions Component**
   - [ ] State for local items, editing index, hovered index
   - [ ] Textarea refs for auto-focus
   - [ ] Auto-resize textarea function
   - [ ] Add/remove/edit item handlers
   - [ ] Keyboard shortcuts (Enter, Backspace, Escape)
   - [ ] Render with bullets and delete buttons

6. **Create/Update Toolbar**
   - [ ] Edit button with active state styling
   - [ ] Save button with loading/success/error states
   - [ ] Orange dot indicator for unsaved changes
   - [ ] Connect to parent handlers

7. **Add Conditional Rendering**
   - [ ] Edit mode: Show EditableDescriptions
   - [ ] View mode: Show read-only bulleted list
   - [ ] Empty state: Show placeholder message

---

This architecture ensures data consistency by always converting between the backend format (newline-separated string) and the UI format (array of strings) at the boundaries, while keeping all editing logic working with the array format for easier manipulation.
