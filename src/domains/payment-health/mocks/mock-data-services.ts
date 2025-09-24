// Mock implementation of @bofa/data-serces functions
export interface MockSplunkDataEntry {
  aitNumber: string
  aitName: string
  flowDirection: string
  isTrafficFlowing: boolean
  averageTransactionCount: number
  currentTransactionCount: number
  averageThruputTime30: number
  sectionId?: string
}

// Mock data for demonstration
const mockSplunkData: MockSplunkDataEntry[] = [
  {
    aitNumber: "999",
    aitName: "System 999",
    flowDirection: "INBOUND_FROM",
    isTrafficFlowing: true,
    averageTransactionCount: 6197.24,
    currentTransactionCount: 5071,
    averageThruputTime30: 15.24,
    sectionId: "bg-origination",
  },
  {
    aitNumber: "999",
    aitName: "System 999",
    flowDirection: "INBOUND_FROM",
    isTrafficFlowing: true,
    averageTransactionCount: 4523.67,
    currentTransactionCount: 4201,
    averageThruputTime30: 18.67,
    sectionId: "bg-validation",
  },
  {
    aitNumber: "999",
    aitName: "System 999",
    flowDirection: "INBOUND_FROM",
    isTrafficFlowing: true,
    averageTransactionCount: 3891.45,
    currentTransactionCount: 3654,
    averageThruputTime30: 12.89,
    sectionId: "bg-middleware",
  },
  {
    aitNumber: "999",
    aitName: "System 999",
    flowDirection: "INBOUND_FROM",
    isTrafficFlowing: true,
    averageTransactionCount: 5234.12,
    currentTransactionCount: 4987,
    averageThruputTime30: 21.45,
    sectionId: "bg-processing",
  },
  {
    aitNumber: "11554",
    aitName: "System 11554",
    flowDirection: "OUTBOUND_TO",
    isTrafficFlowing: true,
    averageTransactionCount: 2156.78,
    currentTransactionCount: 1987,
    averageThruputTime30: 9.34,
    sectionId: "bg-origination",
  },
]

// Mock query options function
export function getApiV2SplunkDataGetUsWireHealthAppTimingsOptions() {
  return {
    queryKey: ["mock-splunk-us-wires-timings"],
    queryFn: async () => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return mockSplunkData
    },
    staleTime: 30000,
    refetchInterval: 30000,
  }
}

// Mock query options for main Splunk data
export function getApiV2SplunkDataGetUsWireHealthOptions() {
  return {
    queryKey: ["mock-splunk-us-wires"],
    queryFn: async () => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800))
      return mockSplunkData
    },
    staleTime: 30000,
    refetchInterval: 30000,
  }
}

// Mock backend flow data service
export function getApiV2BackendFlowDataOptions() {
  return {
    queryKey: ["backend-flow-data"],
    queryFn: async () => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1200))

      // Return the backend flow data structure
      return {
        nodes: [
          {
            id: "11554",
            aitNumber: "11554",
            aitName: "System 11554",
            healthStatus: "HEALTHY",
            currentThruputTime30: 1.23,
            averageThruputTime30: 1.45,
            transactionCount: 2156,
            splunkData: {
              flowDirection: "OUTBOUND_TO",
              isTrafficFlowing: true,
              averageTransactionCount: 2156.78,
              currentTransactionCount: 1987,
            },
          },
          {
            id: "48581",
            aitNumber: "48581",
            aitName: "System 48581",
            healthStatus: "WARNING",
            currentThruputTime30: 2.87,
            averageThruputTime30: 2.34,
            transactionCount: 1834,
            splunkData: {
              flowDirection: "INBOUND_FROM",
              isTrafficFlowing: true,
              averageTransactionCount: 1834.56,
              currentTransactionCount: 1723,
            },
          },
        ],
        processingSections: [
          {
            sectionId: "bg-origination",
            sectionName: "Origination & Receipt",
            averageTime: 1.2,
            maxTime: 2.8,
            entryCount: 42,
            trend: "stable" as const,
            aitNumbers: ["11554", "48581"],
            aitTimingData: [
              { aitNumber: "11554", aitName: "System 11554", averageThruputTime30: 1.23 },
              { aitNumber: "48581", aitName: "System 48581", averageThruputTime30: 2.87 },
            ],
          },
          {
            sectionId: "bg-validation",
            sectionName: "Payment Validation & Routing",
            averageTime: 2.8,
            maxTime: 4.2,
            entryCount: 38,
            trend: "up" as const,
            aitNumbers: ["512", "70199"],
            aitTimingData: [
              { aitNumber: "512", aitName: "System 512", averageThruputTime30: 2.1 },
              { aitNumber: "70199", aitName: "System 70199", averageThruputTime30: 3.5 },
            ],
          },
        ],
        systemConnections: [
          { from: "11554", to: "48581", connectionType: "DATA_FLOW" },
          { from: "48581", to: "512", connectionType: "VALIDATION" },
        ],
        layOutConfig: [
          {
            id: "bg-origination",
            type: "background",
            position: { x: 0, y: 0 },
            data: { title: "Origination & Receipt", color: "#e0f2fe" },
            draggable: false,
            selectable: false,
            zIndex: -1,
            style: { width: "300px", height: "400px", backgroundColor: "#e0f2fe" },
            sectionPositions: {
              sections: {
                "bg-origination": {
                  baseX: 0,
                  positions: [
                    { x: 50, y: 100 },
                    { x: 150, y: 200 },
                  ],
                },
              },
            },
          },
          {
            id: "bg-validation",
            type: "background",
            position: { x: 320, y: 0 },
            data: { title: "Payment Validation & Routing", color: "#fef3c7" },
            draggable: false,
            selectable: false,
            zIndex: -1,
            style: { width: "300px", height: "400px", backgroundColor: "#fef3c7" },
            sectionPositions: {
              sections: {
                "bg-validation": {
                  baseX: 320,
                  positions: [
                    { x: 370, y: 100 },
                    { x: 470, y: 200 },
                  ],
                },
              },
            },
          },
        ],
      }
    },
    staleTime: 30000,
    refetchInterval: 30000,
  }
}
