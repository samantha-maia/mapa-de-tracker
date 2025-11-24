import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

interface AppParams {
  projectId: string | null
  fieldId: string | null
  authToken: string | null
}

const AppParamsContext = createContext<AppParams>({
  projectId: null,
  fieldId: null,
  authToken: null,
})

export function AppParamsProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const [params, setParams] = useState<AppParams>({
    projectId: null,
    fieldId: null,
    authToken: null,
  })

  useEffect(() => {
    // Captura os parâmetros da URL sempre que a location mudar
    const urlParams = new URLSearchParams(location.search)
    const newParams = {
      projectId: urlParams.get('projectId'),
      fieldId: urlParams.get('fieldId'),
      authToken: urlParams.get('authToken'),
    }
    
    console.log('[AppParamsContext] location.search mudou:', {
      locationSearch: location.search,
      newParams,
      currentParams: params,
      willUpdate: newParams.projectId !== null || newParams.fieldId !== null || newParams.authToken !== null
    })
    
    // Só atualiza se houver novos parâmetros na URL
    // Isso preserva os valores anteriores se a URL for limpa
    // IMPORTANTE: verifica explicitamente !== null para permitir fieldId = "0"
    if (newParams.projectId !== null || newParams.fieldId !== null || newParams.authToken !== null) {
      console.log('[AppParamsContext] Atualizando parâmetros:', { from: params, to: newParams })
      setParams(newParams)
      console.log('[AppParamsContext] Parâmetros atualizados com sucesso')
    } else {
      console.log('[AppParamsContext] Mantendo parâmetros anteriores (nenhum parâmetro na URL)')
    }
    // Se a URL não tem parâmetros mas já temos valores, mantém os valores anteriores
    // Isso evita perder os parâmetros se a URL for limpa acidentalmente
  }, [location.search])

  return (
    <AppParamsContext.Provider value={params}>
      {children}
    </AppParamsContext.Provider>
  )
}

export function useAppParams() {
  return useContext(AppParamsContext)
}

