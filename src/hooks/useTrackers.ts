import { useTrackersStore } from '../store/trackersStore'

export function useTrackers() {
  const { trackers, loading, error } = useTrackersStore()

  return { trackers, loading, error }
}

