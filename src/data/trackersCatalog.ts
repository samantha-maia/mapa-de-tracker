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
export const TRACKERS_CATALOG: ExternalTracker[] = [
  {"id":1,"stake_quantity":6,"max_modules":3,"created_at":1753714091314,"updated_at":1753714091314,"deleted_at":null,"trackers_types_id":6,"manufacturers_id":1,"_trackers_types":{"id":6,"type":"Tracker 1"},"_manufacturers":{"id":1,"name":"Fabricante A"}},
  {"id":3,"stake_quantity":15,"max_modules":5,"created_at":1754592921146,"updated_at":1756238387123,"deleted_at":null,"trackers_types_id":2,"manufacturers_id":2,"_trackers_types":{"id":2,"type":"Tracker B"},"_manufacturers":{"id":2,"name":"WEG"}},
  {"id":5,"stake_quantity":11,"max_modules":20,"created_at":1759254657938,"updated_at":1759254657938,"deleted_at":null,"trackers_types_id":4,"manufacturers_id":3,"_trackers_types":{"id":4,"type":"PTTTO"},"_manufacturers":{"id":3,"name":"NX"}},
  {"id":6,"stake_quantity":2,"max_modules":1,"created_at":1759519697989,"updated_at":1759519697989,"deleted_at":null,"trackers_types_id":4,"manufacturers_id":2,"_trackers_types":{"id":4,"type":"PTTTO"},"_manufacturers":{"id":2,"name":"WEG"}}
]


