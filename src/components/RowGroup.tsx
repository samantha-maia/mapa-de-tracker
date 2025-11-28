import { useDroppable, useDraggable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import React, { useMemo, useRef, useState, useLayoutEffect } from 'react'
import { useLayoutStore } from '../store/layoutStore'
import { Row } from './Row'
import { 
  calculateRowBoxesFromDOM, 
  calculateGroupDimensions, 
  type RowBox
} from '../utils/contourUtils'

type Props = { groupId: string; viewMode?: boolean }

export function RowGroup({ groupId, viewMode = false }: Props) {
  const group = useLayoutStore((s) => s.rowGroups.find((g) => g.id === groupId))
  const rowIdsInGroup = group?.rowIds ?? []

  const groupRef = useRef<HTMLDivElement | null>(null)
  
  // State para modo de drag manual (precisa estar antes do useDraggable)
  const [isDragMode, setIsDragMode] = useState(false)
  
  const { setNodeRef, isOver } = useDroppable({
    id: `group:${groupId}`,
    data: { type: 'group', groupId },
    disabled: viewMode
  })

  const removeGroup = useLayoutStore((s) => s.removeRowGroup)
  const resetGroupRowOffsets = useLayoutStore((s) => s.resetGroupRowOffsets)
  const { attributes, listeners, setNodeRef: setDraggableRef } = useDraggable({
    id: `group-container-${groupId}`,
    data: { from: 'groupContainer', groupId },
    disabled: !isDragMode || viewMode,
  })

  // State para armazenar as boxes calculadas do DOM real
  const [rowBoxes, setRowBoxes] = useState<RowBox[]>([])
  const isUpdatingRef = useRef(false)
  
  // Sempre em modo edição: sem pré-finalização ou offsets

  // Safety check
  if (!group) return null

  // ==== CÁLCULO ROBUSTO: Baseado no DOM real ====
  // Recalcula as boxes sempre que houver mudanças
  useLayoutEffect(() => {
    let rafId: number | null = null
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const updateBoxes = () => {
      if (isUpdatingRef.current) return
      isUpdatingRef.current = true
      
      rafId = requestAnimationFrame(() => {
        const boxes = calculateRowBoxesFromDOM(groupRef.current)
        setRowBoxes(prevBoxes => {
          if (prevBoxes.length !== boxes.length) {
            isUpdatingRef.current = false
            return boxes
          }
          const changed = prevBoxes.some((prev, i) => {
            const curr = boxes[i]
            return !curr || 
              prev.left !== curr.left || 
              prev.right !== curr.right || 
              prev.top !== curr.top || 
              prev.bottom !== curr.bottom
          })
          isUpdatingRef.current = false
          return changed ? boxes : prevBoxes
        })
      })
    }

    updateBoxes()

    const root = groupRef.current
    if (!root) return

    const observer = new MutationObserver(() => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(updateBoxes, 50)
    })

    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style']
    })

    return () => {
      observer.disconnect()
      if (rafId !== null) cancelAnimationFrame(rafId)
      if (timeoutId !== null) clearTimeout(timeoutId)
      isUpdatingRef.current = false
    }
  }, [rowIdsInGroup.length])

  // Largura e altura do grupo baseada no perímetro dos trackers (sempre dinâmico)
  const computedDimensions = useMemo(() => {
    if (rowBoxes.length === 0) {
      return { width: 120, height: 120 }
    }

    const rowsInGroup = rowIdsInGroup
      .map((id) => useLayoutStore.getState().rows.find((r) => r.id === id))
      .filter(Boolean) as Array<NonNullable<ReturnType<typeof useLayoutStore.getState>['rows'][0]>>

    if (rowsInGroup.length > 0) {
      const TRACKER_WIDTH = 30
      const TRACKER_GAP = 8
      const ROW_HORIZONTAL_PADDING = 8 // px-1 (4px) em cada lado do container interno
      const REMOVE_BUTTON_OVERHANG = 8 // botão vermelho fica 8px para fora
      const MIN_ROW_CONTENT = TRACKER_WIDTH + ROW_HORIZONTAL_PADDING + REMOVE_BUTTON_OVERHANG

      const rowWidths = rowsInGroup.map((row) => {
        const trackerCount = row.trackerIds.length
        if (trackerCount <= 0) return MIN_ROW_CONTENT

        const trackersWidth = trackerCount * TRACKER_WIDTH + (trackerCount - 1) * TRACKER_GAP
        return trackersWidth + ROW_HORIZONTAL_PADDING + REMOVE_BUTTON_OVERHANG
      })

      const offsets = rowsInGroup.map((row) => row.groupOffsetX ?? 0)
      const minOffset = Math.min(...offsets)

      const rightmostEdges = rowsInGroup.map((row, index) => {
        return (row.groupOffsetX ?? 0) + rowWidths[index]
      })
      const rightmostEdge = Math.max(...rightmostEdges)

      const calculatedWidth = Math.max(120, rightmostEdge - minOffset)
      const domDimensions = calculateGroupDimensions(rowBoxes)

      // Usar apenas calculatedWidth para evitar espaço extra do DOM
      // O calculatedWidth é calculado teoricamente e é mais preciso
      return {
        width: calculatedWidth,
        height: domDimensions.height + 8,
      }
    }

    const dimensions = calculateGroupDimensions(rowBoxes)
    const padding = 8
    return {
      width: dimensions.width + padding,
      height: dimensions.height + padding,
    }
  }, [rowBoxes, rowIdsInGroup])

  return (
    <div
      ref={(node) => { 
        setNodeRef(node)
        setDraggableRef(node)
        groupRef.current = node 
      }}
      className={`relative rounded-md transition-colors ${isDragMode ? 'cursor-move' : ''} ${
        isOver ? 'border-2 border-green-500 bg-green-100' : 'border-2 border-blue-300 bg-blue-50'
      }`}
      style={{ 
        minWidth: `${computedDimensions.width}px`, 
        minHeight: `${computedDimensions.height}px`,
        zIndex: 5 
      }}
      data-group-id={groupId}
      {...attributes}
      {...listeners}
    >
      {/* Toolbar externa (fora da área do grupo) - apenas em modo edição */}
      {!viewMode && (
        <div className="absolute -top-8 left-0 flex items-center gap-2" style={{ zIndex: 100 }}>
          {/* <div className="text-sm font-semibold text-blue-800 select-none">
            {group.name || `Grupo ${groupId}`}
          </div> */}
          <button 
            className={`rounded-[12px] px-2 py-1 text-xs text-white ${isDragMode ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'}`}
            onClick={(e)=>{ 
              e.preventDefault(); 
              e.stopPropagation(); 
              setIsDragMode(!isDragMode);
            }}
            title={isDragMode ? 'Desativar arrasto' : 'Ativar arrasto'}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <circle cx="2" cy="2" r="1"/>
              <circle cx="6" cy="2" r="1"/>
              <circle cx="10" cy="2" r="1"/>
              <circle cx="2" cy="6" r="1"/>
              <circle cx="6" cy="6" r="1"/>
              <circle cx="10" cy="6" r="1"/>
              <circle cx="2" cy="10" r="1"/>
              <circle cx="6" cy="10" r="1"/>
              <circle cx="10" cy="10" r="1"/>
            </svg>
          </button>
          <button 
            className="rounded-[12px] bg-yellow-600 px-1.5 py-0.5 text-xs text-white hover:bg-yellow-700" 
            onClick={(e)=>{ 
              e.preventDefault(); 
              e.stopPropagation(); 
              resetGroupRowOffsets(groupId);
            }}
            title="Resetar posições horizontais das fileiras"
          >
            ↺
          </button>
          <button className="rounded-[12px] bg-red-600 px-1.5 py-0.5 text-xs text-white" onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); removeGroup(groupId) }}>x</button>
        </div>
      )}

      {/* Content */}
      <div className="relative" style={{ zIndex: 1 }}>
        <div className="px-1 pt-1 pb-0" data-group-header />

        {/* Rows empilhadas */}
         {rowIdsInGroup.length > 0 ? (
          <SortableContext items={rowIdsInGroup} strategy={verticalListSortingStrategy}>
             <div className="flex flex-col items-start px-1 pb-1" style={{ width: 'fit-content' }}>
              {rowIdsInGroup.map((rowId) => (
                <GroupRowItem key={rowId} groupId={groupId} rowId={rowId} viewMode={viewMode} />
              ))}
            </div>
          </SortableContext>
        ) : (
          <div className="px-2 pb-2">
            <div className="text-gray-500 text-sm">Grupo vazio - arraste fileiras para cá</div>
          </div>
        )}
      </div>

    </div>
  )
}

