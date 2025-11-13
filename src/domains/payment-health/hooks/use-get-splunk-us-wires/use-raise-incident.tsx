import { useMutation } from "@tanstack/react-query"

import { postApiV2SplunkDataRaiseIncidentMutation } from "../../mocks/mock-data-services"

export function useIncidents() {
  const createIncidentMutation = useMutation(postApiV2SplunkDataRaiseIncidentMutation())

  const createIncident = async (data: {
    subject: string
    severity: string
    umid: number | null
    description: string
    type: string
    boaEventType: string
    boaWikiId: string
    fullDescription: string
  }) => {
    try {
      await createIncidentMutation.mutateAsync({
        body: data,
      })
    } catch (error) {
      console.error("Failed to add incident", error)
      throw error
    }
  }

  return {
    createIncident,
  }
}
