import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, pointerWithin } from '@dnd-kit/core'
import type { DragEndEvent, DragMoveEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'
import { useRef, useState, useCallback, useEffect } from 'react'
import Selecto from 'react-selecto'
import { 
  AlignLeft, AlignCenter, AlignRight, 
  AlignVerticalSpaceAround, AlignHorizontalSpaceAround,
  AlignStartVertical, AlignCenterVertical, AlignEndVertical
} from 'lucide-react'
import { Palette } from './Palette'
import { Row } from './Row'
import { RowGroup } from './RowGroup'
import { Tracker } from './Tracker'
import { useLayoutStore } from '../store/layoutStore'
import type { TrackerType } from '../store/layoutStore'
import type { ExternalTracker } from '../data/trackersCatalog'
import { useLayoutStore as useStore } from '../store/layoutStore'

const GRID = 30
const TRACKER_W = 115
const TRACKER_H = 30

export function Canvas() {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 0 } }))
  const [active, setActive] = useState<{ from: 'palette' | 'loose' | 'row' | 'groupContainer'; type?: TrackerType; id?: string; ext?: ExternalTracker } | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null)
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  const startPointer = useRef<{ x: number; y: number } | null>(null)
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const looseIds = useLayoutStore((s) => s.looseIds)
  const rows = useLayoutStore((s) => s.rows)
  const rowGroups = useLayoutStore((s) => s.rowGroups)
  // Remove row hover highlights for simpler visual feedback (only overlay)
  const trackersById = useLayoutStore((s) => s.trackersById)
  const selectedIds = useLayoutStore((s) => s.selectedIds)
  const addEmptyRow = useLayoutStore((s) => s.addEmptyRow)
  const addLooseTracker = useLayoutStore((s) => s.addLooseTracker)
  const addTrackerToRow = useLayoutStore((s) => s.addTrackerToRow)
  const moveLooseTrackerByDelta = useLayoutStore((s) => s.moveLooseTrackerByDelta)
  const beginDragLoose = useLayoutStore((s) => s.beginDragLoose)
  const endDragLoose = useLayoutStore((s) => s.endDragLoose)
  const groupSelectedIntoRow = useLayoutStore((s) => s.groupSelectedIntoRow)
  const draggingId = useLayoutStore((s) => s.draggingId)
  const setSelected = useLayoutStore((s) => s.setSelected)
  const reorderWithinRow = useLayoutStore((s) => s.reorderWithinRow)
  const moveBetweenRows = useLayoutStore((s) => s.moveBetweenRows)
  const moveFromRowToLoose = useLayoutStore((s) => s.moveFromRowToLoose)
  const beginDragRow = useLayoutStore((s) => s.beginDragRow)
  const moveRowByDelta = useLayoutStore((s) => s.moveRowByDelta)
  const endDragRow = useLayoutStore((s) => s.endDragRow)
  const removeRow = useLayoutStore((s) => s.removeRow)
  const removeTracker = useLayoutStore((s) => s.removeTracker)
  // Row Group actions
  const addEmptyRowGroup = useLayoutStore((s) => s.addEmptyRowGroup)
  const addRowToGroup = useLayoutStore((s) => s.addRowToGroup)
  const groupSelectedRowsIntoGroup = useLayoutStore((s) => s.groupSelectedRowsIntoGroup)
  const beginDragGroup = useLayoutStore((s) => s.beginDragGroup)
  const moveGroupByDelta = useLayoutStore((s) => s.moveGroupByDelta)
  const endDragGroup = useLayoutStore((s) => s.endDragGroup)
  const removeRowGroup = useLayoutStore((s) => s.removeRowGroup)
  const zoom = useLayoutStore((s) => s.zoom)
  const setZoom = useLayoutStore((s) => s.setZoom)
  const zoomIn = useLayoutStore((s) => s.zoomIn)
  const zoomOut = useLayoutStore((s) => s.zoomOut)
  const resetZoom = useLayoutStore((s) => s.resetZoom)
  const panX = useLayoutStore((s) => s.panX)
  const panY = useLayoutStore((s) => s.panY)
  const setPan = useLayoutStore((s) => s.setPan)
  const resetPan = useLayoutStore((s) => s.resetPan)
  const alignSelected = useLayoutStore((s) => s.alignSelected)
  const distributeSelected = useLayoutStore((s) => s.distributeSelected)
  const duplicateSelected = useLayoutStore((s) => s.duplicateSelected)
  const loadFromJson = useLayoutStore((s) => s.loadFromJson)
  const downloadJson = useLayoutStore((s) => s.downloadJson)

  // Mouse wheel handler - standard canvas behavior
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    
    if (e.ctrlKey || e.metaKey) {
      // Ctrl + Scroll: Zoom
      const delta = e.deltaY > 0 ? -1 : 1
      const newZoom = Math.max(0.1, Math.min(3, zoom + delta * 0.1))
      setZoom(newZoom)
    } else {
      // Scroll without Ctrl: Pan
      const deltaX = e.deltaX || 0
      const deltaY = e.deltaY || 0
      const newPanX = panX - deltaX
      const newPanY = panY - deltaY
      setPan(newPanX, newPanY)
    }
  }, [zoom, setZoom, panX, panY, setPan])

  // Add wheel event listener to canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  // Keyboard event handlers for Space key and copy/paste
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault()
        setIsSpacePressed(true)
      }
      
      // Handle Ctrl+C and Ctrl+V
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'c' || e.key === 'C') {
          // Ctrl+C - Copy (just prevent default, we don't need to do anything special)
          e.preventDefault()
        } else if (e.key === 'v' || e.key === 'V') {
          // Ctrl+V - Paste (duplicate selected items)
          e.preventDefault()
          if (selectedIds.length > 0) {
            duplicateSelected()
          }
        }
      }

      // Delete/Backspace to remove selected items
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0) {
          e.preventDefault()
          // Remove groups, rows, loose trackers conforme seleção
          for (const id of selectedIds) {
            if (rowGroups.some(g => g.id === id)) {
              removeRowGroup(id)
              continue
            }
            if (rows.some(r => r.id === id)) {
              removeRow(id)
              continue
            }
            if (looseIds.includes(id)) {
              removeTracker(id)
            }
          }
          setSelected([])
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        setIsSpacePressed(false)
        setIsPanning(false)
        setPanStart(null)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [selectedIds, duplicateSelected])

  // Pan handlers with multiple triggers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start panning if clicking on the actual background (not on trackers/rows/groups)
    const isBackground = e.target === e.currentTarget || 
      (e.target as HTMLElement)?.classList?.contains('canvas-background')
    
    // Don't interfere with selection or dragging
    const isSelectableElement = (e.target as HTMLElement)?.hasAttribute('data-selecto-uid')
    const isDraggableElement = (e.target as HTMLElement)?.hasAttribute('data-row-drag')
    
    if (isSelectableElement || isDraggableElement) {
      return // Let the selection/drag system handle it
    }
    
    const shouldPan = isBackground && (
      isSpacePressed || 
      e.button === 1 || // Middle mouse
      e.button === 2 || // Right mouse
      (!isSpacePressed && e.button === 0) // Left mouse without Space
    )

    if (shouldPan) {
      e.preventDefault()
      e.stopPropagation()
      setIsPanning(true)
      setPanStart({ x: e.clientX - panX, y: e.clientY - panY })
    }
  }, [panX, panY, isSpacePressed])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning && panStart) {
      e.preventDefault()
      e.stopPropagation()
      const newPanX = e.clientX - panStart.x
      const newPanY = e.clientY - panStart.y
      setPan(newPanX, newPanY)
    }
  }, [isPanning, panStart, setPan])

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
    setPanStart(null)
  }, [])

  // Add global mouse up listener
  useEffect(() => {
    if (isPanning) {
      document.addEventListener('mouseup', handleMouseUp)
      return () => document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isPanning, handleMouseUp])

  // Double click to reset zoom and pan
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      e.preventDefault()
      resetZoom()
      resetPan()
    }
  }, [resetZoom, resetPan])

  const handleDragStart = (e: DragStartEvent) => {
    const data = e.active.data.current as any
    if (!data) return
    setActive({ from: data.from, type: data.type as TrackerType | undefined, id: data.id as string | undefined, ext: data.ext as ExternalTracker | undefined })
    // capture pointer at drag start for palette drops
    const ev = e.activatorEvent as MouseEvent | TouchEvent | undefined
    if (ev) {
      // support mouse/touch
      const touch = (ev as TouchEvent).touches && (ev as TouchEvent).touches[0]
      const clientX = touch ? touch.clientX : (ev as MouseEvent).clientX
      const clientY = touch ? touch.clientY : (ev as MouseEvent).clientY
      startPointer.current = { x: clientX ?? 0, y: clientY ?? 0 }
    }
    if (data.from === 'loose') {
      beginDragLoose(data.id)
    }
    if (data.from === 'rowContainer') {
      beginDragRow(data.rowId)
    }
    if (data.from === 'groupContainer') {
      beginDragGroup(data.groupId)
    }
  }

  const handleDragMove = (e: DragMoveEvent) => {
    const data = e.active.data.current as any
    if (!data) return
    if (data.from === 'loose' && draggingId) {
      moveLooseTrackerByDelta(draggingId, e.delta.x / zoom, e.delta.y / zoom, GRID)
    }
    if (data.from === 'rowContainer' && data.rowId) {
      moveRowByDelta(String(data.rowId), e.delta.x / zoom, e.delta.y / zoom, GRID)
    }
    if (data.from === 'groupContainer' && data.groupId) {
      moveGroupByDelta(String(data.groupId), e.delta.x / zoom, e.delta.y / zoom, GRID)
    }
  }

  const lastOverRef = useRef<string | null>(null)
  const handleDragOver = (e: DragOverEvent) => {
    const over = e.over?.id as string | undefined
    if (over) {
      lastOverRef.current = over
    }
  }

  const handleDragEnd = (e: DragEndEvent) => {
    const data = e.active.data.current as any
    const overRaw = e.over?.id as string | undefined
    const over = data?.from === 'row' ? (overRaw ?? lastOverRef.current ?? undefined) : overRaw
    const state = useStore.getState()
    if (data?.from === 'palette') {
      // Check if dropping into a row first
      if (over && typeof over === 'string') {
        if (over.startsWith('row:')) {
          // Drop into row
          const rowId = over.split(':')[1]
          if (data.ext) {
            const tid = addTrackerToRow('ext', rowId)
            useStore.getState().attachExtMeta(tid, { id: data.ext.id, stake_quantity: data.ext.stake_quantity, max_modules: data.ext.max_modules, type: data.ext._trackers_types.type, manufacturer: data.ext._manufacturers.name })
          } else {
            addTrackerToRow('ext', rowId)
          }
        } else {
          // Drop next to a tracker in a row
          const overId = over
          const hostRow = rows.find((r) => r.trackerIds.includes(overId))
          if (hostRow) {
            const idx = hostRow.trackerIds.indexOf(overId)
            if (data.ext) {
              const tid = addTrackerToRow('ext', hostRow.id, idx + 1)
              useStore.getState().attachExtMeta(tid, { id: data.ext.id, stake_quantity: data.ext.stake_quantity, max_modules: data.ext.max_modules, type: data.ext._trackers_types.type, manufacturer: data.ext._manufacturers.name })
            } else {
              addTrackerToRow('ext', hostRow.id, idx + 1)
            }
          } else {
            // No valid row target, drop to free canvas
            const start = startPointer.current ?? { x: 0, y: 0 }
            const finalX = start.x + e.delta.x
            const finalY = start.y + e.delta.y
            const rect = canvasRef.current?.getBoundingClientRect()
            if (rect) {
              const localX = finalX - rect.left - TRACKER_W / 2
              const localY = finalY - rect.top - TRACKER_H / 2
              const x = Math.round(Math.max(0, localX) / GRID) * GRID
              const y = Math.round(Math.max(0, localY) / GRID) * GRID
              if (data.ext) {
                const tid = addLooseTracker('ext', x, y)
                useStore.getState().attachExtMeta(tid, { id: data.ext.id, stake_quantity: data.ext.stake_quantity, max_modules: data.ext.max_modules, type: data.ext._trackers_types.type, manufacturer: data.ext._manufacturers.name })
              } else {
                addLooseTracker('ext', x, y)
              }
            }
          }
        }
      } else {
        // No over target, drop to free canvas
        const start = startPointer.current ?? { x: 0, y: 0 }
        const finalX = start.x + e.delta.x
        const finalY = start.y + e.delta.y
        const rect = canvasRef.current?.getBoundingClientRect()
        if (rect) {
          const localX = finalX - rect.left - TRACKER_W / 2
          const localY = finalY - rect.top - TRACKER_H / 2
          const x = Math.round(Math.max(0, localX) / GRID) * GRID
          const y = Math.round(Math.max(0, localY) / GRID) * GRID
          if (data.ext) {
            const tid = addLooseTracker('ext', x, y)
            useStore.getState().attachExtMeta(tid, { id: data.ext.id, stake_quantity: data.ext.stake_quantity, max_modules: data.ext.max_modules, type: data.ext._trackers_types.type, manufacturer: data.ext._manufacturers.name })
          } else {
            addLooseTracker('ext', x, y)
          }
        }
      }
    }
    if (data?.from === 'row' && typeof over === 'string') {
      const activeId = String(e.active.id)
      // Block moves/reorders if tracker was in vertical drag mode
      if (state.verticalDragTrackerId && state.verticalDragTrackerId === activeId) {
        // Do nothing: keep tracker in its original row/position
        endDragLoose()
        setActive(null)
        return
      }
      const overId = String(over)
      const fromRowId = String(data.rowId)
      if (over.startsWith('row:')) {
        const toRowId = over.split(':')[1]
        moveBetweenRows(fromRowId, toRowId, activeId)
      } else {
        const hostRow = rows.find((r) => r.trackerIds.includes(overId))
        if (hostRow) {
          if (hostRow.id === fromRowId) {
            reorderWithinRow(fromRowId, activeId, overId)
          } else {
            const idx = hostRow.trackerIds.indexOf(overId)
            moveBetweenRows(fromRowId, hostRow.id, activeId, idx + 1)
          }
        } else {
          // dropped on free canvas background -> move from row to loose
          const start = startPointer.current ?? { x: 0, y: 0 }
          const finalX = start.x + e.delta.x
          const finalY = start.y + e.delta.y
          const rect = canvasRef.current?.getBoundingClientRect()
          if (rect) {
            const localX = finalX - rect.left - TRACKER_W / 2
            const localY = finalY - rect.top - TRACKER_H / 2
            const x = Math.round(Math.max(0, localX) / GRID) * GRID
            const y = Math.round(Math.max(0, localY) / GRID) * GRID
            moveFromRowToLoose(fromRowId, activeId, x, y)
          }
        }
      }
    }
    if (data?.from === 'loose') {
      if (over && typeof over === 'string') {
        if (over.startsWith('row:')) {
          const rowId = over.split(':')[1]
          addTrackerToRow({ id: data.id }, rowId)
        } else {
          const overId = over
          const hostRow = rows.find((r) => r.trackerIds.includes(overId))
          if (hostRow) {
            const idx = hostRow.trackerIds.indexOf(overId)
            addTrackerToRow({ id: data.id }, hostRow.id, idx + 1)
          }
        }
      }
    }
    if (data?.from === 'rowContainer') {
      // Fallback to last over target if ended without a current one
      const overForRowContainer = overRaw ?? lastOverRef.current ?? undefined
      
      // Check if dropping row into a group (prioritize direct group drop)
      if (overForRowContainer && typeof overForRowContainer === 'string' && overForRowContainer.startsWith('group:')) {
        const groupId = overForRowContainer.split(':')[1]
        addRowToGroup(String(data.rowId), groupId)
      } else if (overForRowContainer && typeof overForRowContainer === 'string' && overForRowContainer.startsWith('row-container-')) {
        // If dropped on another row, check if that row is in a group
        const targetRowId = overForRowContainer.replace('row-container-', '')
        const targetRow = rows.find((r) => r.id === targetRowId)
        if (targetRow?.groupId) {
          addRowToGroup(String(data.rowId), targetRow.groupId)
        }
      }
      endDragRow()
    }
    if (data?.from === 'groupRow') {
      const activeRowId = String(e.active.id)
      const overId = overRaw
      if (overId && overId !== activeRowId) {
        useStore.getState().reorderRowsInGroup(String(data.groupId), activeRowId, overId)
      }
    }
    if (data?.from === 'groupContainer') {
      endDragGroup()
    }
    endDragLoose()
    setActive(null)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragMove={handleDragMove} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className="flex h-full min-h-0 gap-4 p-4">
        <div className="w-60 shrink-0">
          <Palette />
          <div className="mt-4 space-y-2">
            <button className="w-full rounded bg-blue-600 px-3 py-2 text-white text-sm" onClick={() => addEmptyRow()}>+ Criar Row</button>
            <button className="w-full rounded bg-emerald-600 px-3 py-2 text-white text-sm" onClick={() => groupSelectedIntoRow()}>Agrupar seleção em Row</button>
            
            {/* Duplicate Controls */}
            {selectedIds.length > 0 && (
              <div className="border-t pt-2">
                <div className="text-xs font-semibold text-gray-600 mb-2">Duplicar</div>
                <button 
                  className="w-full rounded bg-orange-600 px-3 py-2 text-white text-sm" 
                  onClick={() => duplicateSelected()}
                  title="Ctrl+V para duplicar"
                >
                  📋 Duplicar Selecionados
                </button>
              </div>
            )}
            
            {/* Row Group Controls */}
            <div className="border-t pt-2">
              <div className="text-xs font-semibold text-gray-600 mb-2">Grupos de Fileiras</div>
              <button className="w-full rounded bg-purple-600 px-3 py-2 text-white text-sm mb-2" onClick={() => addEmptyRowGroup()}>+ Criar Grupo</button>
              <button className="w-full rounded bg-indigo-600 px-3 py-2 text-white text-sm" onClick={() => groupSelectedRowsIntoGroup()}>Agrupar fileiras selecionadas</button>
            </div>
            
            {/* Alignment Controls */}
            {selectedIds.length >= 2 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-600">Alinhamento</div>
                <div className="grid grid-cols-3 gap-1">
                  <button 
                    className="rounded bg-gray-600 px-2 py-1 text-white text-xs flex items-center justify-center" 
                    onClick={() => alignSelected('left')}
                    title="Alinhar à esquerda"
                  >
                    <AlignLeft size={12} />
                  </button>
                  <button 
                    className="rounded bg-gray-600 px-2 py-1 text-white text-xs flex items-center justify-center" 
                    onClick={() => alignSelected('center')}
                    title="Centralizar horizontalmente"
                  >
                    <AlignCenter size={12} />
                  </button>
                  <button 
                    className="rounded bg-gray-600 px-2 py-1 text-white text-xs flex items-center justify-center" 
                    onClick={() => alignSelected('right')}
                    title="Alinhar à direita"
                  >
                    <AlignRight size={12} />
                  </button>
                  <button 
                    className="rounded bg-gray-600 px-2 py-1 text-white text-xs flex items-center justify-center" 
                    onClick={() => alignSelected('top')}
                    title="Alinhar ao topo"
                  >
                    <AlignStartVertical size={12} />
                  </button>
                  <button 
                    className="rounded bg-gray-600 px-2 py-1 text-white text-xs flex items-center justify-center" 
                    onClick={() => alignSelected('middle')}
                    title="Centralizar verticalmente"
                  >
                    <AlignCenterVertical size={12} />
                  </button>
                  <button 
                    className="rounded bg-gray-600 px-2 py-1 text-white text-xs flex items-center justify-center" 
                    onClick={() => alignSelected('bottom')}
                    title="Alinhar à base"
                  >
                    <AlignEndVertical size={12} />
                  </button>
                </div>
              </div>
            )}

            {/* Distribution Controls */}
            {selectedIds.length >= 3 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-600">Distribuir</div>
                <div className="flex gap-1">
                  <button 
                    className="flex-1 rounded bg-purple-600 px-2 py-1 text-white text-xs flex items-center justify-center gap-1" 
                    onClick={() => distributeSelected('horizontal')}
                    title="Distribuir horizontalmente"
                  >
                    <AlignHorizontalSpaceAround size={12} />
                    <span>H</span>
                  </button>
                  <button 
                    className="flex-1 rounded bg-purple-600 px-2 py-1 text-white text-xs flex items-center justify-center gap-1" 
                    onClick={() => distributeSelected('vertical')}
                    title="Distribuir verticalmente"
                  >
                    <AlignVerticalSpaceAround size={12} />
                    <span>V</span>
                  </button>
                </div>
              </div>
            )}
            
            {/* Zoom Controls */}
            <div className="space-y-1">
              <div className="text-xs font-semibold text-gray-600">Zoom</div>
              <div className="flex gap-1">
                <button className="flex-1 rounded bg-gray-600 px-2 py-1 text-white text-xs" onClick={zoomOut}>-</button>
                <button className="flex-1 rounded bg-gray-600 px-2 py-1 text-white text-xs" onClick={zoomIn}>+</button>
                <button className="flex-1 rounded bg-gray-500 px-2 py-1 text-white text-xs" onClick={resetZoom}>100%</button>
              </div>
              <div className="text-xs text-gray-500 text-center">{Math.round(zoom * 100)}%</div>
              <div className="text-xs text-gray-400 text-center">Scroll: Pan</div>
              <div className="text-xs text-gray-400 text-center">Ctrl+Scroll: Zoom</div>
              <div className="text-xs text-gray-400 text-center">Space+Drag: Pan</div>
              <div className="text-xs text-gray-400 text-center">Alt+Drag: Vertical</div>
              <div className="text-xs text-gray-400 text-center">(↓ só para baixo)</div>
              <div className="text-xs text-gray-400 text-center">Ctrl+V: Duplicar</div>
              <div className="text-xs text-gray-400 text-center">Double-click: Reset</div>
            </div>
            
            <button
              className="w-full rounded bg-gray-800 px-3 py-2 text-white text-sm"
              onClick={downloadJson}
            >Salvar JSON</button>
            
            <button
              className="w-full rounded bg-green-800 px-3 py-2 text-white text-sm"
              onClick={() => {
                const jsonData = prompt('Cole o JSON para carregar:')
                if (jsonData) {
                  loadFromJson(jsonData)
                }
              }}
            >Carregar JSON</button>
          </div>
        </div>
        <div className="relative grow rounded-lg border bg-white min-h-0">
          {/* canvas area with absolutely positioned rows and loose trackers */}
          <div className="relative h-full min-h-[560px] overflow-hidden p-3" ref={canvasRef}>
            <div 
              className="absolute inset-0 canvas-background" 
              style={{ 
                backgroundSize: `${GRID}px ${GRID}px`, 
                backgroundImage: `linear-gradient(to right, #f1f5f9 1px, transparent 1px), linear-gradient(to bottom, #f1f5f9 1px, transparent 1px)` 
              }} 
            />
            <div 
              className="relative h-full w-full origin-top-left select-none"
              style={{ 
                transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
                cursor: isPanning ? 'grabbing' : (isSpacePressed ? 'grab' : 'default'),
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none',
                WebkitTouchCallout: 'none',
                WebkitTapHighlightColor: 'transparent'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onDoubleClick={handleDoubleClick}
              onContextMenu={(e) => e.preventDefault()}
            >
              {/* Render row groups first */}
              {rowGroups.map((g) => (
                <div 
                  key={g.id} 
                  className={`absolute ${selectedIds.includes(g.id) ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`} 
                  style={{ left: g.x ?? 0, top: g.y ?? 0, zIndex: 1 }} 
                  data-selecto-uid={g.id}
                >
                  <RowGroup key={`group-${g.id}`} groupId={g.id} />
                </div>
              ))}
              
              {/* Render standalone rows (not in groups) */}
              {rows.filter(r => !r.groupId).map((r) => (
                <div 
                  key={r.id} 
                  className={`absolute ${selectedIds.includes(r.id) ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`} 
                  style={{ left: r.x ?? 0, top: r.y ?? 0, zIndex: 10 }} 
                  data-selecto-uid={r.id}
                >
                  <Row rowId={r.id} />
                </div>
              ))}
              {looseIds.map((id) => {
                const t = trackersById[id]
                return (
                  <div key={id} className="absolute" style={{ left: t.x ?? 0, top: t.y ?? 0 }} data-selecto-uid={id}>
                    <Tracker tracker={t} selected={selectedIds.includes(id)} />
                  </div>
                )
              })}
            </div>
          </div>

          {/* selection (disabled while dragging) */}
          {!active && (
            <Selecto
              dragContainer={canvasRef.current}
              selectableTargets={['[data-selecto-uid]']}
              hitRate={0}
              selectByClick={true}
              selectFromInside={false}
              continueSelect={false}
              onSelectEnd={(e) => {
                const isShift = (e.inputEvent as MouseEvent | KeyboardEvent | undefined)?.shiftKey === true
                if (isShift) {
                  // Toggle selection for added/removed elements while preserving existing selection
                  const current = new Set<string>(selectedIds)
                  for (const el of e.added) {
                    const id = el.getAttribute('data-selecto-uid')
                    if (id) current.add(id)
                  }
                  for (const el of e.removed) {
                    const id = el.getAttribute('data-selecto-uid')
                    if (id) current.delete(id)
                  }
                  setSelected(Array.from(current))
                } else {
                  // Replace selection normally
                  const ids = e.selected.map((el) => el.getAttribute('data-selecto-uid')!).filter(Boolean)
                  setSelected(ids)
                }
              }}
            />
          )}
        </div>
      </div>

      {/* Drag overlay for visual feedback */}
      <DragOverlay dropAnimation={null}>
        {active ? (
          active.from === 'palette' && (active.ext || active.type) ? (
            active.ext ? (
              <div className="rounded border bg-white p-2 text-xs shadow opacity-80" style={{ width: 103, height: 36 + (active.ext.stake_quantity) * (30 + 4) + 15 }}>
                <div className="font-semibold text-gray-800">{active.ext._trackers_types.type}</div>
                <div className="text-gray-500" style={{ marginBottom: 8 }}>{active.ext._manufacturers.name}</div>
                <div className="mt-1 flex flex-col items-center" style={{ gap: 4 }}>
                  {Array.from({ length: active.ext.stake_quantity }).map((_, i) => (
                    <div key={i} style={{ width: 30, height: 30 }} className="rounded-sm bg-slate-600" />
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded border bg-white p-2 text-xs shadow w-[120px] h-[80px] opacity-80">
                <div className="font-semibold text-gray-800">Tracker</div>
                <div className="text-gray-500">—</div>
              </div>
            )
          ) : active.from === 'loose' && active.id ? (
            (() => {
              const t = trackersById[active.id!]
              return t ? <Tracker tracker={t} selected={true} /> : null
            })()
          ) : active.from === 'row' && active.id ? (
            (() => {
              const t = trackersById[active.id!]
              return t ? (
                <div className="rounded border bg-white p-2 text-xs shadow w-[120px] h-[80px] opacity-80">
                  <div className="font-semibold text-gray-800">{t.title}</div>
                  <div className="text-gray-500">{t.type}</div>
                </div>
              ) : null
            })()
          ) : active.from === 'groupContainer' && active.id ? (
            (() => {
              const group = rowGroups.find(g => g.id === active.id!)
              return group ? (
                <div className="rounded border-2 border-blue-300 bg-blue-50 p-4 text-xs shadow opacity-80">
                  <div className="font-semibold text-blue-800">{group.name || `Grupo ${group.id}`}</div>
                  <div className="text-blue-600">{group.rowIds.length} fileira(s)</div>
                </div>
              ) : null
            })()
          ) : null
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}


