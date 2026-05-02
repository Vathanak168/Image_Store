import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listTables, createTable, updateTable, deleteTable } from '../lib/api'

export function useTables(eventId, adminSecret = null) {
  const queryClient = useQueryClient()
  const queryKey = ['tables', eventId]

  const tablesQuery = useQuery({
    queryKey,
    queryFn: () => listTables(eventId, adminSecret),
    enabled: !!eventId,
  })

  const createMutation = useMutation({
    mutationFn: (payload) => createTable(eventId, payload, adminSecret),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ tableId, payload }) => updateTable(eventId, tableId, payload, adminSecret),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const deleteMutation = useMutation({
    mutationFn: (tableId) => deleteTable(eventId, tableId, adminSecret),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  return {
    tables: tablesQuery.data || [],
    isLoading: tablesQuery.isLoading,
    error: tablesQuery.error,
    createTable: createMutation.mutateAsync,
    updateTable: updateMutation.mutateAsync,
    deleteTable: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
