"use client"

// Mock useSheet hook to replace @bofa/shared-context
// Provides sheet management functionality for v0 environment

import { useCallback } from "react"

export function useSheet() {
  const closeSheet = useCallback(() => {
    console.log("[Mock] Closing sheet")
    // In a real implementation, this would close a sheet/drawer component
  }, [])

  const openSheet = useCallback((sheetId: string) => {
    console.log("[Mock] Opening sheet:", sheetId)
    // In a real implementation, this would open a sheet/drawer component
  }, [])

  return {
    closeSheet,
    openSheet,
  }
}
