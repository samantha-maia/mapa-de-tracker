export type ExternalTracker = {
  id: number
  stake_quantity: number
  max_modules: number
  created_at: number
  updated_at: number
  deleted_at: number | null
  trackers_types_id: number
  manufacturers_id: number
  _trackers_types: { id: number; type: string }
  _manufacturers: { id: number; name: string }
}

// Catálogo estático usado como fallback quando a API falha
export const TRACKERS_CATALOG: ExternalTracker[] = []


