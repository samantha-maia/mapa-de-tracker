import { create } from 'zustand'
import type { ExternalTracker } from '../data/trackersCatalog'
import { TRACKERS_CATALOG } from '../data/trackersCatalog'
import { apiRequest, API_ROUTES } from '../services/apiClient'

interface TrackersStore {
  trackers: ExternalTracker[]
  loading: boolean
  error: string | null
  fetchTrackers: (companyId?: string | number | null, authToken?: string | null) => Promise<void>
  getTrackerById: (id: number) => ExternalTracker | undefined
}

export const useTrackersStore = create<TrackersStore>((set, get) => ({
  trackers: TRACKERS_CATALOG,
  loading: false,
  error: null,
  
  fetchTrackers: async (companyId?: string | number | null, authToken?: string | null) => {
    // Evita apenas chamadas duplicadas simultâneas (se já estiver carregando)
    const state = get()
    if (state.loading) {
      return
    }
    
    set({ loading: true, error: null })
    
    try {
      const data = await apiRequest<ExternalTracker[]>(API_ROUTES.trackersCatalog, {
        query: {
          company_id: companyId ?? undefined,
        },
        authToken,
      })
      
      // Filtrar apenas trackers que não foram deletados
      const activeTrackers = data.filter(t => t.deleted_at === null)
      
      set({ trackers: activeTrackers, loading: false })
    } catch (err) {
      console.error('Erro ao buscar trackers da API:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      set({ 
        error: errorMessage, 
        loading: false,
        // Em caso de erro, mantém o catálogo estático como fallback
        trackers: TRACKERS_CATALOG 
      })
    }
  },
  
  getTrackerById: (id: number) => {
    return get().trackers.find(t => t.id === id)
  }
}))

