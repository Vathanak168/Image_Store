import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listTables, configureTables, updateTable, uploadTablePhotos } from '../lib/api'

export function useTables(eventId, adminSecret = null) {
  const queryClient = useQueryClient()
  const queryKey = ['tables', eventId]

  const tablesQuery = useQuery({
    queryKey,
    queryFn: () => listTables(eventId, adminSecret),
    enabled: !!eventId,
  })

  // We keep update for individual table labels
  const updateMutation = useMutation({
    mutationFn: ({ tableId, payload }) => updateTable(eventId, tableId, payload, adminSecret),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  return {
    tables: tablesQuery.data || [],
    isLoading: tablesQuery.isLoading,
    error: tablesQuery.error,
    updateTable: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  }
}

export function useConfigureTables(eventId, adminSecret = null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (config) => configureTables(eventId, config, adminSecret),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tables', eventId] })
      qc.invalidateQueries({ queryKey: ['eventConfig', eventId] })
      qc.invalidateQueries({ queryKey: ['event', eventId] })
    },
  })
}

export function useUploadTablePhotos(eventId, tableId, adminSecret = null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (files) => uploadTablePhotos(eventId, tableId, files, adminSecret),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tables', eventId] })
    },
  })
}
