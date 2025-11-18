import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { Canvas } from './components/Canvas'
import { ViewCanvas } from './components/ViewCanvas'
import { Eye } from 'lucide-react'
import { MdSolarPower } from 'react-icons/md'

function Header() {
  const location = useLocation()
  const isViewMode = location.pathname === '/view'

  return (
    <header className="border-b bg-white p-3">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="flex items-center gap-2">
            <MdSolarPower className="text-[#1d5cc6]" size={24} />
            Criar Mapa de Tracker
          </h1>
          <p className="text-[12px] font-medium" style={{ color: '#76787d' }}>
            Crie e administre os lotes que fazem parte do seu projeto. Cada lote abarca trackers e módulos.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isViewMode ? (
            <Link
              to="/view"
                className="flex items-center gap-2 rounded-[12px] bg-[#1d5cc6] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Eye size={16} />
              Visualizar Mapa
            </Link>
          ) : (
            <Link
              to="/"
              className="flex items-center gap-2 rounded-[12px] bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors shadow-sm"
            >
              Voltar para Edição
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
      <div className="flex h-screen flex-col">
        <Header />
        <div className="min-h-0 flex-1">
          <Routes>
            <Route path="/" element={<Canvas />} />
            <Route path="/view" element={<ViewCanvas />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}
