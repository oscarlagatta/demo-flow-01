// Mock hooks for region wire flow operations
// Replaces @bofa/data-services hooks for v0 environment

import { useMutation, useQuery } from "@tanstack/react-query"
import type { E2ERegionWireFlowModel } from "@/types/region-wire-flow-model"

// Mock data for region wire flows
const mockRegionWireFlows: E2ERegionWireFlowModel[] = [
  {
    id: 1,
    region: "US",
    area: "Origination",
    appId: 1554,
    mappedAppId: "512",
    nodeWidth: 180,
    nodeHeight: 90,
    descriptions: "Handles origination requests\n- Receives inbound",
    xPosition: 50,
    yPosition: 115,
    appName: "SAG",
    createdUserId: 408,
    updatedUserId: 408,
    nodeFlows: [
      {
        id: 1,
        sourceId: 1554,
        targetId: 512,
        sourceHandle: "Right",
        targetHandle: "Left",
        label: "Connect by RPI",
      },
    ],
  },
  {
    id: 2,
    region: "US",
    area: "Origination",
    appId: 48167,
    mappedAppId: "42690",
    nodeWidth: 180,
    nodeHeight: 90,
    descriptions: null,
    xPosition: 50,
    yPosition: 355,
    appName: "SAA",
    createdUserId: 408,
    updatedUserId: 408,
    nodeFlows: [],
  },
]

export function useGetRegionWireFlow() {
  const query = useQuery({
    queryKey: ["region-wire-flow"],
    queryFn: async () => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500))
      return mockRegionWireFlows
    },
    staleTime: 5 * 60 * 1000,
  })

  return {
    regionWireFlow: query.data || [],
    isError: query.isError,
    isLoading: query.isLoading,
    refetch: query.refetch,
  }
}

export function useCreateRegionWireFlow() {
  return useMutation({
    mutationFn: async ({ body }: { body: Omit<E2ERegionWireFlowModel, "id"> }) => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500))
      console.log("[Mock] Creating region wire flow:", body)
      return { ...body, id: Date.now() }
    },
  })
}

export function useUpdateRegionWireFlow() {
  return useMutation({
    mutationFn: async ({ body, path }: { body: E2ERegionWireFlowModel; path: { id?: number } }) => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500))
      console.log("[Mock] Updating region wire flow:", body)
      return body
    },
  })
}

export function useDeleteRegionWireFlow() {
  return useMutation({
    mutationFn: async ({ query }: { query: { id?: number } }) => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500))
      console.log("[Mock] Deleting region wire flow:", query.id)
      return { success: true }
    },
  })
}
