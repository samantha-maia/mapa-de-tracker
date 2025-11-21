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
import { TextElement } from './TextElement'
import { TextEditorPanel } from './TextEditorPanel'
import { useLayoutStore } from '../store/layoutStore'
import type { TrackerType } from '../store/layoutStore'
import type { ExternalTracker } from '../data/trackersCatalog'
import { useLayoutStore as useStore } from '../store/layoutStore'
import { useTrackersStore } from '../store/trackersStore'
import { ROW_GRID_X, ROW_GRID_Y, TRACKER_GRID, GRID } from '../utils/gridConstants'
import { useAppParams } from '../context/AppParamsContext'
import { useNavigate } from 'react-router-dom'

export function Canvas() {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 0 } }))
  const [active, setActive] = useState<{ from: 'palette' | 'loose' | 'row' | 'groupContainer' | 'text'; type?: TrackerType; id?: string; ext?: ExternalTracker } | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null)
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  const [panMouseStart, setPanMouseStart] = useState<{ x: number; y: number } | null>(null)
  const startPointer = useRef<{ x: number; y: number } | null>(null)
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const looseIds = useLayoutStore((s) => s.looseIds)
  const rows = useLayoutStore((s) => s.rows)
  const rowGroups = useLayoutStore((s) => s.rowGroups)
  // Remove row hover highlights for simpler visual feedback (only overlay)
  const trackersById = useLayoutStore((s) => s.trackersById)
  const textElementIds = useLayoutStore((s) => s.textElementIds)
  const textElementsById = useLayoutStore((s) => s.textElementsById)
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
  const removeTextElement = useLayoutStore((s) => s.removeTextElement)
  const addTextElement = useLayoutStore((s) => s.addTextElement)
  const moveTextElementByDelta = useLayoutStore((s) => s.moveTextElementByDelta)
  const beginDragText = useLayoutStore((s) => s.beginDragText)
  const endDragText = useLayoutStore((s) => s.endDragText)
  const draggingTextId = useLayoutStore((s) => s.draggingTextId)
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
  const resetZoom = useLayoutStore((s) => s.resetZoom)
  const panX = useLayoutStore((s) => s.panX)
  const panY = useLayoutStore((s) => s.panY)
  const setPan = useLayoutStore((s) => s.setPan)
  const resetPan = useLayoutStore((s) => s.resetPan)
  const alignSelected = useLayoutStore((s) => s.alignSelected)
  const distributeSelected = useLayoutStore((s) => s.distributeSelected)
  const duplicateSelected = useLayoutStore((s) => s.duplicateSelected)
  const loadFromApi = useLayoutStore((s) => s.loadFromApi)
  const loadFromJson = useLayoutStore((s) => s.loadFromJson)
  const saveToApi = useLayoutStore((s) => s.saveToApi)
  const navigate = useNavigate()
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showNameModal, setShowNameModal] = useState(false)
  const [showSectionErrorModal, setShowSectionErrorModal] = useState(false)
  const [fieldNameInput, setFieldNameInput] = useState('')
  const appParams = useAppParams()
  
  const handleSaveWithName = async () => {
    if (!fieldNameInput.trim()) {
      alert('É necessário informar um nome para o campo')
      return
    }
    
    // Validar se há pelo menos uma seção antes de salvar
    if (rowGroups.length === 0) {
      setShowNameModal(false)
      setShowSectionErrorModal(true)
      return
    }
    
    const projectId = appParams.projectId ? parseInt(appParams.projectId, 10) : null
    if (!projectId) {
      alert('ProjectId não encontrado')
      return
    }
    
    setShowNameModal(false)
    setIsSaving(true)
    
    try {
      const fieldName = fieldNameInput.trim()
      
      // Salvar o mapa na API trackers-map (que cria o campo quando recebe name)
      // fieldId = 0 indica que é criação de novo campo
      const result = await saveToApi(projectId, 0, appParams.authToken, fieldName)
      if (result.success) {
        // Se a API retornou o fieldId criado, navegar para ele
        if (result.fieldId) {
          const params = new URLSearchParams()
          if (appParams.projectId) params.set('projectId', appParams.projectId)
          params.set('fieldId', result.fieldId.toString())
          params.set('mode', 'edit')
          if (appParams.authToken) params.set('authToken', appParams.authToken)
          navigate(`/?${params.toString()}`, { replace: true })
        }
        alert('Mapa salvo com sucesso!')
        // Fechar o modal e limpar
        setFieldNameInput('')
      } else {
        alert(`Erro ao salvar: ${result.error}`)
      }
    } catch (error) {
      alert(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setIsSaving(false)
      setFieldNameInput('')
    }
  }

  // Mouse wheel handler - standard canvas behavior
  const handleWheel = useCallback((e: WheelEvent) => {
    // Only process wheel events if canvas is focused or mouse is over canvas
    const canvas = canvasRef.current
    if (!canvas) return
    
    // Check if mouse is over canvas or canvas has focus
    const isOverCanvas = canvas.contains(e.target as Node)
    const isCanvasFocused = document.activeElement === canvas || canvas.contains(document.activeElement)
    
    if (!isOverCanvas && !isCanvasFocused) {
      return // Don't interfere with page scroll when not over canvas
    }
    
    e.preventDefault()
    
    // Debounce zoom to prevent excessive updates
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

  // Load trackers from API when component mounts
  useEffect(() => {
    useTrackersStore.getState().fetchTrackers(appParams.authToken)
  }, [appParams.authToken])

  // Auto-load map from API when URL parameters are present
  // Se fieldId != 0 → modo edição (carrega dados)
  // Se fieldId == 0 → modo criação (tela vazia)
  const lastLoadedParamsRef = useRef<string>('')
  useEffect(() => {
    if (appParams.projectId && appParams.fieldId) {
      const projectIdNum = parseInt(appParams.projectId, 10)
      const fieldIdNum = parseInt(appParams.fieldId, 10)
      
      // Cria uma chave única para os parâmetros atuais
      const paramsKey = `${projectIdNum}-${fieldIdNum}`
      
      // Só carrega se fieldId != 0 (modo edição) e se ainda não carregou esses parâmetros
      if (!isNaN(projectIdNum) && !isNaN(fieldIdNum) && fieldIdNum !== 0 && lastLoadedParamsRef.current !== paramsKey) {
        lastLoadedParamsRef.current = paramsKey
        console.log('Carregando mapa automaticamente...', { projectId: projectIdNum, fieldId: fieldIdNum })
        setIsLoading(true)
        loadFromApi(projectIdNum, fieldIdNum, appParams.authToken)
          .then((result) => {
            setIsLoading(false)
            if (result.success) {
              console.log('Mapa carregado com sucesso!')
            } else {
              console.warn('Erro ao carregar mapa automaticamente:', result.error)
            }
          })
          .catch((error) => {
            setIsLoading(false)
            console.error('Erro ao carregar mapa automaticamente:', error)
          })
      }
      // Se fieldId == 0, limpa tudo e deixa tela vazia (modo criação)
      else if (fieldIdNum === 0) {
        // Reset do ref quando mudar para modo criação
        lastLoadedParamsRef.current = ''
        // Limpa todo o estado do canvas para começar do zero
        loadFromJson('[]')
        resetZoom()
        resetPan()
        console.log('Modo criação - tela vazia (estado limpo)')
      }
    }
  }, [appParams.projectId, appParams.fieldId, appParams.authToken, loadFromApi])

  // Add wheel event listener to canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  // Keyboard event handlers for Space key and copy/paste
  useEffect(() => {
    const isTypingTarget = (el?: HTMLElement | null) => {
      if (!el) return false
      const tag = el.tagName
      return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable === true
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null

      // Don't interfere with Space if user is typing in a text element
      if (e.code === 'Space' && !e.repeat) {
        if (!isTypingTarget(target)) {
          e.preventDefault()
          setIsSpacePressed(true)
        }
        // Continue to other handlers even if Space was processed
      }

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        if (isTypingTarget(target)) {
          return
        }
        e.preventDefault()
        if (e.shiftKey) {
          useStore.getState().redo()
        } else {
          useStore.getState().undo()
        }
        return
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

      // Delete/Backspace to remove selected items (only if not typing)
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isTypingTarget(target)) {
        if (selectedIds.length > 0) {
          e.preventDefault()
          // Remove groups, rows, loose trackers, text elements conforme seleção
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
              continue
            }
            if (textElementIds.includes(id)) {
              removeTextElement(id)
            }
          }
          setSelected([])
        }
      }

      // Escape to clear selection
      if (e.key === 'Escape') {
        if (selectedIds.length > 0) {
          e.preventDefault()
          setSelected([])
        }
      }

      // Ctrl+A to select all visible elements
      if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
        // Only if not in an input field
        if (!isTypingTarget(target)) {
          e.preventDefault()
          const allIds: string[] = [
            ...looseIds,
            ...rows.map(r => r.id),
            ...rowGroups.map(g => g.id),
            ...textElementIds
          ]
          setSelected(allIds)
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      // Don't interfere with Space if user is typing in a text element
      if (e.code === 'Space' && !isTypingTarget(target)) {
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
  }, [selectedIds, duplicateSelected, rowGroups, rows, looseIds, textElementIds, removeRowGroup, removeRow, removeTracker, removeTextElement, setSelected])

  // Pan handlers with multiple triggers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Priority: drag > pan > selection
    // Don't start pan if there's an active drag
    if (active) {
      return // Let drag system handle it
    }
    
    // Only start panning if clicking on the actual background (not on trackers/rows/groups)
    const isBackground = e.target === e.currentTarget || 
      (e.target as HTMLElement)?.classList?.contains('canvas-background')
    
    // Don't interfere with selection or dragging
    const isSelectableElement = (e.target as HTMLElement)?.hasAttribute('data-selecto-uid')
    const isDraggableElement = (e.target as HTMLElement)?.hasAttribute('data-row-drag')
    
    if (isSelectableElement || isDraggableElement) {
      return // Let the selection/drag system handle it
    }
    
    // Pan only with Space+Drag, middle mouse, or right mouse
    // Left click without Space should allow selection, not pan
    const shouldPan = isBackground && (
      isSpacePressed || 
      e.button === 1 || // Middle mouse
      e.button === 2 // Right mouse
    )

    if (shouldPan) {
      e.preventDefault()
      e.stopPropagation()
      // Store initial mouse position for threshold check
      setPanMouseStart({ x: e.clientX, y: e.clientY })
      setPanStart({ x: e.clientX - panX, y: e.clientY - panY })
    }
  }, [panX, panY, isSpacePressed, active])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // If we have a pan start position but haven't started panning yet, check threshold
    if (panStart && panMouseStart && !isPanning) {
      const deltaX = Math.abs(e.clientX - panMouseStart.x)
      const deltaY = Math.abs(e.clientY - panMouseStart.y)
      const threshold = 5 // pixels threshold before starting pan
      
      // Only start panning if mouse moved beyond threshold
      if (deltaX > threshold || deltaY > threshold) {
        setIsPanning(true)
      }
    }
    
    if (isPanning && panStart) {
      e.preventDefault()
      e.stopPropagation()
      const newPanX = e.clientX - panStart.x
      const newPanY = e.clientY - panStart.y
      setPan(newPanX, newPanY)
    }
  }, [isPanning, panStart, panMouseStart, setPan])

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
    setPanStart(null)
    setPanMouseStart(null)
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
    if (data.from === 'text') {
      beginDragText(data.id)
    }
  }

  const handleDragMove = (e: DragMoveEvent) => {
    const data = e.active.data.current as any
    if (!data) return
    if (data.from === 'loose' && draggingId) {
      moveLooseTrackerByDelta(draggingId, e.delta.x / zoom, e.delta.y / zoom, TRACKER_GRID)
    }
    if (data.from === 'rowContainer' && data.rowId) {
      moveRowByDelta(String(data.rowId), e.delta.x / zoom, e.delta.y / zoom, ROW_GRID_X, ROW_GRID_Y)
    }
    if (data.from === 'groupContainer' && data.groupId) {
      moveGroupByDelta(String(data.groupId), e.delta.x / zoom, e.delta.y / zoom, GRID)
    }
    if (data.from === 'text' && draggingTextId) {
      moveTextElementByDelta(draggingTextId, e.delta.x / zoom, e.delta.y / zoom)
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
              const localX = finalX - rect.left
              const localY = finalY - rect.top
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
          const localX = finalX - rect.left
          const localY = finalY - rect.top
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
            const localX = finalX - rect.left
            const localY = finalY - rect.top
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
    if (data?.from === 'text') {
      endDragText()
    }
    endDragLoose()
    setActive(null)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragMove={handleDragMove} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className="flex h-full min-h-0 gap-4 p-4">
        <div className="w-64 shrink-0 overflow-y-auto">
          {/* Trackers Section */}
          <div className="mb-6">
            <Palette />
          </div>

          {/* Actions Section */}
          <div className="space-y-4">
            {/* Row Actions */}
            <div className="rounded-lg border border-[#daeef6] border-solid-1 bg-white p-3">
              <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Fileiras</h4>
              <div className="space-y-2">
                <button 
                  className="w-full h-10 rounded-[12px] bg-blue-600 px-3 text-white text-xs font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center" 
                  onClick={() => addEmptyRow()}
                >
                  + Criar fileira
                </button>
                <button 
                  className="w-full h-10 rounded-[12px] bg-emerald-600 px-3 text-white text-xs font-medium hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center" 
                  onClick={() => {
                    const result = groupSelectedIntoRow()
                    if (!result) {
                      // Show feedback if no loose trackers selected
                      const looseSelected = selectedIds.filter((id) => looseIds.includes(id))
                      if (looseSelected.length === 0) {
                        alert('Selecione trackers que estão soltos no canvas (não dentro de fileiras) para agrupar em uma fileira.')
                      }
                    }
                  }}
                  disabled={selectedIds.length === 0}
                  title={selectedIds.length === 0 ? 'Selecione trackers soltos para agrupar' : 'Agrupa trackers soltos selecionados em uma fileira'}
                >
                  Agrupar em Fileira
                </button>
              </div>
            </div>

            {/* Group Actions */}
            <div className="rounded-lg border border-[#daeef6] border-solid-1 bg-white p-3">
              <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Seções</h4>
              <div className="space-y-2">
                <button 
                  className="w-full h-10 rounded-[12px] bg-purple-600 px-3 text-white text-xs font-medium hover:bg-purple-700 transition-colors shadow-sm flex items-center justify-center" 
                  onClick={() => addEmptyRowGroup()}
                >
                  + Criar Seção
                </button>
                <button 
                  className="w-full h-10 rounded-[12px] bg-indigo-600 px-3 text-white text-xs font-medium hover:bg-indigo-700 transition-colors shadow-sm flex items-center justify-center" 
                  onClick={() => groupSelectedRowsIntoGroup()}
                >
                  Agrupar em Seção
                </button>
              </div>
            </div>

            {/* Text Actions */}
            <div className="rounded-lg border border-[#daeef6] border-solid-1 bg-white p-3">
              <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Texto</h4>
              <div className="space-y-2">
                <button 
                  className="w-full h-10 rounded-[12px] bg-teal-600 px-3 text-white text-xs font-medium hover:bg-teal-700 transition-colors shadow-sm flex items-center justify-center" 
                  onClick={() => {
                    const rect = canvasRef.current?.getBoundingClientRect()
                    if (rect) {
                      // Calculate center of viewport considering zoom and pan
                      const centerX = (rect.width / 2 - panX) / zoom
                      const centerY = (rect.height / 2 - panY) / zoom
                      const textId = addTextElement(centerX, centerY)
                      // Focus on the new text element (it will enter edit mode on double-click)
                      setSelected([textId])
                    }
                  }}
                >
                  + Adicionar Texto
                </button>
              </div>
            </div>

            {/* Text Editor Panel */}
            <TextEditorPanel />

            {/* Selection Actions */}
            {selectedIds.length > 0 && (
              <div className="rounded-lg border border-[#daeef6] border-solid-1 bg-white p-3">
                <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Selecionados ({selectedIds.length})
                </h4>
                <div className="space-y-2">
                  <button 
                    className="w-full h-10 rounded-[12px] bg-orange-600 px-3 text-white text-xs font-medium hover:bg-orange-700 transition-colors shadow-sm flex items-center justify-center" 
                    onClick={() => duplicateSelected()}
                    title="Ctrl+V para duplicar"
                  >
                    📋 Duplicar
                  </button>
                </div>
              </div>
            )}
            
            {/* Alignment Controls */}
            {selectedIds.length >= 2 && (
              <div className="rounded-lg border border-[#daeef6] border-solid-1 bg-white p-3">
                <h4 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">Alinhamento</h4>
                <div className="grid grid-cols-3 gap-1.5">
                  <button 
                    className="h-10 rounded-[12px] bg-gray-600 px-2 text-white text-xs font-medium flex items-center justify-center hover:bg-gray-700 transition-colors" 
                    onClick={() => alignSelected('left')}
                    title="Alinhar à esquerda"
                  >
                    <AlignLeft size={14} />
                  </button>
                  <button 
                    className="h-10 rounded-[12px] bg-gray-600 px-2 text-white text-xs font-medium flex items-center justify-center hover:bg-gray-700 transition-colors" 
                    onClick={() => alignSelected('center')}
                    title="Centralizar horizontalmente"
                  >
                    <AlignCenter size={14} />
                  </button>
                  <button 
                    className="h-10 rounded-[12px] bg-gray-600 px-2 text-white text-xs font-medium flex items-center justify-center hover:bg-gray-700 transition-colors" 
                    onClick={() => alignSelected('right')}
                    title="Alinhar à direita"
                  >
                    <AlignRight size={14} />
                  </button>
                  <button 
                    className="h-10 rounded-[12px] bg-gray-600 px-2 text-white text-xs font-medium flex items-center justify-center hover:bg-gray-700 transition-colors" 
                    onClick={() => alignSelected('top')}
                    title="Alinhar ao topo"
                  >
                    <AlignStartVertical size={14} />
                  </button>
                  <button 
                    className="h-10 rounded-[12px] bg-gray-600 px-2 text-white text-xs font-medium flex items-center justify-center hover:bg-gray-700 transition-colors" 
                    onClick={() => alignSelected('middle')}
                    title="Centralizar verticalmente"
                  >
                    <AlignCenterVertical size={14} />
                  </button>
                  <button 
                    className="h-10 rounded-[12px] bg-gray-600 px-2 text-white text-xs font-medium flex items-center justify-center hover:bg-gray-700 transition-colors" 
                    onClick={() => alignSelected('bottom')}
                    title="Alinhar à base"
                  >
                    <AlignEndVertical size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Distribution Controls */}
            {selectedIds.length >= 3 && (
              <div className="rounded-lg border border-[#daeef6] border-solid-1 bg-white p-3">
                <h4 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">Distribuir</h4>
                <div className="flex gap-2">
                  <button 
                    className="flex-1 h-10 rounded-[12px] bg-purple-600 px-3 text-white text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-purple-700 transition-colors shadow-sm" 
                    onClick={() => distributeSelected('horizontal')}
                    title="Distribuir horizontalmente"
                  >
                    <AlignHorizontalSpaceAround size={14} />
                    <span>Horizontal</span>
                  </button>
                  <button 
                    className="flex-1 h-10 rounded-[12px] bg-purple-600 px-3 text-white text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-purple-700 transition-colors shadow-sm" 
                    onClick={() => distributeSelected('vertical')}
                    title="Distribuir verticalmente"
                  >
                    <AlignVerticalSpaceAround size={14} />
                    <span>Vertical</span>
                  </button>
                </div>
              </div>
            )}
            
            {/* Keyboard Shortcuts */}
            <div className="rounded-lg border border-[#daeef6] border-solid-1 bg-white p-3">
              <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Atalhos</h4>
              <div className="space-y-1 text-[10px] text-gray-600">
                <div className="flex justify-between">
                  <span className="text-gray-500">Scroll</span>
                  <span className="font-mono">Pan</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Ctrl+Scroll</span>
                  <span className="font-mono">Zoom</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Space+Drag</span>
                  <span className="font-mono">Pan</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Alt+Drag</span>
                  <span className="font-mono">Ajuste Vertical</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Ctrl+A</span>
                  <span className="font-mono">Selecionar Tudo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Ctrl+V</span>
                  <span className="font-mono">Duplicar</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Escape</span>
                  <span className="font-mono">Limpar Seleção</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Delete</span>
                  <span className="font-mono">Remover</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Double-click</span>
                  <span className="font-mono">Reset Zoom</span>
                </div>
              </div>
            </div>
            
            {/* File Actions */}
            <div className="rounded-lg border border-[#daeef6] border-solid-1 bg-white p-3 space-y-2">
              <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Arquivo</h4>
              <button
                className="w-full h-10 rounded-[12px] bg-blue-600 px-3 text-white text-xs font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                onClick={async () => {
                  const projectId = appParams.projectId ? parseInt(appParams.projectId, 10) : null
                  const fieldId = appParams.fieldId ? parseInt(appParams.fieldId, 10) : null
                  
                  // Validar se há pelo menos uma seção antes de salvar
                  if (rowGroups.length === 0) {
                    setShowSectionErrorModal(true)
                    return
                  }
                  
                  // Se estiver criando um novo mapa (fieldId === 0), mostrar modal para pedir o nome
                  if (fieldId === 0) {
                    setFieldNameInput('')
                    setShowNameModal(true)
                    return
                  }
                  
                  // Se não for criação, salvar diretamente
                  setIsSaving(true)
                  const result = await saveToApi(projectId, fieldId, appParams.authToken, null)
                  setIsSaving(false)
                  if (result.success) {
                    alert('Mapa salvo com sucesso!')
                  } else {
                    // Se o erro for sobre falta de seção, mostrar modal personalizado
                    if (result.error && result.error.includes('seção')) {
                      setShowSectionErrorModal(true)
                    } else {
                      alert(`Erro ao salvar: ${result.error}`)
                    }
                  }
                }}
                disabled={isSaving}
              >
                {isSaving ? '⏳ Salvando...' : '💾 Salvar Mapa'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Modal de erro - falta seção */}
        {showSectionErrorModal && (
          <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
          >
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">⚠️ Seção Obrigatória</h2>
              <p className="text-sm text-gray-600 mb-4">
                É obrigatório criar pelo menos <strong>1 seção</strong> para salvar o mapa.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Apenas itens dentro de seções serão salvos. Itens fora de seções não serão salvos.
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowSectionErrorModal(false)}
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Entendi
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Modal para nome do campo */}
        {showNameModal && (
          <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
          >
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Nome do Campo</h2>
              <p className="text-sm text-gray-600 mb-4">
                ⚠️ <strong>IMPORTANTE:</strong> Apenas itens dentro de seções serão salvos. Itens fora de seções não serão salvos.
              </p>
              <input
                type="text"
                value={fieldNameInput}
                onChange={(e) => setFieldNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && fieldNameInput.trim()) {
                    handleSaveWithName()
                  } else if (e.key === 'Escape') {
                    setShowNameModal(false)
                    setFieldNameInput('')
                  }
                }}
                placeholder="Digite o nome do campo"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                autoFocus
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowNameModal(false)
                    setFieldNameInput('')
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveWithName}
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="relative grow rounded-lg border-[#daeef6] border-solid-1 bg-white min-h-0">
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white bg-opacity-80 rounded-lg">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-gray-700">Carregando mapa...</p>
              </div>
            </div>
          )}
          {/* Saving overlay */}
          {isSaving && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90 rounded-lg">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-gray-700">Salvando mapa...</p>
              </div>
            </div>
          )}
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
              {/* Visual feedback when Space is pressed */}
              {isSpacePressed && !isPanning && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                  <div className="bg-blue-600 text-white px-3 py-1.5 rounded-[12px] text-xs font-medium shadow-lg flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                    </svg>
                    Modo Pan - Arraste para navegar
                  </div>
                </div>
              )}
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
              {textElementIds.map((id) => {
                const text = textElementsById[id]
                return (
                  <div key={id} className="absolute" style={{ left: text.x, top: text.y, zIndex: 100 }} data-selecto-uid={id}>
                    <TextElement textElement={text} selected={selectedIds.includes(id)} />
                  </div>
                )
              })}
            </div>
          </div>

          {/* selection (disabled while dragging or panning) */}
          {!active && !isPanning && !isSpacePressed && (
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

          {/* Zoom Controls */}
          <div className="absolute top-4 right-4 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
            <div className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Zoom</div>
            <div className="space-y-2">
              <div className="flex gap-1.5">
                <button 
                  className="flex-1 h-10 rounded-[12px] bg-gray-600 px-3 text-white text-xs font-medium hover:bg-gray-700 transition-colors flex items-center justify-center" 
                  onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
                >
                  −
                </button>
                <button 
                  className="flex-1 h-10 rounded-[12px] bg-gray-600 px-3 text-white text-xs font-medium hover:bg-gray-700 transition-colors flex items-center justify-center" 
                  onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                >
                  +
                </button>
                <button 
                  className="flex-1 h-10 rounded-[12px] bg-gray-500 px-3 text-white text-xs font-medium hover:bg-gray-600 transition-colors flex items-center justify-center" 
                  onClick={resetZoom}
                >
                  Reset
                </button>
              </div>
              <div className="text-xs text-gray-600 text-center font-medium py-1">
                {Math.round(zoom * 100)}%
              </div>
            </div>
          </div>

          {/* Gemini Image */}
          <div className="absolute bottom-4 right-4">
            <img 
              src={`${import.meta.env.BASE_URL}Gemini_Generated_Image_kflrtdkflrtdkflr.jpg`}
              alt="Gemini" 
              className="max-w-[150px] max-h-[150px] object-contain"
            />
          </div>
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
                    <div key={i} style={{ width: 30, height: 30 }} className="rounded-sm bg-slate-500" />
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
          ) : active.from === 'text' && active.id ? (
            (() => {
              const text = textElementsById[active.id!]
              return text ? (
                <div 
                  className="rounded border bg-white p-2 text-xs shadow opacity-80"
                  style={{
                    fontSize: `${text.fontSize}px`,
                    color: text.color,
                    fontWeight: text.fontWeight,
                    fontStyle: text.fontStyle,
                    textDecoration: text.textDecoration,
                    textAlign: text.textAlign
                  }}
                >
                  {text.text || 'Novo texto'}
                </div>
              ) : null
            })()
          ) : null
        ) : null}
      </DragOverlay>
      
    </DndContext>
  )
}


