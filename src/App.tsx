import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { Canvas } from './components/Canvas'
import { ViewCanvas } from './components/ViewCanvas'
import { Eye } from 'lucide-react'
import { MdSolarPower } from 'react-icons/md'
import { AppParamsProvider, useAppParams } from './context/AppParamsContext'

function Header() {
  const location = useLocation()
  const isViewMode = location.pathname === '/view'
  const appParams = useAppParams()
  
  // Determina se é criação ou edição baseado no fieldId
  // Prioriza o contexto (que persiste) sobre a URL (que pode ser limpa)
  const urlParams = new URLSearchParams(location.search)
  const urlFieldId = urlParams.get('fieldId')
  
  // Usa o contexto primeiro, depois a URL como fallback
  const fieldIdToUse = appParams.fieldId || urlFieldId
  const fieldIdNum = fieldIdToUse ? parseInt(fieldIdToUse, 10) : null
  
  const isEditMode = fieldIdNum !== null && !isNaN(fieldIdNum) && fieldIdNum !== 0
  const isCreateMode = fieldIdNum === 0

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
          <h1 className="flex items-center gap-2">
            <MdSolarPower className="text-[#1d5cc6]" size={24} />
            {getTitle()}
          </h1>
          <p className="text-[12px] font-medium" style={{ color: '#76787d' }}>
            {getDescription()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isViewMode ? (
            <Link
              to="/view"
                className="flex items-center gap-2 h-10 rounded-[12px] bg-[#1d5cc6] px-4 text-xs font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Eye size={16} />
              Visualizar Mapa
            </Link>
          ) : (
            <Link
              to="/"
              className="flex items-center gap-2 h-10 rounded-[12px] bg-gray-600 px-4 text-xs font-medium text-white hover:bg-gray-700 transition-colors shadow-sm"
            >
              {isEditMode ? 'Voltar para Edição' : 'Voltar para Criação'}
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppParamsProvider>
        <div className="flex h-screen flex-col">
          <Header />
          <div className="min-h-0 flex-1">
            <Routes>
              <Route path="/" element={<Canvas />} />
              <Route path="/view" element={<ViewCanvas />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </AppParamsProvider>
    </BrowserRouter>
  )
}
