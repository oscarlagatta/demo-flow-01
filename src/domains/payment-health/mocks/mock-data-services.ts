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
