import { BrowserRouter, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom'
import { Canvas } from './components/Canvas'
import { ViewCanvas } from './components/ViewCanvas'
import { FieldSelector } from './components/FieldSelector'
import { Eye } from 'lucide-react'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import { MdSolarPower } from 'react-icons/md'
import { AppParamsProvider, useAppParams } from './context/AppParamsContext'
import { useEffect } from 'react'
import { useFieldsStore } from './store/fieldsStore'
import { useTrackersStore } from './store/trackersStore'

function Header() {
  const location = useLocation()
  const isViewMode = location.pathname === '/view'
  const appParams = useAppParams()
  const fields = useFieldsStore((s) => s.fields)
  
  // Determina se é criação ou edição baseado no fieldId
  // Prioriza o contexto (que persiste) sobre a URL (que pode ser limpa)
  const urlParams = new URLSearchParams(location.search)
  const urlFieldId = urlParams.get('fieldId')
  const urlMode = urlParams.get('mode')
  
  // Usa o contexto primeiro, depois a URL como fallback
  // EXCEÇÃO: em modo criação explícito (fieldId=0 + mode=create), prioriza sempre a URL
  // para evitar que o fieldId anterior do contexto "vaze" para a tela de criação.
  let fieldIdToUse: string | null
  if (urlFieldId === '0' && urlMode === 'create') {
    fieldIdToUse = '0'
  } else {
    // IMPORTANTE: verifica explicitamente !== null para permitir fieldId = "0"
    fieldIdToUse = appParams.fieldId !== null ? appParams.fieldId : urlFieldId
  }
  const fieldIdNum = fieldIdToUse !== null ? parseInt(fieldIdToUse, 10) : null
  
  const isEditMode = fieldIdNum !== null && !isNaN(fieldIdNum) && fieldIdNum !== 0
  const isCreateMode = fieldIdNum === 0
  const currentField =
    fieldIdNum !== null && !isNaN(fieldIdNum)
      ? fields.find((f) => f.id === fieldIdNum)
      : undefined

  // Constrói a URL com os parâmetros preservados
  const buildUrlWithParams = (path: string, mode?: 'create' | 'edit' | 'view') => {
    const params = new URLSearchParams()
    // IMPORTANTE: verifica explicitamente !== null para permitir valores "0"
    if (appParams.projectId !== null) params.set('projectId', appParams.projectId)
    if (appParams.companyId !== null) params.set('companyId', appParams.companyId)
    if (appParams.fieldId !== null) params.set('fieldId', appParams.fieldId)
    if (appParams.authToken !== null) params.set('authToken', appParams.authToken)
    if (mode) params.set('mode', mode)
    const queryString = params.toString()
    return queryString ? `${path}?${queryString}` : path
  }

  // Título baseado no modo
  const getTitle = () => {
    if (isViewMode) return 'Visualizar Mapa de Tracker'
    if (isEditMode) return 'Editar Mapa de Tracker'
    if (isCreateMode) return 'Criar Mapa de Tracker'
    return 'Criar Mapa de Tracker' // Default
  }

  // Descrição baseada no modo
  const getDescription = () => {
    if (isViewMode) return 'Visualize o mapa de trackers do projeto. Modo somente leitura.'
    if (isEditMode) return 'Edite e administre os lotes que fazem parte do seu projeto. Cada lote abarca trackers e módulos.'
    if (isCreateMode) return 'Crie e administre os lotes que fazem parte do seu projeto. Cada lote abarca trackers e módulos.'
    return 'Crie e administre os lotes que fazem parte do seu projeto. Cada lote abarca trackers e módulos.' // Default
  }

  return (
    <header className="border-b border-[#daeef6] border-solid-1 bg-white pt-3 pr-3 pb-3">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="flex flex-wrap items-center gap-2 text-lg font-semibold text-gray-900">
            <MdSolarPower className="text-[#1d5cc6]" size={24} />
            <span>{getTitle()}</span>
            {currentField?.name && (
              <>
                <span>:</span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-medium text-gray-700">{currentField.name}</span>
                  <div id="field-name-editor-slot" className="flex items-center gap-2" />
                  <button
                    className="group flex items-center justify-center transition-colors border border-[#dadee6] bg-transparent hover:bg-[#487eda] hover:border-[#487eda]"
                    style={{ width: '28px', height: '28px', borderRadius: '6px', borderWidth: '0.5px' }}
                    title="Renomear campo"
                    onClick={() => window.dispatchEvent(new Event('field-selector-edit'))}
                  >
                    <EditRoundedIcon style={{ fontSize: 16 }} className="text-[#1d5cc6] group-hover:text-white" />
                  </button>
                </div>
              </>
            )}
          </h1>
          <p className="text-[12px] font-medium" style={{ color: '#76787d' }}>
            {getDescription()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isViewMode ? (
            <Link
              to={buildUrlWithParams('/view', 'view')}
              className="flex items-center gap-2 h-10 rounded-[12px] bg-[#1d5cc6] px-4 text-xs font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Eye size={16} />
              Visualizar Mapa
            </Link>
          ) : (
            <Link
              to={buildUrlWithParams('/', isEditMode ? 'edit' : 'create')}
              className="flex items-center gap-2 h-10 rounded-[12px] bg-gray-600 px-4 text-xs font-medium text-white hover:bg-gray-700 transition-colors shadow-sm"
            >
              Editar
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

// Componente para redirecionar automaticamente para /view quando URL tiver todos os parâmetros
function AutoRedirectToView() {
  const location = useLocation()
  const navigate = useNavigate()
  const appParams = useAppParams()

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const mode = urlParams.get('mode')
    const hasModeParam = urlParams.has('mode') // Verifica se mode está presente (mesmo que vazio)
    // IMPORTANTE: verifica explicitamente !== null para permitir valores "0"
    const projectId = urlParams.get('projectId') !== null ? urlParams.get('projectId') : appParams.projectId
    const companyId = urlParams.get('companyId') !== null ? urlParams.get('companyId') : appParams.companyId
    const fieldId = urlParams.get('fieldId') !== null ? urlParams.get('fieldId') : appParams.fieldId
    const authToken = urlParams.get('authToken') !== null ? urlParams.get('authToken') : appParams.authToken

    // Se não tiver fieldId, não faz nada (deixa o usuário escolher)
    if (!fieldId) {
      return
    }

    const fieldIdNum = parseInt(fieldId, 10)
    
    // Se fieldId=0 e mode está presente (mesmo que vazio), deixa o FieldSelector tratar (ele vai selecionar o primeiro campo)
    if (fieldIdNum === 0 && hasModeParam) {
      return
    }
    
    if (isNaN(fieldIdNum) || fieldIdNum === 0) {
      return
    }

    // Se mode=view está presente na URL, sempre redireciona para /view
    if (mode === 'view') {
      if (location.pathname !== '/view') {
        // Preserva os parâmetros na URL ao redirecionar
        const params = new URLSearchParams()
        if (projectId) params.set('projectId', projectId)
        if (companyId) params.set('companyId', companyId)
        if (fieldId) params.set('fieldId', fieldId)
        if (authToken) params.set('authToken', authToken)
        params.set('mode', 'view')
        navigate(`/view?${params.toString()}`, { replace: true })
      }
      return
    }

    // Se estiver na rota raiz (/) e tiver todos os parâmetros, e não tiver mode=edit ou mode=create, redireciona para /view
    if (location.pathname === '/') {
      if (projectId && companyId && fieldId && authToken && mode !== 'edit' && mode !== 'create') {
        // Preserva os parâmetros na URL ao redirecionar e adiciona mode=view
        const params = new URLSearchParams()
        params.set('projectId', projectId)
        params.set('companyId', companyId)
        params.set('fieldId', fieldId)
        params.set('authToken', authToken)
        params.set('mode', 'view')
        navigate(`/view?${params.toString()}`, { replace: true })
      }
    }
  }, [location.pathname, location.search, appParams, navigate])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <AppParamsProvider>
        <AutoRedirectToView />
        <AppContent />
      </AppParamsProvider>
    </BrowserRouter>
  )
}

function AppContent() {
  const location = useLocation()
  const appParams = useAppParams()
  
  // Carrega trackers sempre que a aplicação abrir ou authToken mudar
  useEffect(() => {
    useTrackersStore.getState().fetchTrackers(appParams.authToken)
  }, [appParams.authToken])
  
  // Verifica se há um fieldId selecionado (pode ser "0" para criar novo)
  const urlParams = new URLSearchParams(location.search)
  const urlFieldId = urlParams.get('fieldId')
  const fieldIdToUse = appParams.fieldId !== null ? appParams.fieldId : urlFieldId
  const mode = urlParams.get('mode')
  
  // Verifica se mode está presente na URL (mesmo que vazio) - indica que veio do FlutterFlow
  const hasModeParam = urlParams.has('mode')
  
  const isCreateMode = fieldIdToUse === '0' && mode === 'create'
  const isViewWaitingSelection = fieldIdToUse === '0' && mode === 'view'
  const isFieldZeroWithoutCreate = fieldIdToUse === '0' && !isCreateMode && !isViewWaitingSelection && !hasModeParam
  
  // Mostra o conteúdo quando há fieldId válido ou quando estiver no modo create explícito (fieldId=0 + mode=create)
  const hasFieldSelected =
    fieldIdToUse !== null &&
    (fieldIdToUse !== '0' || isCreateMode)

  useEffect(() => {
    console.log('[AppContent] estado da seleção', {
      urlFieldId,
      appFieldId: appParams.fieldId,
      fieldIdToUse,
      mode,
      hasModeParam,
      isCreateMode,
      isViewWaitingSelection,
      isFieldZeroWithoutCreate,
      hasFieldSelected,
    })
  }, [urlFieldId, appParams.fieldId, fieldIdToUse, mode, hasModeParam, isFieldZeroWithoutCreate, hasFieldSelected])

  return (
    <div className="flex h-screen flex-col">
      <FieldSelector />
      {hasFieldSelected && (
        <>
          <Header />
          <div className="min-h-0 flex-1">
            <Routes>
              <Route path="/" element={<Canvas />} />
              <Route path="/view" element={<ViewCanvas />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </>
      )}
      {!hasFieldSelected && (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <p className="text-gray-600 text-lg mb-2">Selecione um campo para começar</p>
            <p className="text-gray-500 text-sm">Escolha um campo existente ou crie um novo campo</p>
          </div>
        </div>
      )}
    </div>
  )
}
