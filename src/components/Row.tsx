import { useDroppable, useDraggable } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useLayoutStore } from '../store/layoutStore'
import { useState, useCallback, useEffect } from 'react'
import { getStatusColor } from '../utils/statusColors'
import { X } from 'lucide-react'

type RowItemProps = { id: string; rowId: string; viewMode?: boolean }
type RowItemRemoveButtonProps = { id: string }

function RowItem({ id, rowId, viewMode = false }: RowItemProps) {
  const tracker = useLayoutStore((s) => s.trackersById[id])
  const row = useLayoutStore((s) => s.rows.find((r) => r.id === rowId)!)
  const setTrackerRowY = useLayoutStore((s) => s.setTrackerRowY)
  const beginVerticalDrag = useLayoutStore((s) => s.beginVerticalDrag)
  const endVerticalDrag = useLayoutStore((s) => s.endVerticalDrag)
  const [isDraggingVertical, setIsDraggingVertical] = useState(false)
  const [dragStart, setDragStart] = useState<{ y: number; rowY: number } | null>(null)
  const [isAltHovered, setIsAltHovered] = useState(false)
  const [altMouseStart, setAltMouseStart] = useState<{ x: number; y: number } | null>(null)
  
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id, 
    data: { from: 'row', rowId, trackerId: id },
    disabled: isDraggingVertical || viewMode
  })
  
  const stakeSize = 20
  const stakeGap = 2
  const headerH = 10
  const stakeCount = tracker?.ext?.stake_quantity ?? 0
  const dynamicH = stakeCount > 0 ? headerH + stakeCount * (stakeSize + stakeGap) : 80
  const rowY = tracker?.rowY ?? 0

  // Calculate max vertical displacement. Allow slight negative overlap into the row above.
  const maxDisplacement = useCallback(() => {
    const trackers = row.trackerIds.map(id => useLayoutStore.getState().trackersById[id]).filter(Boolean)
    if (trackers.length === 0) return 0
    
    const heights = trackers.map(t => {
      const stakeCount = t?.ext?.stake_quantity ?? 0
      return stakeCount > 0 ? headerH + stakeCount * (stakeSize + stakeGap) : 80
    })
    
    const maxHeight = Math.max(...heights)
    
    // Allow: move down up to difference between tallest and current
    // Allow: move up (negative) up to a fixed overlap distance
    const down = Math.max(0, maxHeight - dynamicH)
    const up = 500 // pixels the tracker may overlap into the row above
    return { down, up }
  }, [row.trackerIds, dynamicH, stakeSize, stakeGap, headerH])
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only handle vertical drag with Alt key
    if (e.altKey) {
      e.preventDefault()
      e.stopPropagation()
      // Store initial mouse position for threshold check
      setAltMouseStart({ x: e.clientX, y: e.clientY })
      setDragStart({ y: e.clientY, rowY })
      // Don't start dragging immediately - wait for threshold
    }
    // If not Alt key, don't interfere with horizontal drag
  }, [rowY])
  

  // Add global mouse move listener for better tracking
  useEffect(() => {
    if (dragStart && altMouseStart) {
      let animationFrame: number | null = null
      
      const handleGlobalMouseMove = (e: MouseEvent) => {
        // Check threshold before starting vertical drag
        if (!isDraggingVertical && altMouseStart) {
          const deltaX = Math.abs(e.clientX - altMouseStart.x)
          const deltaY = Math.abs(e.clientY - altMouseStart.y)
          const threshold = 5 // pixels threshold before starting vertical drag
          
          // Only start vertical drag if mouse moved vertically beyond threshold
          // and vertical movement is greater than horizontal
          if (deltaY > threshold && deltaY > deltaX) {
            setIsDraggingVertical(true)
            beginVerticalDrag(id)
          }
        }
        
        if (isDraggingVertical && dragStart) {
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
  }, [isDraggingVertical, dragStart, altMouseStart, setTrackerRowY, id, beginVerticalDrag])
  
  const handleMouseUp = useCallback(() => {
    if (isDraggingVertical) {
      setIsDraggingVertical(false)
      setDragStart(null)
      setAltMouseStart(null)
      endVerticalDrag()
    } else if (dragStart) {
      // If we had dragStart but didn't start dragging, clear it
      setDragStart(null)
      setAltMouseStart(null)
    }
  }, [isDraggingVertical, dragStart, endVerticalDrag])

  // Add global mouse up listener - should be active whenever we have dragStart (even before threshold)
  useEffect(() => {
    if (dragStart && altMouseStart) {
      document.addEventListener('mouseup', handleMouseUp)
      return () => document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragStart, altMouseStart, handleMouseUp])

  // Also listen for Alt key release to clean up state
  useEffect(() => {
    if (dragStart && altMouseStart) {
      const handleKeyUp = (e: KeyboardEvent) => {
        if (e.key === 'Alt' || !e.altKey) {
          handleMouseUp()
        }
      }
      document.addEventListener('keyup', handleKeyUp)
      return () => document.removeEventListener('keyup', handleKeyUp)
    }
  }, [dragStart, altMouseStart, handleMouseUp])

  
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDraggingVertical ? 'none' : transition,
    width: 30,
    height: dynamicH,
    position: 'relative',
    top: rowY,
    zIndex: isDraggingVertical ? 1000 : 'auto',
    opacity: isDragging ? 0.75 : isDraggingVertical ? 0.8 : 1,
    flexShrink: 0, // Previne que o tracker encolha e cause sobreposição
    boxShadow: isDragging ? '0 20px 35px rgba(15, 23, 42, 0.25)' : undefined,
    borderColor: isDragging ? '#3b82f6' : undefined,
    cursor: isDragging ? 'grabbing' : undefined,
  }
  
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      data-tracker-id={id}
      {...(isDraggingVertical || viewMode ? {} : attributes)} 
      {...(isDraggingVertical || viewMode ? {} : listeners)} 
      className={`rounded border bg-white p-2 text-xs shadow-sm ${
        isDraggingVertical ? 'cursor-ns-resize' : 'cursor-move'
      } relative group ${isDragging ? 'ring-2 ring-blue-300' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseEnter={(e) => {
        if (e.altKey) {
          setIsAltHovered(true)
        }
      }}
      onMouseLeave={() => {
        setIsAltHovered(false)
      }}
      onMouseMove={(e) => {
        if (e.altKey) {
          setIsAltHovered(true)
        } else {
          setIsAltHovered(false)
        }
      }}
    >
      {/* Visual feedback when Alt is pressed and hovering */}
      {isAltHovered && !isDraggingVertical && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-purple-600 text-white px-2 py-1 rounded text-[10px] font-medium shadow-lg whitespace-nowrap">
            Alt + Arraste para ajustar vertical
          </div>
        </div>
      )}
      {/* Tooltip - aparece acima de tudo, incluindo a toolbar do grupo */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" style={{ zIndex: 10001 }}>
        <div className="w-48 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl relative">
          <div className="font-semibold text-white mb-1">{tracker.ext?.type ?? tracker.title}</div>
          <div className="text-gray-300 mb-2">{tracker.ext?.manufacturer ?? '—'}</div>
          {tracker.ext && (
            <div className="text-gray-300">
              <div>Estacas: {tracker.ext.stake_quantity}</div>
              <div>Módulos máx: {tracker.ext.max_modules}</div>
            </div>
          )}
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
        </div>
      </div>

      {/* Stakes visualization */}
      {tracker.ext ? (
        <div className="flex flex-col items-center" style={{ gap: stakeGap }}>
          {Array.from({ length: stakeCount }).map((_, i) => {
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
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-400 text-xs">Tracker</div>
        </div>
      )}
    </div>
  )
}

type Props = { rowId: string; inGroup?: boolean; viewMode?: boolean }

export function Row({ rowId, inGroup = false, viewMode = false }: Props) {
  const row = useLayoutStore((s) => s.rows.find((r) => r.id === rowId)!)
  const { setNodeRef, isOver } = useDroppable({ id: `row:${rowId}`, disabled: viewMode })
  // Row removal agora é feito via Delete/Backspace no Canvas
  const { attributes, listeners, setNodeRef: setRowDraggableRef } = useDraggable({ 
    id: `row-container-${rowId}`, 
    data: { from: 'rowContainer', rowId },
    disabled: viewMode
  })
  
  const isEmpty = row.trackerIds.length === 0
  
  return (
    <div 
      ref={setNodeRef} 
      className="relative"
      style={{ 
        height: 'fit-content',
        minHeight: '50px',
        width: inGroup ? 'fit-content' : undefined, // Quando dentro do grupo, largura baseada no conteúdo
        maxWidth: inGroup ? 'fit-content' : undefined,
        display: 'block', // Garante que o container seja um bloco
        position: 'relative',
        zIndex: inGroup ? 1 : 'auto' // Garante que o droppable seja detectado mesmo dentro do grupo
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

      {/* Row background quando dentro do grupo */}
      {inGroup && (
        <div
          className={`absolute inset-0 rounded-md pointer-events-none border transition-all duration-200 ${
            isOver ? 'border-blue-500 bg-blue-50/70' : 'border-blue-200 bg-blue-50/30'
          }`}
          style={{ zIndex: -1 }}
        />
      )}
      
      {/* Content */}
      <div className="relative" style={{ zIndex: inGroup ? 2 : 1 }}>
        <div 
          ref={inGroup || viewMode ? undefined : setRowDraggableRef} 
          className={`flex cursor-move select-none items-center justify-between ${
            inGroup ? 'px-1 pt-1 pb-0' : 'px-4 pt-2 pb-0'
          }`} 
          {...(!inGroup && !viewMode ? attributes : {})} 
          {...(!inGroup && !viewMode ? listeners : {})}
        >
          <div className="flex gap-2" />
          <div />
        </div>
         {isEmpty ? (
           <div className={`flex flex-row items-start ${inGroup ? 'px-1 py-1' : 'px-2 py-2'}`} style={{ 
             height: 'fit-content',
             minHeight: '80px',
             position: 'relative',
             width: inGroup ? 'fit-content' : undefined,
             display: 'flex',
             flexDirection: 'row',
             flexWrap: 'nowrap',
             gap: '8px'
           }}>
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
           </div>
         ) : (
           <SortableContext items={row.trackerIds} strategy={horizontalListSortingStrategy}>
             <div className={`flex flex-row items-start ${inGroup ? 'px-1 py-1' : 'px-2 py-2'}`} style={{ 
               height: 'fit-content',
               minHeight: 'fit-content',
               position: 'relative',
               width: inGroup ? 'fit-content' : undefined,
               display: 'flex',
               flexDirection: 'row',
               flexWrap: 'nowrap',
               gap: '8px'
             }}>
               {row.trackerIds.map((id) => (
                 <div key={id} className="relative flex-shrink-0 group" style={{ height: 'fit-content' }}>
                   <RowItem id={id} rowId={rowId} viewMode={viewMode} />
                   {!viewMode && <RowItemRemoveButton id={id} />}
                 </div>
               ))}
             </div>
           </SortableContext>
         )}
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
      className="flex items-center justify-center h-4 w-4 rounded-full bg-red-500/90 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-sm"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        removeTracker(id)
      }}
      onMouseDown={(e) => e.stopPropagation()}
      style={style}
      aria-label="Remover tracker"
      title="Remover tracker"
    >
      <X size={10} strokeWidth={2.5} />
    </button>
  )
}

export default Row
