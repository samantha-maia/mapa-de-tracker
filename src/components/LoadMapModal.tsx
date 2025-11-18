import { useState } from 'react'

type Props = {
  isOpen: boolean
  onClose: () => void
  onLoad: (projectsId: number, fieldsId: number) => void
  isLoading?: boolean
}

export function LoadMapModal({ isOpen, onClose, onLoad, isLoading = false }: Props) {
  const [projectsId, setProjectsId] = useState('7')
  const [fieldsId, setFieldsId] = useState('12')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const projId = parseInt(projectsId, 10)
    const fldId = parseInt(fieldsId, 10)
    
    if (isNaN(projId) || isNaN(fldId)) {
      alert('Por favor, insira valores numéricos válidos')
      return
    }
    
    onLoad(projId, fldId)
  }

  return (
    <>
      {/* Overlay escuro */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-[999]"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-[1000] pointer-events-none flex items-center justify-center">
        <div 
          className="relative bg-white rounded-lg shadow-2xl p-6 pointer-events-auto max-w-md w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Carregar Mapa da API</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isLoading}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {isLoading ? (
            <div className="py-8 flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-600">Carregando mapa da API...</p>
              <p className="text-xs text-gray-400">Isso pode levar alguns segundos</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="projects_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Projects ID
                </label>
                <input
                  id="projects_id"
                  type="number"
                  value={projectsId}
                  onChange={(e) => setProjectsId(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="7"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="fields_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Fields ID
                </label>
                <input
                  id="fields_id"
                  type="number"
                  value={fieldsId}
                  onChange={(e) => setFieldsId(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="12"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-[12px] hover:bg-gray-400 transition-colors font-medium"
                  disabled={isLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-[12px] hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  Carregar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  )
}

