import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

interface AppParams {
  projectId: string | null
  companyId: string | null
  fieldId: string | null
  authToken: string | null
}

const AppParamsContext = createContext<AppParams>({
  projectId: null,
  companyId: null,
  fieldId: null,
  authToken: null,
})

export function AppParamsProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const [params, setParams] = useState<AppParams>({
    projectId: null,
    companyId: null,
    fieldId: null,
    authToken: null,
  })

  useEffect(() => {
    // Captura os parâmetros da URL sempre que a location mudar
    const urlParams = new URLSearchParams(location.search)
    const newParams = {
      projectId: urlParams.get('projectId'),
      companyId: urlParams.get('companyId'),
      fieldId: urlParams.get('fieldId'),
      authToken: urlParams.get('authToken'),
    }
    
    // Só atualiza se houver novos parâmetros na URL
    // Isso preserva os valores anteriores se a URL for limpa
    // IMPORTANTE: verifica explicitamente !== null para permitir fieldId = "0"
    if (newParams.projectId !== null || newParams.companyId !== null || newParams.fieldId !== null || newParams.authToken !== null) {
      setParams(newParams)
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

