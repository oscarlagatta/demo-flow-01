"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { nodePersistenceService, type NodeDimensions } from "../services/node-persistence-service"

interface UseNodeResizePersistenceOptions {
  nodeId: string
  onConflict?: (serverVersion: number, clientVersion: number) => void
}

export function useNodeResizePersistence({ nodeId, onConflict }: UseNodeResizePersistenceOptions) {
  const versionRef = useRef(1)
  const lastSavedDimensionsRef = useRef<NodeDimensions | null>(null)

  /**
   * Queue node dimensions for later save (no auto-save)
   */
  const queueDimensions = useCallback(
    (width: number, height: number, x: number, y: number) => {
      console.log("[v0] Queueing dimensions for node:", nodeId, { width, height, x, y })

      const dimensions: NodeDimensions = {
        id: nodeId,
        width,
        height,
        x,
        y,
        lastModified: new Date().toISOString(),
        version: versionRef.current,
      }

      // Only queue if dimensions actually changed
      if (
        !lastSavedDimensionsRef.current ||
        lastSavedDimensionsRef.current.width !== width ||
        lastSavedDimensionsRef.current.height !== height ||
        lastSavedDimensionsRef.current.x !== x ||
        lastSavedDimensionsRef.current.y !== y
      ) {
        nodePersistenceService.queueUpdate(dimensions)
        lastSavedDimensionsRef.current = dimensions
        versionRef.current += 1
        console.log("[v0] Dimensions queued successfully. Total pending:", nodePersistenceService.getPendingCount())
      } else {
        console.log("[v0] Dimensions unchanged, skipping queue")
      }
    },
    [nodeId],
  )

  /**
   * Load initial dimensions from backend
   */
  const loadDimensions = useCallback(async () => {
    const dimensions = await nodePersistenceService.getNodeDimensions(nodeId)
    if (dimensions) {
      lastSavedDimensionsRef.current = dimensions
      versionRef.current = dimensions.version + 1
      return dimensions
    }
    return null
  }, [nodeId])

  return {
    queueDimensions,
    loadDimensions,
  }
}

export function useFlowSaveManager() {
  const [pendingCount, setPendingCount] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Poll for pending updates count
  useEffect(() => {
    const interval = setInterval(() => {
      const count = nodePersistenceService.getPendingCount()
      const saving = nodePersistenceService.getIsSaving()

      if (count !== pendingCount) {
        console.log("[v0] Pending count updated:", count)
      }

      setPendingCount(count)
      setIsSaving(saving)
    }, 100)

    return () => clearInterval(interval)
  }, [pendingCount])

  const saveAll = useCallback(async () => {
    setSaveError(null)
    setIsSaving(true)

    try {
      const result = await nodePersistenceService.saveAllUpdates()

      if (!result) {
        throw new Error("Failed to save updates")
      }

      if (result.conflicts && result.conflicts.length > 0) {
        setSaveError(`${result.conflicts.length} conflict(s) detected. Please refresh and try again.`)
        return { success: false, conflicts: result.conflicts }
      }

      setLastSaveTime(new Date())
      setPendingCount(0)
      return { success: true, updatedNodes: result.updatedNodes }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      setSaveError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsSaving(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setSaveError(null)
  }, [])

  return {
    pendingCount,
    isSaving,
    lastSaveTime,
    saveError,
    saveAll,
    clearError,
  }
}
