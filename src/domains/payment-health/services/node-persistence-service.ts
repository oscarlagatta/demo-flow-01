/**
 * Node Persistence Service
 * Handles backend communication for node dimension and position updates
 */

export interface NodeDimensions {
  id: string
  width: number
  height: number
  x: number
  y: number
  lastModified: string
  version: number
}

export interface BatchUpdateRequest {
  nodes: NodeDimensions[]
  timestamp: string
  userId?: string
}

export interface BatchUpdateResponse {
  success: boolean
  updatedNodes: string[]
  conflicts?: Array<{
    nodeId: string
    serverVersion: number
    clientVersion: number
  }>
}

class NodePersistenceService {
  private baseUrl = "/api/v2/nodes"
  private pendingUpdates: Map<string, NodeDimensions> = new Map()
  private isSaving = false

  /**
   * Queue a node dimension update (no auto-save)
   */
  queueUpdate(nodeDimensions: NodeDimensions): void {
    // Store the latest update for this node
    this.pendingUpdates.set(nodeDimensions.id, nodeDimensions)
    console.log("[v0] Node dimension queued:", nodeDimensions.id)
  }

  /**
   * Get count of pending updates
   */
  getPendingCount(): number {
    return this.pendingUpdates.size
  }

  /**
   * Get all pending updates
   */
  getPendingUpdates(): NodeDimensions[] {
    return Array.from(this.pendingUpdates.values())
  }

  /**
   * Check if currently saving
   */
  getIsSaving(): boolean {
    return this.isSaving
  }

  /**
   * Manually save all pending updates to backend
   */
  async saveAllUpdates(): Promise<BatchUpdateResponse | null> {
    if (this.pendingUpdates.size === 0) {
      console.log("[v0] No pending updates to save")
      return { success: true, updatedNodes: [], conflicts: [] }
    }

    if (this.isSaving) {
      console.warn("[v0] Save already in progress")
      return null
    }

    this.isSaving = true
    const updates = Array.from(this.pendingUpdates.values())

    console.log("[v0] Saving", updates.length, "node updates to backend")

    try {
      const response = await fetch(`${this.baseUrl}/batch-update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nodes: updates,
          timestamp: new Date().toISOString(),
        } as BatchUpdateRequest),
      })

      if (!response.ok) {
        throw new Error(`Failed to update nodes: ${response.statusText}`)
      }

      const result: BatchUpdateResponse = await response.json()

      // Handle conflicts if any
      if (result.conflicts && result.conflicts.length > 0) {
        console.warn("[v0] Node update conflicts detected:", result.conflicts)
        // Keep conflicted nodes in pending updates
        const conflictedIds = new Set(result.conflicts.map((c) => c.nodeId))
        this.pendingUpdates.clear()
        updates.forEach((node) => {
          if (conflictedIds.has(node.id)) {
            const conflict = result.conflicts!.find((c) => c.nodeId === node.id)
            if (conflict) {
              this.pendingUpdates.set(node.id, {
                ...node,
                version: conflict.serverVersion + 1,
              })
            }
          }
        })
      } else {
        // Clear all pending updates on success
        this.pendingUpdates.clear()
        console.log("[v0] Successfully saved all node updates")
      }

      return result
    } catch (error) {
      console.error("[v0] Failed to persist node updates:", error)
      // Keep updates in queue for retry
      return null
    } finally {
      this.isSaving = false
    }
  }

  /**
   * Get current dimensions for a node from backend
   */
  async getNodeDimensions(nodeId: string): Promise<NodeDimensions | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${nodeId}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch node: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error(`[v0] Failed to fetch node ${nodeId}:`, error)
      return null
    }
  }

  /**
   * Get all node dimensions from backend
   */
  async getAllNodeDimensions(): Promise<NodeDimensions[]> {
    try {
      const response = await fetch(this.baseUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch nodes: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error("[v0] Failed to fetch all nodes:", error)
      return []
    }
  }

  /**
   * Clear all pending updates (useful for cleanup)
   */
  clearPendingUpdates(): void {
    this.pendingUpdates.clear()
    console.log("[v0] Pending updates cleared")
  }
}

// Singleton instance
export const nodePersistenceService = new NodePersistenceService()
