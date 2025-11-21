import { useDraggable } from '@dnd-kit/core'
import type { Tracker as TrackerModel } from '../store/layoutStore'
import { useLayoutStore } from '../store/layoutStore'
import { getStatusColor } from '../utils/statusColors'

type Props = {
  tracker: TrackerModel
  selected?: boolean
  viewMode?: boolean
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
  const dynamicH = stakeCount > 0 ? headerH + stakeCount * (stakeSize + stakeGap) : 80
  
  return (
    <div className="relative">
      <div
        ref={viewMode ? undefined : setNodeRef}
        {...(viewMode ? {} : attributes)}
        {...(viewMode ? {} : listeners)}
        className={`pointer-events-auto select-none rounded border bg-white p-2 text-xs shadow-sm ${
          selected ? 'ring-2 ring-blue-500' : ''
        } ${isDragging ? 'opacity-50' : ''}`}
        style={{ width: 30, height: dynamicH }}
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
                    border: viewMode ? '1px solid rgba(0, 0, 0, 0.15)' : 'none'
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
          className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-red-600 text-[10px] font-bold text-white"
          onClick={() => removeTracker(tracker.id)}
          aria-label="Remover"
        >×</button>
      )}
    </div>
  )
}


