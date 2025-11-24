"use client"

import { useCallback, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import type { E2ERegionWireFlowModel, ApplicationModel } from "@/types/region-wire-flow-model"
import { getApiV2SplunkDataGetAllActiveApplicationsApplicationOptions } from "@/domains/payment-health/mocks/mock-data-services"

import {
  useCreateRegionWireFlow,
  useDeleteRegionWireFlow,
  useUpdateRegionWireFlow,
  useGetRegionWireFlow,
} from "@/hooks/region-wire-flow"

import { useSheet } from "@/hooks/use-sheet"

export const useRegionWireFlowPresenter = () => {
  const queryClient = useQueryClient()

  const { regionWireFlow, isError, isLoading, refetch } = useGetRegionWireFlow()
  const [selectedRegionWireFlow, setSelectedRegionWireFlow] = useState<E2ERegionWireFlowModel | null>(null)
  const [selectedApp, setSelectedApp] = useState<ApplicationModel | null>(null)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const createRegionWireFlowMutation = useCreateRegionWireFlow()
  const updateRegionWireFlowMutation = useUpdateRegionWireFlow()
  const deleteRegionWireFlowMutation = useDeleteRegionWireFlow()

  const { data: applications, isLoading: isApplicationsLoading } = useQuery(
    getApiV2SplunkDataGetAllActiveApplicationsApplicationOptions(),
  )

  const handleSelectApp = useCallback(
    (appId: number) => {
      const app =
        (Array.isArray(applications) ? applications : []).find((app: ApplicationModel) => app.aitNumber === appId) ||
        null
      setSelectedApp(app)
    },
    [applications],
  )

  const handleSelectRegionWireFlow = useCallback((regionWireFlow: E2ERegionWireFlowModel) => {
    setSelectedRegionWireFlow(regionWireFlow)
  }, [])

  const { closeSheet: closeSheetHandler } = useSheet()

  const handleCreateRegionWireFlow = useCallback(
    async (regionWireFlow: Omit<E2ERegionWireFlowModel, "id">) => {
      setError(null)
      setSuccessMessage(null)
      try {
        await createRegionWireFlowMutation.mutateAsync({
          body: regionWireFlow,
        })
        closeSheetHandler()
        await refetch()

        const regionWireFlowQueryKey = getApiV2SplunkDataGetAllActiveApplicationsApplicationOptions()
        await queryClient.invalidateQueries({ queryKey: regionWireFlowQueryKey })

        setSuccessMessage(`Region ${regionWireFlow?.region} successfully created`)
      } catch (error) {
        setError(`Failed to create Region: ${regionWireFlow?.region}`)
        throw error
      }
    },
    [createRegionWireFlowMutation, queryClient, refetch, closeSheetHandler],
  )

  const handleUpdateRegionWireFlow = useCallback(
    async (regionWireFlow: E2ERegionWireFlowModel) => {
      setError(null)
      setSuccessMessage(null)
      try {
        await updateRegionWireFlowMutation.mutateAsync({
          body: regionWireFlow,
          path: { id: regionWireFlow.id },
        })
        closeSheetHandler()
        await refetch()

        const regionWireFlowQueryKey = getApiV2SplunkDataGetAllActiveApplicationsApplicationOptions()
        await queryClient.invalidateQueries({ queryKey: regionWireFlowQueryKey })

        setSuccessMessage(`Region ${regionWireFlow?.region} successfully updated`)
      } catch (error) {
        setError(`Failed to update Region: ${regionWireFlow?.region}`)
        throw error
      }
    },
    [updateRegionWireFlowMutation, queryClient, refetch, closeSheetHandler],
  )

  const handleDeleteRegionWireFlow = useCallback(
    async (regionWireFlow: E2ERegionWireFlowModel) => {
      setError(null)
      setSuccessMessage(null)
      try {
        await deleteRegionWireFlowMutation.mutateAsync({
          query: { id: regionWireFlow?.id },
        })
        closeSheetHandler()
        await refetch()

        const regionWireFlowQueryKey = getApiV2SplunkDataGetAllActiveApplicationsApplicationOptions()
        await queryClient.invalidateQueries({ queryKey: regionWireFlowQueryKey })

        setSuccessMessage(`Region ${regionWireFlow?.region} successfully deleted`)
      } catch (error) {
        setError(`Failed to delete Region: ${regionWireFlow?.region} ${error}`)
        throw new Error(error as string)
      }
    },
    [deleteRegionWireFlowMutation, queryClient, refetch, closeSheetHandler],
  )

  return {
    handleSelectRegionWireFlow,
    handleUpdateRegionWireFlow,
    handleCreateRegionWireFlow,
    handleDeleteRegionWireFlow,
    handleSelectApp,
    setDeleteDialogOpen,
    deleteDialogOpen,
    deleteRegionWireFlowMutation,
    createRegionWireFlowMutation,
    updateRegionWireFlowMutation,
    regionWireFlow,
    error,
    selectedRegionWireFlow,
    successMessage,
    isLoading,
    isError,
    applications: applications as ApplicationModel[],
    isApplicationsLoading,
    refetch,
  }
}
