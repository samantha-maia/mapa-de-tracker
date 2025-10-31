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

type Props = { groupId: string }

export function RowGroup({ groupId }: Props) {
  const group = useLayoutStore((s) => s.rowGroups.find((g) => g.id === groupId))
  const rowIdsInGroup = group?.rowIds ?? []

  const groupRef = useRef<HTMLDivElement | null>(null)
  
  // State para modo de drag manual (precisa estar antes do useDraggable)
  const [isDragMode, setIsDragMode] = useState(false)
  
  const { setNodeRef, isOver } = useDroppable({
    id: `group:${groupId}`,
    data: { type: 'group', groupId },
  })

  const removeGroup = useLayoutStore((s) => s.removeRowGroup)
  const { attributes, listeners, setNodeRef: setDraggableRef } = useDraggable({
    id: `group-container-${groupId}`,
    data: { from: 'groupContainer', groupId },
    disabled: !isDragMode,
  })

  // State para armazenar as boxes calculadas do DOM real
  const [rowBoxes, setRowBoxes] = useState<RowBox[]>([])
  const isUpdatingRef = useRef(false)
  
  // Sempre em modo edição: sem pré-finalização ou offsets
  // State para armazenar as dimensões antes de finalizar (para manter o tamanho do container)
  const [preFinalizeDimensions, setPreFinalizeDimensions] = useState<{ width: number; height: number } | null>(null)
  // Offset usado para normalizar o path em (0,0)
  const [contourOffset, setContourOffset] = useState<{ left: number; top: number } | null>(null)

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
    const dimensions = calculateGroupDimensions(rowBoxes)
    const padding = 16 // px-2 (8px de cada lado)
    return {
      width: dimensions.width + padding,
      height: dimensions.height + padding
    }
  }, [rowBoxes])

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
      {/* Toolbar externa (fora da área do grupo) */}
      <div className="absolute -top-8 left-0 flex items-center gap-2" style={{ zIndex: 100 }}>
        <div className="text-sm font-semibold text-blue-800 select-none">
          {group.name || `Grupo ${groupId}`}
        </div>
        <button 
          className={`rounded px-2 py-1 text-xs text-white ${isDragMode ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'}`}
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
        <button className="rounded bg-red-600 px-2 py-1 text-xs text-white" onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); removeGroup(groupId) }}>Remover</button>
      </div>

      {/* Content */}
      <div className="relative" style={{ zIndex: 1 }}>
        <div className={`p-2`} data-group-header />

        {/* Rows empilhadas */}
         {rowIdsInGroup.length > 0 ? (
          <SortableContext items={rowIdsInGroup} strategy={verticalListSortingStrategy}>
             <div className={`flex flex-col items-start px-2 pb-2`} style={{ width: 'fit-content' }}>
              {rowIdsInGroup.map((rowId) => (
                <GroupRowItem key={rowId} groupId={groupId} rowId={rowId} />
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

type GroupRowItemProps = { groupId: string; rowId: string }

function GroupRowItem({ groupId, rowId }: GroupRowItemProps) {
  const row = useLayoutStore((s) => s.rows.find((r) => r.id === rowId)!)
  const group = useLayoutStore((s) => s.rowGroups.find((g) => g.id === groupId)!)
  const offsetX = row?.groupOffsetX ?? 0
  const setOffsetX = useLayoutStore((s) => s.setRowGroupOffsetX)

  const [isDraggingH, setIsDraggingH] = React.useState(false)
  const dragStartRef = React.useRef<{ x: number; start: number } | null>(null)

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: rowId,
    data: { from: 'groupRow', groupId, rowId },
    disabled: isDraggingH || !!group?.isFinalized,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: 'relative',
    left: offsetX,
  }

  React.useEffect(() => {
    if (!isDraggingH) return
    const onMove = (e: MouseEvent) => {
      e.preventDefault()
      if (!dragStartRef.current) return
      const dx = e.clientX - dragStartRef.current.x
      setOffsetX(rowId, dragStartRef.current.start + dx)
    }
    const onUp = () => {
      setIsDraggingH(false)
      dragStartRef.current = null
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [isDraggingH, rowId, setOffsetX])

  const [isDraggingBar, setIsDraggingBar] = React.useState(false)
  const barDragStartRef = React.useRef<{ x: number; start: number } | null>(null)

  React.useEffect(() => {
    if (!isDraggingBar) return
    const onMove = (e: MouseEvent) => {
      e.preventDefault()
      if (!barDragStartRef.current) return
      const dx = e.clientX - barDragStartRef.current.x
      setOffsetX(rowId, barDragStartRef.current.start + dx)
    }
    const onUp = () => {
      setIsDraggingBar(false)
      barDragStartRef.current = null
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [isDraggingBar, rowId, setOffsetX])

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isDraggingH || group.isFinalized ? {} : attributes)}
      {...(isDraggingH || group.isFinalized ? {} : listeners)}
      onMouseDown={(e) => {
        if (e.altKey && !group.isFinalized) {
          e.preventDefault()
          e.stopPropagation()
          setIsDraggingH(true)
          dragStartRef.current = { x: e.clientX, start: offsetX }
        }
      }}
      data-row-id={rowId}
      className="relative group/row"
    >
      {/* Barra de drag horizontal - só aparece quando não está finalizado */}
      {!group.isFinalized && (
        <div 
          className="absolute left-0 top-0 bottom-0 w-2 opacity-0 group-hover/row:opacity-100 transition-opacity z-10 cursor-ew-resize flex items-center justify-center"
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsDraggingBar(true)
            barDragStartRef.current = { x: e.clientX, start: offsetX }
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
      <Row rowId={rowId} inGroup={true} />
    </div>
  )
}
