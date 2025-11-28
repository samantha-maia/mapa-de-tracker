import { create } from 'zustand'
import { apiRequest, API_ROUTES } from '../services/apiClient'

export interface Field {
  id: number
  name?: string
  field_number?: number
  projects_id: number
  created_at?: number | string
  updated_at?: string
}

interface FieldsStore {
  fields: Field[]
  loading: boolean
  error: string | null
  fetchFields: (projectId: number, companyId: number, authToken?: string | null) => Promise<void>
  getFieldById: (id: number) => Field | undefined
  updateFieldName: (fieldId: number, name: string, authToken?: string | null) => Promise<{ success: boolean; error?: string }>
  deleteField: (fieldId: number, authToken?: string | null) => Promise<{ success: boolean; error?: string }>
}

export const useFieldsStore = create<FieldsStore>((set, get) => ({
  fields: [],
  loading: false,
  error: null,
  
  fetchFields: async (projectId: number, companyId: number, authToken?: string | null) => {
    set({ loading: true, error: null })
    
    if (!Number.isFinite(companyId)) {
      set({ 
        error: 'Company ID inválido',
        loading: false,
        fields: []
      })
      return
    }
    
    try {
      const data = await apiRequest<Field[]>(API_ROUTES.fields(companyId), {
        authToken,
        query: { projects_id: projectId },
      })
      
      // Filtrar apenas campos que não foram deletados (se houver campo deleted_at)
      // Preserva todos os campos incluindo created_at
      const activeFields = data
        .filter((f: any) => f.deleted_at === null || f.deleted_at === undefined)
        .map((f: any) => ({
          ...f,
          // Garante que created_at seja preservado como número se vier como número
          created_at: f.created_at !== undefined && f.created_at !== null ? f.created_at : undefined
        }))
      
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
      const updatedField = await apiRequest<Field>(API_ROUTES.fieldName, {
        method: 'PUT',
        authToken,
        body: {
          name: name,
          fields_id: fieldId,
        },
      })
      
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
      await apiRequest(`${API_ROUTES.fieldsBase}/${fieldId}`, {
        method: 'DELETE',
        authToken,
      })

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

