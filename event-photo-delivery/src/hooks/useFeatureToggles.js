import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateEventToggles } from '../lib/api'

export function useFeatureToggles(eventId, adminSecret) {
  const qc = useQueryClient()

  const toggleMutation = useMutation({
    mutationFn: (payload) => updateEventToggles(eventId, payload, adminSecret),
    onMutate: async (newToggles) => {
      // Optimistic update
      await qc.cancelQueries({ queryKey: ['event', eventId] })
      await qc.cancelQueries({ queryKey: ['eventConfig', eventId] })
      
      const prevEvent = qc.getQueryData(['event', eventId])
      
      if (prevEvent) {
        qc.setQueryData(['event', eventId], old => ({
          ...old,
          features: {
            ...(old?.features || {}),
            ...newToggles,
          },
        }))
      }
      
      return { prevEvent }
    },
    onError: (err, newToggles, context) => {
      // Revert on error
      if (context?.prevEvent) {
        qc.setQueryData(['event', eventId], context.prevEvent)
      }
    },
    onSettled: () => {
      // Refresh the event config so the UI and toggle_status updates
      qc.invalidateQueries({ queryKey: ['eventConfig', eventId] })
      qc.invalidateQueries({ queryKey: ['event', eventId] })
    },
  })

  return {
    updateToggles: toggleMutation.mutateAsync,
    isUpdating: toggleMutation.isPending,
  }
}
