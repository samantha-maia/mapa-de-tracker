import { create } from 'zustand'
import type { ExternalTracker } from '../data/trackersCatalog'
import { TRACKERS_CATALOG } from '../data/trackersCatalog'

const API_URL = 'https://x4t7-ilri-ywed.n7d.xano.io/api:T9-pCDOs/trackers_0'

interface TrackersStore {
  trackers: ExternalTracker[]
  loading: boolean
  error: string | null
  fetchTrackers: (authToken?: string | null) => Promise<void>
  getTrackerById: (id: number) => ExternalTracker | undefined
}

export const useTrackersStore = create<TrackersStore>((set, get) => ({
  trackers: TRACKERS_CATALOG,
  loading: false,
  error: null,
  
  fetchTrackers: async (authToken?: string | null) => {
    // Evita apenas chamadas duplicadas simultâneas (se já estiver carregando)
    const state = get()
    if (state.loading) {
      return
    }
    
    set({ loading: true, error: null })
    
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }
      
      const response = await fetch(API_URL, { headers })
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar trackers: ${response.statusText}`)
      }
      
      const data: ExternalTracker[] = await response.json()
      
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

