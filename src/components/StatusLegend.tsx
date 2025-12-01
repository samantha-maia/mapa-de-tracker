import { useState, useRef, useEffect } from 'react'
import { X, GripVertical } from 'lucide-react'
import { getStatusColor } from '../utils/statusColors'

const STATUS_DESCRIPTIONS: Record<number, string> = {
  1: 'Não cravada',
  2: 'Cravada com Sucesso',
  3: 'Cravada com problema mas sem impeditivo para montagem do tracker',
  4: 'Problema que impede a montagem do tracker',
  5: 'Módulos montados',
  6: 'Aguardando inspeção',
  7: 'Inspeção reprovada',
}

type StatusLegendProps = {
  compact?: boolean
  onClose?: () => void
  position?: { x: number; y: number }
  onPositionChange?: (position: { x: number; y: number }) => void
}

export function StatusLegend({ compact = false, onClose, position, onPositionChange }: StatusLegendProps) {
  const statusIds = [1, 2, 3, 4, 5, 6, 7] as const
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ mouseX: number; mouseY: number; elementX: number; elementY: number } | null>(null)
  const [currentPosition, setCurrentPosition] = useState(position || { x: 16, y: 16 })
  const legendRef = useRef<HTMLDivElement>(null)
  const DRAG_THRESHOLD = 5 // pixels de movimento antes de iniciar o drag

  // Sincroniza posição externa
  useEffect(() => {
    if (position) {
      setCurrentPosition(position)
    }
  }, [position])

  // Handle drag com threshold
  useEffect(() => {
    if (!compact || !dragStart) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!legendRef.current) return
      
      const deltaX = e.clientX - dragStart.mouseX
      const deltaY = e.clientY - dragStart.mouseY
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      
      // Só inicia o drag se o mouse se moveu além do threshold
      if (!isDragging && distance > DRAG_THRESHOLD) {
        setIsDragging(true)
      }
      
      // Só move o elemento se o drag foi iniciado
      if (isDragging) {
        e.preventDefault()
        const newX = dragStart.elementX + deltaX
        const newY = dragStart.elementY + deltaY
        
        // Limita dentro da viewport
        const maxX = window.innerWidth - (legendRef.current?.offsetWidth || 0)
        const maxY = window.innerHeight - (legendRef.current?.offsetHeight || 0)
        
        const clampedX = Math.max(0, Math.min(newX, maxX))
        const clampedY = Math.max(0, Math.min(newY, maxY))
        
        const newPosition = { x: clampedX, y: clampedY }
        setCurrentPosition(newPosition)
        onPositionChange?.(newPosition)
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setDragStart(null)
    }

    document.addEventListener('mousemove', handleMouseMove, { passive: false })
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragStart, compact, onPositionChange])

  const handleDragStart = (e: React.MouseEvent) => {
    if (!legendRef.current) return
    e.preventDefault()
    // Usa a posição atual do elemento (em CSS) em vez de getBoundingClientRect
    // Isso evita discrepâncias entre a posição CSS e a posição da viewport
    setDragStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      elementX: currentPosition.x,
      elementY: currentPosition.y
    })
    setIsDragging(false) // Começa como false, só vira true após threshold
  }

  if (compact) {
    // Versão compacta para ViewCanvas (arrastável e fechável)
    return (
      <div
        ref={legendRef}
        className="absolute rounded-lg border border-gray-200 bg-white shadow-lg max-w-xs z-50 select-none"
        style={{
          left: `${currentPosition.x}px`,
          top: `${currentPosition.y}px`,
          cursor: isDragging ? 'grabbing' : 'default'
        }}
      >
        {/* Header com drag handle e botão fechar */}
        <div
          className="flex items-center justify-between px-3 py-2 border-b border-gray-200 cursor-move"
          onMouseDown={handleDragStart}
        >
          <div className="flex items-center gap-2">
            <GripVertical size={14} className="text-gray-400" />
            <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Legenda de Status
            </div>
          </div>
          {onClose && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Fechar legenda"
            >
              <X size={14} className="text-gray-500" />
            </button>
          )}
        </div>
        
        {/* Content */}
        <div className="p-3">
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
            {statusIds.map((statusId) => {
              const color = getStatusColor(statusId)
              const description = STATUS_DESCRIPTIONS[statusId]
              return (
                <div key={statusId} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-sm flex-shrink-0 border border-gray-300"
                    style={{ backgroundColor: color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-gray-600 leading-tight">
                      {description}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // Versão completa para Canvas (barra lateral)
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm">
      <h4 className="text-[11px] font-medium text-gray-600 mb-2">
        Legenda de Status
      </h4>
      <div className="space-y-1.5">
        {statusIds.map((statusId) => {
          const color = getStatusColor(statusId)
          const description = STATUS_DESCRIPTIONS[statusId]
          return (
            <div key={statusId} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-sm flex-shrink-0 border border-gray-300"
                style={{ backgroundColor: color }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-gray-600 leading-tight">
                  {description}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

