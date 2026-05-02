import { useQuery } from '@tanstack/react-query'
import { getEventConfig } from '../lib/api'

export function useEventConfig(eventId) {
  return useQuery({
    queryKey: ['eventConfig', eventId],
    queryFn: () => getEventConfig(eventId),
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
