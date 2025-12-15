import { useDraggable } from '@dnd-kit/core'
import { useState, useMemo, useEffect, useRef } from 'react'
import type { ExternalTracker } from '../data/trackersCatalog'
import { useTrackers } from '../hooks/useTrackers'
import { useI18n } from '../i18n'

type PaletteItemProps = { ext: ExternalTracker }

function PaletteItem({ ext }: PaletteItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ 
    id: `palette-ext-${ext.id}`, 
    data: { from: 'palette', ext } 
  })
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`cursor-grab active:cursor-grabbing select-none rounded border border-gray-200 p-1.5 text-xs bg-white hover:bg-gray-50 transition-all ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="font-medium text-gray-800 leading-tight">{ext._trackers_types.type}</div>
      <div className="text-[10px] text-gray-500 leading-tight">{ext._manufacturers.name}</div>
      <div className="text-[9px] text-gray-400 leading-tight">{ext.stake_quantity} estacas • {ext.max_modules} mód.</div>
    </div>
  )
}

export function Palette() {
  const { t } = useI18n()
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { trackers, loading, error } = useTrackers()

  const filteredTrackers = useMemo(() => {
    if (!searchTerm.trim()) return trackers
    
    const term = searchTerm.toLowerCase()
    return trackers.filter((t) => 
      t._trackers_types.type.toLowerCase().includes(term) ||
      t._manufacturers.name.toLowerCase().includes(term) ||
      t.stake_quantity.toString().includes(term) ||
      t.max_modules.toString().includes(term)
    )
  }, [searchTerm, trackers])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-700">{t('palette.title')}</h3>
      
      {/* Combobox */}
      <div className="relative" ref={dropdownRef}>
        {/* Botão que abre o dropdown */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between rounded border border-gray-300 bg-white px-3 py-2 text-sm text-left hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <span className="text-gray-700">
            {isOpen ? t('palette.close') : `${t('palette.select')} (${loading ? '...' : trackers.length} ${t('palette.available')})`}
          </span>
          <svg
            className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-300 bg-white shadow-lg max-h-96 overflow-hidden">
            {/* Campo de busca */}
            <div className="p-2 border-b border-gray-200">
              <input
                type="text"
                placeholder={t('palette.search.placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>

            {/* Lista de trackers */}
            <div className="overflow-y-auto max-h-80">
              {loading ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  {t('palette.loading')}
                </div>
              ) : error ? (
                <div className="p-4 text-center text-sm text-red-500">
                  {t('palette.error')}: {error}
                </div>
              ) : filteredTrackers.length > 0 ? (
                <div className="p-1.5 space-y-1">
                  {filteredTrackers.map((tracker) => (
                    <PaletteItem key={tracker.id} ext={tracker} />
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-gray-500">
                  {t('palette.empty')}
                </div>
              )}
            </div>

            {/* Footer com contador */}
            {searchTerm && !loading && (
              <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-200 bg-gray-50">
                {filteredTrackers.length} {t('palette.count')} {trackers.length}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


