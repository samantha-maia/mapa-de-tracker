import { useDraggable } from '@dnd-kit/core'
import type { Tracker as TrackerModel } from '../store/layoutStore'
import { useLayoutStore } from '../store/layoutStore'
import { getStatusColor } from '../utils/statusColors'
import { getTrackerStatusColor } from '../utils/trackerStatusColor'
import { X } from 'lucide-react'

type Props = {
  tracker: TrackerModel
  selected?: boolean
  viewMode?: boolean
}

// Converte cor HEX para rgba com opacidade
function hexToRgba(hex: string, opacity: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return hex
  const r = parseInt(result[1], 16)
  const g = parseInt(result[2], 16)
  const b = parseInt(result[3], 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

export function Tracker({ tracker, selected, viewMode = false }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ 
    id: tracker.id, 
    data: { from: 'loose', id: tracker.id },
    disabled: viewMode
  })
  const removeTracker = useLayoutStore((s) => s.removeTracker)
  const stakeSize = 20
  const stakeGap = 2
  const headerH = 10
  const stakeCount = tracker.ext?.stake_quantity ?? 0
  const dynamicH = stakeCount > 0 ? headerH + 5 + stakeCount * (stakeSize + stakeGap) : 80
  const trackerStatusColor = getTrackerStatusColor(tracker.stakeStatusIds)
  
  return (
    <div className="relative group">
      <div
        ref={viewMode ? undefined : setNodeRef}
        {...(viewMode ? {} : attributes)}
        {...(viewMode ? {} : listeners)}
        className={`pointer-events-auto select-none rounded p-2  text-xs shadow-sm ${
          selected ? 'ring-2 ring-blue-500' : ''
        } ${isDragging ? 'opacity-50' : ''}`}
        style={{ 
          width: 30, 
          height: dynamicH,
          borderColor: trackerStatusColor.color,
          borderWidth: '1px',
          borderStyle: 'solid',
          backgroundColor: hexToRgba(trackerStatusColor.color, 0.1), // Background com 10% de opacidade
        }}
      >
        {tracker.ext ? (
          <div className="flex flex-col items-center" style={{ gap: stakeGap }}>
            {Array.from({ length: tracker.ext.stake_quantity }).map((_, i) => {
              const statusId = tracker.stakeStatusIds?.[i]
              const color = getStatusColor(statusId)
              return (
                <div 
                  key={i} 
                  style={{ 
                    width: stakeSize, 
                    height: stakeSize, 
                    backgroundColor: color,
                    opacity: 1, // Força opacidade total
                    border: viewMode ? '1px solid rgba(255, 255, 255, 1)' : 'none'
                  }} 
                  className="rounded-sm"
                />
              )
            })}
          </div>
        ) : null}
      </div>
      {!viewMode && (
        <button
          className="absolute -right-1.5 -top-1.5 flex items-center justify-center h-4 w-4 rounded-full bg-red-500/90 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-sm z-10"
          onClick={(e) => {
            e.stopPropagation()
            removeTracker(tracker.id)
          }}
          onMouseDown={(e) => e.stopPropagation()}
          aria-label="Remover tracker"
          title="Remover tracker"
        >
          <X size={10} strokeWidth={2.5} />
        </button>
      )}
    </div>
  )
}


