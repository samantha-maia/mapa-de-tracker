import { useDroppable, useDraggable } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useLayoutStore } from '../store/layoutStore'
import { useState, useCallback, useEffect } from 'react'

type RowItemProps = { id: string; rowId: string }
type RowItemRemoveButtonProps = { id: string }

function RowItem({ id, rowId }: RowItemProps) {
  const tracker = useLayoutStore((s) => s.trackersById[id])
  const row = useLayoutStore((s) => s.rows.find((r) => r.id === rowId)!)
  const setTrackerRowY = useLayoutStore((s) => s.setTrackerRowY)
  const beginVerticalDrag = useLayoutStore((s) => s.beginVerticalDrag)
  const endVerticalDrag = useLayoutStore((s) => s.endVerticalDrag)
  const [isDraggingVertical, setIsDraggingVertical] = useState(false)
  const [dragStart, setDragStart] = useState<{ y: number; rowY: number } | null>(null)
  
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ 
    id, 
    data: { from: 'row', rowId, trackerId: id },
    disabled: isDraggingVertical
  })
  
  const stakeSize = 30
  const stakeGap = 4
  const stakeCount = tracker?.ext?.stake_quantity ?? 0
  const dynamicH = stakeCount > 0 ? 20 + stakeCount * (stakeSize + stakeGap) + 20 : 60
  const rowY = tracker?.rowY ?? 0

  // Calculate max vertical displacement. Allow slight negative overlap into the row above.
  const maxDisplacement = useCallback(() => {
    const trackers = row.trackerIds.map(id => useLayoutStore.getState().trackersById[id]).filter(Boolean)
    if (trackers.length === 0) return 0
    
    const heights = trackers.map(t => {
      const stakeCount = t?.ext?.stake_quantity ?? 0
      return stakeCount > 0 ? 20 + stakeCount * (stakeSize + stakeGap) + 20 : 60
    })
    
    const maxHeight = Math.max(...heights)
    
    // Allow: move down up to difference between tallest and current
    // Allow: move up (negative) up to a fixed overlap distance
    const down = Math.max(0, maxHeight - dynamicH)
    const up = 500 // pixels the tracker may overlap into the row above
    return { down, up }
  }, [row.trackerIds, dynamicH, stakeSize, stakeGap])
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only handle vertical drag with Alt key
    if (e.altKey) {
      e.preventDefault()
      e.stopPropagation()
      setIsDraggingVertical(true)
      setDragStart({ y: e.clientY, rowY })
      beginVerticalDrag(id)
    }
    // If not Alt key, don't interfere with horizontal drag
  }, [rowY])
  

  // Add global mouse move listener for better tracking
  useEffect(() => {
    if (isDraggingVertical) {
      let animationFrame: number | null = null
      
      const handleGlobalMouseMove = (e: MouseEvent) => {
        if (dragStart) {
          e.preventDefault()
          
          // Use requestAnimationFrame to throttle updates
          if (animationFrame) {
            cancelAnimationFrame(animationFrame)
          }
          
          animationFrame = requestAnimationFrame(() => {
            const deltaY = e.clientY - dragStart.y
            const newRowY = dragStart.rowY + deltaY
            const { down, up } = maxDisplacement() as unknown as { down: number; up: number }
            // Allow negative up to -up and positive up to down
            const clampedRowY = Math.max(-up, Math.min(down, newRowY))
            setTrackerRowY(id, clampedRowY)
          })
        }
      }

      document.addEventListener('mousemove', handleGlobalMouseMove, { passive: false })
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove)
        if (animationFrame) {
          cancelAnimationFrame(animationFrame)
        }
      }
    }
  }, [isDraggingVertical, dragStart, setTrackerRowY, id])
  
  const handleMouseUp = useCallback(() => {
    if (isDraggingVertical) {
      setIsDraggingVertical(false)
      setDragStart(null)
      endVerticalDrag()
    }
  }, [isDraggingVertical])

  // Add global mouse up listener
  useEffect(() => {
    if (isDraggingVertical) {
      document.addEventListener('mouseup', handleMouseUp)
      return () => document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDraggingVertical, handleMouseUp])
  
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDraggingVertical ? 'none' : transition,
    width: 100,
    height: dynamicH,
    position: 'relative',
    top: rowY,
    zIndex: isDraggingVertical ? 1000 : 'auto',
    opacity: isDraggingVertical ? 0.8 : 1,
    //borderColor: isAtLimit ? '#ef4444' : undefined, // Red border when at limit
  }
  
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      data-tracker-id={id}
      {...(isDraggingVertical ? {} : attributes)} 
      {...(isDraggingVertical ? {} : listeners)} 
      className={`rounded border bg-white p-2 text-xs shadow-sm ${isDraggingVertical ? 'cursor-ns-resize' : 'cursor-move'} relative group`}
      onMouseDown={handleMouseDown}
    >
      {/* Info icon with tooltip */}
      <div className="absolute top-2 right-2" style={{ zIndex: 10001 }}>
        <div className="relative" style={{ zIndex: 10001 }}>
          <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold cursor-help">
            i
          </div>
          {/* Tooltip - aparece acima de tudo, incluindo a toolbar do grupo */}
          <div className="absolute bottom-full right-0 mb-2 w-48 bg-gray-900 text-white text-xs rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-xl" style={{ zIndex: 10002 }}>
            <div className="font-semibold text-white mb-1">{tracker.ext?.type ?? tracker.title}</div>
            <div className="text-gray-300 mb-2">{tracker.ext?.manufacturer ?? '—'}</div>
            {tracker.ext && (
              <div className="text-gray-300">
                <div>Estacas: {tracker.ext.stake_quantity}</div>
                <div>Módulos máx: {tracker.ext.max_modules}</div>
              </div>
            )}
            {/* Arrow */}
            <div className="absolute top-full right-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
          </div>
        </div>
      </div>

      {/* Stakes visualization */}
      {tracker.ext ? (
        <div className="flex flex-col items-center pt-2" style={{ gap: stakeGap }}>
          {Array.from({ length: stakeCount }).map((_, i) => (
            <div key={i} style={{ width: stakeSize, height: stakeSize }} className="rounded-sm bg-slate-600" />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-400 text-xs">Tracker</div>
        </div>
      )}
    </div>
  )
}

type Props = { rowId: string; inGroup?: boolean }

export function Row({ rowId, inGroup = false }: Props) {
  const row = useLayoutStore((s) => s.rows.find((r) => r.id === rowId)!)
  const { setNodeRef, isOver } = useDroppable({ id: `row:${rowId}` })
  // Row removal agora é feito via Delete/Backspace no Canvas
  const { attributes, listeners, setNodeRef: setRowDraggableRef } = useDraggable({ id: `row-container-${rowId}`, data: { from: 'rowContainer', rowId } })
  
  const isEmpty = row.trackerIds.length === 0
  
  return (
    <div 
      ref={setNodeRef} 
      className="relative"
      style={{ 
        height: 'fit-content',
        minHeight: '120px',
        width: inGroup ? 'fit-content' : undefined, // Quando dentro do grupo, largura baseada no conteúdo
        maxWidth: inGroup ? 'fit-content' : undefined
      }}
      data-row-id={rowId}
    >
      {/* Row background only when fora do grupo */}
      {!inGroup && (
        <div 
          className={`absolute inset-0 rounded-md border pointer-events-none transition-all duration-200 ${
            isEmpty 
              ? isOver 
                ? 'border-green-400 bg-green-50 border-solid' 
                : 'border-dashed border-gray-300 bg-gray-50'
              : isOver 
                ? 'border-green-500 bg-green-50 border-dashed' 
                : 'border-gray-300 bg-gray-50 border-dashed'
          }`}
          style={{ zIndex: -1 }} 
        />
      )}
      
      {/* Content */}
      <div className="relative" style={{ zIndex: 1 }}>
        <div 
          ref={inGroup ? undefined : setRowDraggableRef} 
          className={`flex cursor-move select-none items-center justify-between ${inGroup ? 'p-2' : 'p-4'}`} 
          {...(!inGroup ? attributes : {})} 
          {...(!inGroup ? listeners : {})}
        >
          <div className="flex gap-4" />
          <div />
        </div>
         <SortableContext items={row.trackerIds} strategy={horizontalListSortingStrategy}>
           <div className={`flex gap-4 items-start ${inGroup ? 'px-2 py-2' : 'px-4 pb-4 pt-0'}`} style={{ 
             height: 'fit-content',
             minHeight: isEmpty ? '80px' : 'fit-content',
             position: 'relative',
             width: inGroup ? 'fit-content' : undefined // Largura baseada no conteúdo quando dentro do grupo
           }}>
             {isEmpty ? (
               <div className={`flex items-center justify-center w-full py-6 transition-all duration-200 ${
                 isOver ? 'opacity-100' : 'opacity-60'
               }`}>
                 <div className="flex flex-col items-center gap-2 text-center">
                   <div className="text-3xl text-gray-400">
                     {isOver ? '↓' : '📦'}
                   </div>
                   <div className={`text-sm font-medium transition-colors ${
                     isOver ? 'text-green-600' : 'text-gray-500'
                   }`}>
                     {isOver ? 'Solte aqui para adicionar' : 'Arraste trackers para cá'}
                   </div>
                   {!isOver && (
                     <div className="text-xs text-gray-400">
                       Ou arraste de outra row
                     </div>
                   )}
                 </div>
               </div>
             ) : (
               row.trackerIds.map((id) => (
                 <div key={id} className="relative" style={{ height: 'fit-content' }}>
                   <RowItem id={id} rowId={rowId} />
                   <RowItemRemoveButton id={id} />
                 </div>
               ))
             )}
           </div>
         </SortableContext>
      </div>
    </div>
  )
}

function RowItemRemoveButton({ id }: RowItemRemoveButtonProps) {
  const tracker = useLayoutStore((s) => s.trackersById[id])
  const removeTracker = useLayoutStore((s) => s.removeTracker)
  const rowY = tracker?.rowY ?? 0

  const style: React.CSSProperties = {
    position: 'absolute',
    top: -8 + rowY, // Acompanha o movimento vertical do tracker
    right: -8,
    zIndex: 1001, // Fica acima do tracker
  }

  return (
    <button
      className="h-5 w-5 rounded-full bg-red-600 text-[10px] font-bold text-white hover:bg-red-700"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        removeTracker(id)
      }}
      onMouseDown={(e) => e.stopPropagation()}
      style={style}
      aria-label="Remover"
    >×</button>
  )
}

export default Row
