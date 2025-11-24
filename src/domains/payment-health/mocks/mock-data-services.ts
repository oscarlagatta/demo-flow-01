// Mock implementation of @bofa/data-services for v0 environment
import type { UseQueryOptions } from "@tanstack/react-query"

// Mock health status data
const mockHealthData = [
  {
    aitNumber: "AIT001",
    aitName: "US Wire Transfer",
    healthstatusDateTime: new Date("2024-01-15T08:00:00Z"),
    averageThruputTime: "45.2",
    averageThruputTime30: "42.8",
  },
  {
    aitNumber: "AIT001",
    aitName: "US Wire Transfer",
    healthstatusDateTime: new Date("2024-01-15T09:00:00Z"),
    averageThruputTime: "52.1",
    averageThruputTime30: "48.9",
  },
  {
    aitNumber: "AIT001",
    aitName: "US Wire Transfer",
    healthstatusDateTime: new Date("2024-01-15T10:00:00Z"),
    averageThruputTime: "38.7",
    averageThruputTime30: "41.2",
  },
  {
    aitNumber: "AIT001",
    aitName: "US Wire Transfer",
    healthstatusDateTime: new Date("2024-01-15T11:00:00Z"),
    averageThruputTime: "67.3",
    averageThruputTime30: "59.8",
  },
  {
    aitNumber: "AIT001",
    aitName: "US Wire Transfer",
    healthstatusDateTime: new Date("2024-01-15T12:00:00Z"),
    averageThruputTime: "43.9",
    averageThruputTime30: "46.1",
  },
  {
    aitNumber: "AIT001",
    aitName: "US Wire Transfer",
    healthstatusDateTime: new Date("2024-01-15T13:00:00Z"),
    averageThruputTime: "55.8",
    averageThruputTime30: "52.4",
  },
  {
    aitNumber: "AIT001",
    aitName: "US Wire Transfer",
    healthstatusDateTime: new Date("2024-01-15T14:00:00Z"),
    averageThruputTime: "41.6",
    averageThruputTime30: "44.3",
  },
  {
    aitNumber: "AIT001",
    aitName: "US Wire Transfer",
    healthstatusDateTime: new Date("2024-01-15T15:00:00Z"),
    averageThruputTime: "49.2",
    averageThruputTime30: "47.8",
  },
]

// Mock query option for getting health data
export function getApiV2SplunkDataGetUsWireHealthTodayDaOption(): UseQueryOptions {
  return {
    queryKey: ["splunk-health-data"],
    queryFn: async () => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return mockHealthData
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // 30 seconds
  }
}

// Mock mutation for raising incidents
export function postApiV2SplunkDataRaiseIncidentMutation() {
  return {
    mutationFn: async (data: { body: { subject: string; severity: string; umid: number; description: string } }) => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500))
      console.log("[Mock] Incident raised:", data.body)
      return { success: true, incidentId: `INC-${Date.now()}` }
    },
  }
}

export function getApiV2SplunkDataGetAllActiveApplicationsApplicationOptions(): UseQueryOptions {
  return {
    queryKey: ["applications"],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      return [
        { aitNumber: 512, aitName: "SAA", description: "SAA Application", status: "Active" },
        { aitNumber: 1554, aitName: "SAG", description: "SAG Application", status: "Active" },
        { aitNumber: 42690, aitName: "ETS", description: "ETS Application", status: "Active" },
        { aitNumber: 48167, aitName: "GTMS", description: "GTMS Application", status: "Active" },
      ]
    },
    staleTime: 10 * 60 * 1000,
  }
}

export function getApiV2E2eRegionWireFlowGetRegionWireFlowQueryKey() {
  return ["region-wire-flow"]
}
