import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateEventToggles } from '../lib/api'

export function useFeatureToggles(eventId, adminSecret) {
  const queryClient = useQueryClient()

  const toggleMutation = useMutation({
    mutationFn: (payload) => updateEventToggles(eventId, payload, adminSecret),
    onSuccess: () => {
      // Refresh the event config so the UI updates
      queryClient.invalidateQueries({ queryKey: ['eventConfig', eventId] })
      // Also refresh any full event queries if they exist
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
    },
  })

  return {
    updateToggles: toggleMutation.mutateAsync,
    isUpdating: toggleMutation.isPending,
  }
}