export default RowGroup

type GroupRowItemProps = { groupId: string; rowId: string; viewMode?: boolean }

function GroupRowItem({ groupId, rowId, viewMode = false }: GroupRowItemProps) {
  const row = useLayoutStore((s) => s.rows.find((r) => r.id === rowId)!)
  const group = useLayoutStore((s) => s.rowGroups.find((g) => g.id === groupId)!)
  const offsetX = row?.groupOffsetX ?? 0
  const setOffsetX = useLayoutStore((s) => s.setRowGroupOffsetX)
  const removeRowFromGroup = useLayoutStore((s) => s.removeRowFromGroup)

  const [isDraggingH, setIsDraggingH] = React.useState(false)
  const dragSessionRef = React.useRef<{
    pointerId: number
    startX: number
    startOffset: number
    raf: number | null
    isDragging: boolean
    target?: HTMLElement | null
  } | null>(null)
  const dragCleanupRef = React.useRef<(() => void) | null>(null)

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: rowId,
    data: { from: 'groupRow', groupId, rowId },
    disabled: isDraggingH || !!group?.isFinalized || viewMode,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: 'relative',
    left: offsetX,
  }

  const stopHorizontalDrag = React.useCallback(() => {
    if (dragCleanupRef.current) {
      dragCleanupRef.current()
      dragCleanupRef.current = null
    }

    const session = dragSessionRef.current
    if (session?.raf) {
      cancelAnimationFrame(session.raf)
    }
    if (session?.target && session.pointerId !== undefined) {
      try {
        if (session.target.hasPointerCapture?.(session.pointerId)) {
          session.target.releasePointerCapture(session.pointerId)
        }
      } catch {
        // ignore
      }
    }
    dragSessionRef.current = null
    setIsDraggingH(false)
  }, [])

  const startHorizontalDrag = React.useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (group.isFinalized) return

      stopHorizontalDrag()

      const session = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startOffset: offsetX,
        raf: null as number | null,
        isDragging: false,
        target: event.currentTarget,
      }
      dragSessionRef.current = session

      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {
        // Alguns browsers podem lançar se pointer capture não estiver disponível.
      }

      event.preventDefault()
      event.stopPropagation()

      const handleMove = (e: PointerEvent) => {
        if (e.pointerId !== session.pointerId) return
        e.preventDefault()
        const deltaX = e.clientX - session.startX
        const threshold = 4

        if (!session.isDragging && Math.abs(deltaX) >= threshold) {
          session.isDragging = true
          setIsDraggingH(true)
        }

        if (!session.isDragging) return

        if (session.raf) {
          cancelAnimationFrame(session.raf)
        }

        session.raf = requestAnimationFrame(() => {
          setOffsetX(rowId, session.startOffset + deltaX)
        })
      }

      const handleUp = (e: PointerEvent) => {
        if (e.pointerId !== session.pointerId) return
        stopHorizontalDrag()
      }

      const handleCancel = (e: PointerEvent) => {
        if (e.pointerId !== session.pointerId) return
        stopHorizontalDrag()
      }

      const handleKeyUp = (e: KeyboardEvent) => {
        if (e.key === 'Alt' || e.key === 'AltGraph') {
          stopHorizontalDrag()
        }
      }

      document.addEventListener('pointermove', handleMove, { passive: false })
      document.addEventListener('pointerup', handleUp)
      document.addEventListener('pointercancel', handleCancel)
      document.addEventListener('keyup', handleKeyUp)

      dragCleanupRef.current = () => {
        document.removeEventListener('pointermove', handleMove)
        document.removeEventListener('pointerup', handleUp)
        document.removeEventListener('pointercancel', handleCancel)
        document.removeEventListener('keyup', handleKeyUp)
      }
    },
    [group.isFinalized, offsetX, rowId, setOffsetX, stopHorizontalDrag]
  )

  React.useEffect(() => {
    return () => {
      stopHorizontalDrag()
    }
  }, [stopHorizontalDrag])

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isDraggingH || group.isFinalized ? {} : attributes)}
      {...(isDraggingH || group.isFinalized ? {} : listeners)}
      onPointerDown={(e) => {
        if ((e.target as HTMLElement | null)?.closest('[data-tracker-id]')) {
          return
        }
        if (!group.isFinalized && !viewMode && e.altKey) {
          startHorizontalDrag(e)
        }
      }}
      data-row-id={rowId}
      className="relative group/row"
    >
      {/* Barra de drag horizontal - só aparece quando não está finalizado e não está em viewMode */}
      {!group.isFinalized && !viewMode && (
        <div 
          className="absolute left-0 top-0 bottom-0 w-2 opacity-0 group-hover/row:opacity-100 transition-opacity z-10 cursor-ew-resize flex items-center justify-center"
          onPointerDown={(e) => {
            if (group.isFinalized) return
            startHorizontalDrag(e)
          }}
          style={{
            background: 'linear-gradient(to right, rgba(59, 130, 246, 0.3), rgba(59, 130, 246, 0.1))',
            borderRight: '2px solid rgba(59, 130, 246, 0.5)'
          }}
          title="Arraste para ajustar posição horizontal"
        >
          {/* Ícone de drag horizontal */}
          <div className="absolute -left-3 flex flex-col gap-0.5 opacity-70">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="text-blue-600">
              <circle cx="2" cy="2" r="0.8"/>
              <circle cx="6" cy="2" r="0.8"/>
              <circle cx="10" cy="2" r="0.8"/>
              <circle cx="2" cy="6" r="0.8"/>
              <circle cx="6" cy="6" r="0.8"/>
              <circle cx="10" cy="6" r="0.8"/>
              <circle cx="2" cy="10" r="0.8"/>
              <circle cx="6" cy="10" r="0.8"/>
              <circle cx="10" cy="10" r="0.8"/>
            </svg>
          </div>
        </div>
      )}
      <Row rowId={rowId} inGroup={true} viewMode={viewMode} />
      {/* Botão de remover fileira do grupo - tooltip na lateral - apenas em modo edição */}
      {!group.isFinalized && !viewMode && (
        <button
          className="absolute left-full ml-2 top-1/2 -translate-y-1/2 rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700 opacity-0 group-hover/row:opacity-100 transition-opacity z-20 whitespace-nowrap shadow-lg"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            removeRowFromGroup(rowId)
          }}
          aria-label="Remover fileira do grupo"
          title="Remover fileira do grupo"
        >
          Remover Row
        </button>
      )}
    </div>
  )
}
