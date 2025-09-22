/**
 * Unified interface for /api/v2/splunk-data/get-us-wire-health-app-timings
 * This endpoint serves data for both info-section and SectionDurationBadge components
 */
export interface RawTimingDataEntry {
  // AIT Information
  aiT_NUM: string // e.g., "999", "11554"
  aiT_NAME: string // e.g., "System 999", "System 11554"

  // Core Timing Metrics (for info-section)
  averagE_THRUPUT_TIME_30: string // e.g., "15.24" (seconds)
  miN_THRUPUT_TIME_30: string // e.g., "12.89" (seconds)
  maX_THRUPUT_TIME_30: string // e.g., "21.45" (seconds)
  totaL_THRUPUT_TIME_30: string // e.g., "1524.67" (seconds)
  totaL_ENTRIES: string // e.g., "42"

  // Section-specific timing (for SectionDurationBadge)
  sectioN_NAME: string // e.g., "Processing", "Validation", "Settlement"
  sectioN_DURATION: string // e.g., "2.45" (seconds) - current processing time
  sectioN_MAX_DURATION: string // e.g., "5.67" (seconds) - maximum observed time
  sectioN_ENTRY_COUNT: string // e.g., "15" - number of entries in this section

  // Flow Information (for context)
  floW_DIRECTION: string // e.g., "INBOUND FROM", "OUTBOUND TO"
  iS_TRAFFIC_FLOWING: string // e.g., "Yes", "No"

  // Performance Status (derived from timing thresholds)
  performancE_STATUS: string // e.g., "EXCELLENT", "GOOD", "POOR"

  // Timestamps
  lasT_UPDATED: string // ISO date string
}

/**
 * API Response structure for timing endpoint
 */
export interface TimingsApiResponse {
  data: RawTimingDataEntry[]
  status: "success" | "error"
  timestamp: string
  totalCount: number
  metadata?: {
    refreshInterval: number // seconds
    dataSource: string // e.g., "splunk"
    queryTimeRange: string // e.g., "last_30_minutes"
  }
}

/**
 * Transformed data structure for UI components
 */
export interface ProcessedTimingData {
  // For info-section component
  ait999Summary: {
    totalEntries: number
    averageThruputTime30: number
    minThruputTime30: number
    maxThruputTime30: number
    performanceStatus: "excellent" | "good" | "poor"
    lastUpdated: Date
  }

  // For SectionDurationBadge components
  sectionTimings: Array<{
    sectionId: string
    sectionName: string
    currentDuration: number // seconds
    maxDuration: number // seconds
    entryCount: number
    performanceLevel: "fast" | "normal" | "slow"
    aitNumbers: string[]
  }>

  // Overall system health
  systemHealth: {
    isTrafficFlowing: boolean
    totalSystems: number
    healthySystems: number
    lastUpdated: Date
  }
}
