import { create } from 'zustand'

export interface Field {
  id: number
  name?: string
  field_number?: number
  projects_id: number
  created_at?: string
  updated_at?: string
}

interface FieldsStore {
  fields: Field[]
  loading: boolean
  error: string | null
  fetchFields: (projectId: number, authToken?: string | null) => Promise<void>
  getFieldById: (id: number) => Field | undefined
  updateFieldName: (fieldId: number, name: string, authToken?: string | null) => Promise<{ success: boolean; error?: string }>
  deleteField: (fieldId: number, authToken?: string | null) => Promise<{ success: boolean; error?: string }>
}

const FIELDS_API_URL = 'https://x4t7-ilri-ywed.n7d.xano.io/api:6L6t8cws/fields'

const getFieldsApiUrl = (projectId: number) => {
  // Adiciona projectId como query parameter se necessário
  return `${FIELDS_API_URL}?projects_id=${projectId}`
}

export const useFieldsStore = create<FieldsStore>((set, get) => ({
  fields: [],
  loading: false,
  error: null,
  
  fetchFields: async (projectId: number, authToken?: string | null) => {
    set({ loading: true, error: null })
    
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }
      
      const response = await fetch(getFieldsApiUrl(projectId), { headers })
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar campos: ${response.statusText}`)
      }
      
      const data: Field[] = await response.json()
      
      // Filtrar apenas campos que não foram deletados (se houver campo deleted_at)
      const activeFields = data.filter((f: any) => f.deleted_at === null || f.deleted_at === undefined)
      
      set({ fields: activeFields, loading: false })
    } catch (err) {
      console.error('Erro ao buscar campos da API:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      set({ 
        error: errorMessage, 
        loading: false,
        fields: []
      })
    }
  },
  
  getFieldById: (id: number) => {
    return get().fields.find(f => f.id === id)
  },

  updateFieldName: async (fieldId: number, name: string, authToken?: string | null) => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }
      
      const response = await fetch('https://x4t7-ilri-ywed.n7d.xano.io/api:6L6t8cws/field_name', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          name: name,
          fields_id: fieldId
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Erro ao atualizar campo: ${response.statusText} - ${errorText}`)
      }
      
      const updatedField: Field = await response.json()
      
      // Atualiza o campo na lista
      set((state) => ({
        fields: state.fields.map(f => f.id === fieldId ? updatedField : f)
      }))
      
      return { success: true }
    } catch (err) {
      console.error('Erro ao atualizar campo:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      return { 
        success: false, 
        error: errorMessage
      }
    }
  },

  deleteField: async (fieldId: number, authToken?: string | null) => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }

      const response = await fetch(`${FIELDS_API_URL}/${fieldId}`, {
        method: 'DELETE',
        headers,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Erro ao excluir campo: ${response.statusText} - ${errorText}`)
      }

      set((state) => ({
        fields: state.fields.filter((f) => f.id !== fieldId),
      }))

      return { success: true }
    } catch (err) {
      console.error('Erro ao excluir campo:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      return {
        success: false,
        error: errorMessage,
      }
    }
  }
}))

