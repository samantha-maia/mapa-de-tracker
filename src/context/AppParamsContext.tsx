import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

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
  const [params, setParams] = useState<AppParams>({
    projectId: null,
    fieldId: null,
    authToken: null,
  })

  useEffect(() => {
    // Captura os parâmetros da URL quando o componente monta
    const urlParams = new URLSearchParams(window.location.search)
    setParams({
      projectId: urlParams.get('projectId'),
      fieldId: urlParams.get('fieldId'),
      authToken: urlParams.get('authToken'),
    })
  }, [])

  return (
    <AppParamsContext.Provider value={params}>
      {children}
    </AppParamsContext.Provider>
  )
}

export function useAppParams() {
  return useContext(AppParamsContext)
}

