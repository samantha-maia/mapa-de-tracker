import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { TRACKERS_CATALOG } from '../data/trackersCatalog'
import { useTrackersStore } from './trackersStore'
import { calculateRowHeight, calculateTrackerHeight } from '../utils/rowHeightUtils'
import { GRID } from '../utils/gridConstants'
import { apiRequest, API_ROUTES } from '../services/apiClient'

//precisa adicionar o fields_id que vai vir no get da pagina

export type TrackerType = 'ext'

export type ExtMeta = {
  id: number
  stake_quantity: number
  max_modules: number
  type: string
  manufacturer: string
}

export type Tracker = {
  id: string
  databaseId?: number | null
  type: TrackerType
  title: string
  // Position only when loose on the free canvas
  x?: number
  y?: number
  // Position within a row (for vertical adjustment)
  rowY?: number
  // link to external model
  ext?: ExtMeta
  // optional adjustable height (px). If undefined, UI computes minimum based on ext
  height?: number
  // Array de status_id para cada estaca (índice corresponde à posição da estaca)
  stakeStatusIds?: (number | null)[]
}

export type Row = {
  id: string
  databaseId?: number | null
  trackerIds: string[]
  x?: number
  y?: number
  isFinalized?: boolean
  contourPath?: string
  groupId?: string // Reference to the group this row belongs to
  groupOffsetX?: number // Horizontal offset when inside a group (px)
}

export type RowGroup = {
  id: string
  databaseId?: number | null
  rowIds: string[]
  x?: number
  y?: number
  isFinalized?: boolean
  contourPath?: string
  name?: string
  sectionNumber?: number
}

export type TextElement = {
  id: string
  x: number
  y: number
  text: string
  fontSize: number
  color: string
  fontWeight: 'normal' | 'bold'
  fontStyle: 'normal' | 'italic'
  textDecoration: 'none' | 'underline'
  textAlign: 'left' | 'center' | 'right'
}

export type SectionState = {
  trackersById: Record<string, Tracker>
  looseIds: string[]
  rows: Row[]
  rowGroups: RowGroup[]
  textElementsById: Record<string, TextElement>
  textElementIds: string[]
  selectedIds: string[]
  // dragging context for loose trackers
  draggingId?: string
  dragStart?: { x: number; y: number }
  // dragging context for rows
  draggingRowId?: string
  dragRowStart?: { x: number; y: number }
  // dragging context for row groups
  draggingGroupId?: string
  dragGroupStart?: { x: number; y: number }
  // dragging context for text elements
  draggingTextId?: string
  dragTextStart?: { x: number; y: number }
  // vertical dragging context for a tracker inside a row
  verticalDragTrackerId?: string
  // zoom state
  zoom: number
  // pan state
  panX: number
  panY: number
  // history stacks
  historyPast: string[]
  historyFuture: string[]
}

export type LayoutActions = {
  addEmptyRow: () => string
  addLooseTracker: (type: TrackerType, x: number, y: number) => string
  addTrackerToRow: (typeOrId: TrackerType | { id: string }, rowId: string, index?: number) => string
  moveLooseTrackerByDelta: (id: string, dx: number, dy: number, snap: number) => void
  beginDragLoose: (id: string) => void
  endDragLoose: () => void
  reorderWithinRow: (rowId: string, activeId: string, overId: string) => void
  moveBetweenRows: (fromRowId: string, toRowId: string, trackerId: string, index?: number) => void
  attachExtMeta: (id: string, ext: ExtMeta) => void
  setTrackerHeight: (id: string, height: number) => void
  moveFromRowToLoose: (fromRowId: string, trackerId: string, x: number, y: number) => void
  beginDragRow: (rowId: string) => void
  moveRowByDelta: (rowId: string, dx: number, dy: number, snapX: number, snapY: number) => void
  endDragRow: () => void
  beginVerticalDrag: (trackerId: string) => void
  endVerticalDrag: () => void
  removeTracker: (id: string) => void
  removeRow: (rowId: string) => void
  setSelected: (ids: string[]) => void
  clearSelection: () => void
  groupSelectedIntoRow: () => string | undefined
  // Row Group actions
  addEmptyRowGroup: () => string
  addRowToGroup: (rowId: string, groupId: string) => void
  removeRowFromGroup: (rowId: string) => void
  removeRowGroup: (groupId: string) => void
  beginDragGroup: (groupId: string) => void
  moveGroupByDelta: (groupId: string, dx: number, dy: number, snap: number) => void
  endDragGroup: () => void
  setGroupFinalized: (groupId: string, isFinalized: boolean, contourPath?: string) => void
  groupSelectedRowsIntoGroup: () => string | undefined
  reorderRowsInGroup: (groupId: string, activeRowId: string, overRowId: string) => void
  duplicateSelected: () => void
  serialize: () => string
  setZoom: (zoom: number) => void
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  setPan: (x: number, y: number) => void
  resetPan: () => void
  alignSelected: (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void
  distributeSelected: (type: 'horizontal' | 'vertical') => void
  moveTrackerInRow: (trackerId: string, rowId: string, deltaY: number) => void
  setTrackerRowY: (trackerId: string, rowY: number) => void
  setRowFinalized: (rowId: string, isFinalized: boolean, contourPath?: string) => void
  loadFromJson: (jsonData: string) => void
  loadFromApi: (projectsId: number, fieldsId: number, authToken?: string | null) => Promise<{ success: boolean; error?: string }> // Carrega o mapa da API
  downloadJson: () => void
  exportToDatabaseFormat: () => string // Exporta no formato do banco de dados
  saveToApi: (projectId?: number | null, fieldId?: number | null, authToken?: string | null, fieldName?: string | null) => Promise<{ success: boolean; error?: string; fieldId?: number | null }> // Salva o mapa na API
  // history
  undo: () => void
  redo: () => void
  // group row offset
  setRowGroupOffsetX: (rowId: string, offsetX: number) => void
  resetGroupRowOffsets: (groupId: string) => void
  // text element actions
  addTextElement: (x: number, y: number) => string
  updateTextElement: (id: string, updates: Partial<Omit<TextElement, 'id'>>, saveHistory?: boolean) => void
  removeTextElement: (id: string) => void
  moveTextElementByDelta: (id: string, dx: number, dy: number) => void
  beginDragText: (id: string) => void
  endDragText: () => void
}

let idCounter = 0
const nextId = (prefix: string) => `${prefix}_${++idCounter}`

// Try to reuse numeric IDs that already exist in the database. If we can't parse one, return null.
const parseDatabaseId = (value: any): number | null => {
  if (value === null || value === undefined) return null
  const num = typeof value === 'number' ? value : parseInt(String(value), 10)
  return Number.isFinite(num) ? num : null
}

const snapToGrid = (value: number, grid: number) => Math.round(value / grid) * grid

const getNextSectionNumber = (groups: RowGroup[]) => {
  if (groups.length === 0) return 1
  return (
    groups.reduce((max, group) => {
      const current = group.sectionNumber ?? 0
      return current > max ? current : max
    }, 0) + 1
  )
}

export const useLayoutStore = create<SectionState & LayoutActions>()(
  immer((set, get) => ({
    trackersById: {},
    looseIds: [],
    rows: [],
    rowGroups: [],
    textElementsById: {},
    textElementIds: [],
    selectedIds: [],
    zoom: 1,
    panX: 0,
    panY: 0,
    historyPast: [],
    historyFuture: [],
    // helper: push current snapshot to history
    // We keep history only for structural actions (not continuous pointer moves)
    
    verticalDragTrackerId: undefined,

    addEmptyRow: () => {
      const snap = get().serialize()
      set((s) => { s.historyPast.push(snap); s.historyFuture = [] })
      const id = nextId('row')
      set((s) => {
        s.rows.push({ id, databaseId: null, trackerIds: [], x: 20, y: 20 })
      })
      return id
    },

    addLooseTracker: (type, x, y) => {
      const snap = get().serialize()
      set((s) => { s.historyPast.push(snap); s.historyFuture = [] })
      const id = nextId('t')
      const title = 'Tracker'
      set((s) => {
        s.trackersById[id] = { id, databaseId: null, type, title, x, y }
        s.looseIds.push(id)
      })
      return id
    },

    addTrackerToRow: (typeOrId, rowId, index) => {
      const snap = get().serialize()
      set((s) => { s.historyPast.push(snap); s.historyFuture = [] })
      const state = get()
      const row = state.rows.find((r) => r.id === rowId)
      if (!row) return ''

      let id = ''
      if (typeof typeOrId === 'string') {
        id = nextId('t')
        const title = 'Tracker'
        set((s) => {
          s.trackersById[id] = { id, databaseId: null, type: typeOrId, title }
        })
      } else {
        id = typeOrId.id
        // if it was loose, remove position and from looseIds
        set((s) => {
          const existing = s.trackersById[id]
          if (existing) {
            delete existing.x
            delete existing.y
          }
          s.looseIds = s.looseIds.filter((tid) => tid !== id)
        })
      }

      set((s) => {
        const target = s.rows.find((r) => r.id === rowId)!
        const at = index ?? target.trackerIds.length
        target.trackerIds.splice(at, 0, id)
      })

      return id
    },

    moveLooseTrackerByDelta: (id, dx, dy, snap) => {
      set((s) => {
        const t = s.trackersById[id]
        if (!t) return
        const start = s.dragStart ?? { x: t.x ?? 0, y: t.y ?? 0 }
        const nx = snapToGrid(start.x + dx, snap)
        const ny = snapToGrid(start.y + dy, snap)
        if (t.x === undefined || t.y === undefined) {
          t.x = nx
          t.y = ny
        } else {
          t.x = nx
          t.y = ny
        }
      })
    },

    beginDragLoose: (id) => {
      const t = get().trackersById[id]
      set({ draggingId: id, dragStart: { x: t?.x ?? 0, y: t?.y ?? 0 } })
    },

    endDragLoose: () => set({ draggingId: undefined, dragStart: undefined }),

    reorderWithinRow: (rowId, activeId, overId) => {
      const snap = get().serialize()
      set((s) => { s.historyPast.push(snap); s.historyFuture = [] })
      set((s) => {
        const row = s.rows.find((r) => r.id === rowId)
        if (!row) return
        const from = row.trackerIds.indexOf(activeId)
        const to = row.trackerIds.indexOf(overId)
        if (from === -1 || to === -1) return
        const [moved] = row.trackerIds.splice(from, 1)
        row.trackerIds.splice(to, 0, moved)
      })
    },

    moveBetweenRows: (fromRowId, toRowId, trackerId, index) => {
      const snap = get().serialize()
      set((s) => { s.historyPast.push(snap); s.historyFuture = [] })
      set((s) => {
        if (fromRowId === toRowId) return
        const fromRow = s.rows.find((r) => r.id === fromRowId)
        const toRow = s.rows.find((r) => r.id === toRowId)
        if (!fromRow || !toRow) return
        const pos = fromRow.trackerIds.indexOf(trackerId)
        if (pos === -1) return
        fromRow.trackerIds.splice(pos, 1)
        // avoid duplicates
        const existing = toRow.trackerIds.indexOf(trackerId)
        if (existing !== -1) toRow.trackerIds.splice(existing, 1)
        const insertAt = index === undefined ? toRow.trackerIds.length : Math.max(0, Math.min(index, toRow.trackerIds.length))
        toRow.trackerIds.splice(insertAt, 0, trackerId)
      })
    },

    attachExtMeta: (id, ext) => {
      set((s) => {
        const t = s.trackersById[id]
        if (t) t.ext = ext
      })
    },

    setTrackerHeight: (id, height) => {
      set((s) => {
        const t = s.trackersById[id]
        if (t) t.height = Math.max(40, Math.round(height))
      })
    },

    moveFromRowToLoose: (fromRowId, trackerId, x, y) => {
      const snap = get().serialize()
      set((s) => { s.historyPast.push(snap); s.historyFuture = [] })
      set((s) => {
        const fromRow = s.rows.find((r) => r.id === fromRowId)
        if (!fromRow) return
        const idx = fromRow.trackerIds.indexOf(trackerId)
        if (idx !== -1) fromRow.trackerIds.splice(idx, 1)
        const t = s.trackersById[trackerId]
        if (t) {
          t.x = x
          t.y = y
        }
        if (!s.looseIds.includes(trackerId)) s.looseIds.push(trackerId)
      })
    },

    beginDragRow: (rowId) => {
      const row = get().rows.find((r) => r.id === rowId)
      set({ draggingRowId: rowId, dragRowStart: { x: row?.x ?? 0, y: row?.y ?? 0 } })
    },

    moveRowByDelta: (rowId, dx, dy, snapX, snapY) => {
      set((s) => {
        const row = s.rows.find((r) => r.id === rowId)
        if (!row) return
        const start = s.dragRowStart ?? { x: row.x ?? 0, y: row.y ?? 0 }
        row.x = snapToGrid(start.x + dx, snapX)
        row.y = snapToGrid(start.y + dy, snapY)
      })
    },

    endDragRow: () => set({ draggingRowId: undefined, dragRowStart: undefined }),

    beginVerticalDrag: (trackerId) => set({ verticalDragTrackerId: trackerId }),
    endVerticalDrag: () => set({ verticalDragTrackerId: undefined }),

    removeTracker: (id) => {
      const snap = get().serialize()
      set((s) => { s.historyPast.push(snap); s.historyFuture = [] })
      set((s) => {
        // remove from loose
        s.looseIds = s.looseIds.filter((tid) => tid !== id)
        // remove from any row
        for (const row of s.rows) {
          const idx = row.trackerIds.indexOf(id)
          if (idx !== -1) row.trackerIds.splice(idx, 1)
        }
        delete s.trackersById[id]
        // also clear selection if needed
        s.selectedIds = s.selectedIds.filter((tid) => tid !== id)
        if (s.draggingId === id) {
          s.draggingId = undefined
          s.dragStart = undefined
        }
      })
    },

    removeRow: (rowId) => {
      const snap = get().serialize()
      set((s) => { s.historyPast.push(snap); s.historyFuture = [] })
      set((s) => {
        const row = s.rows.find((r) => r.id === rowId)
        if (!row) return
        // delete trackers contained in the row
        for (const id of row.trackerIds) {
          delete s.trackersById[id]
          s.selectedIds = s.selectedIds.filter((tid) => tid !== id)
        }
        s.rows = s.rows.filter((r) => r.id !== rowId)
      })
    },

    setSelected: (ids) => {
      const curr = get().selectedIds
      if (curr.length === ids.length && curr.every((v, i) => v === ids[i])) {
        return
      }
      set({ selectedIds: ids })
    },
    clearSelection: () => set({ selectedIds: [] }),

    groupSelectedIntoRow: () => {
      const state = get()
      const looseSelected = state.selectedIds.filter((id) => state.looseIds.includes(id))
      if (looseSelected.length === 0) {
        console.warn('groupSelectedIntoRow: Nenhum tracker solto selecionado. Selecione trackers que estão soltos no canvas.')
        return undefined
      }
      const trackers = looseSelected.map((id) => state.trackersById[id]).filter(Boolean) as Tracker[]
      if (trackers.length === 0) {
        console.warn('groupSelectedIntoRow: Nenhum tracker válido encontrado.')
        return undefined
      }
      
      // Calculate position: use the leftmost and topmost positions
      // But account for row padding: px-4 (16px) header + px-2 (8px) content = 24px total offset
      const ROW_PADDING_OFFSET = 24 // px-4 (16px) + px-2 (8px)
      const minX = Math.min(...trackers.map((t) => t.x ?? 0))
      const minY = Math.min(...trackers.map((t) => t.y ?? 0))

      // Order by x (horizontal), then by y (vertical) for consistent arrangement
      const ordered = [...trackers].sort((a, b) => {
        const ax = a.x ?? 0
        const bx = b.x ?? 0
        if (Math.abs(ax - bx) < 30) {
          // If x positions are close (within 30px), sort by y
          return (a.y ?? 0) - (b.y ?? 0)
        }
        return ax - bx
      })
      
      const newRowId = nextId('row')
      set((s) => {
        // remove loose positions and ids
        for (const t of ordered) {
          const tt = s.trackersById[t.id]
          if (tt) {
            delete tt.x
            delete tt.y
          }
        }
        s.looseIds = s.looseIds.filter((id) => !looseSelected.includes(id))
        // Adjust X position to account for row padding so trackers align correctly
        // The row's X position should be minX - padding offset
        s.rows.push({
          id: newRowId,
          databaseId: null,
          trackerIds: ordered.map((t) => t.id),
          x: snapToGrid(minX - ROW_PADDING_OFFSET, 30),
          y: snapToGrid(minY, 30)
        })
        s.selectedIds = []
      })
      return newRowId
    },

    // Row Group actions
    addEmptyRowGroup: () => {
      const snap = get().serialize()
      set((s) => { s.historyPast.push(snap); s.historyFuture = [] })
      const id = nextId('group')
      set((s) => {
        // Calculate position to place group behind all existing elements
        let maxX = 0
        let maxY = 0
        
        // Check all existing groups
        for (const group of s.rowGroups) {
          maxX = Math.max(maxX, (group.x ?? 0) + 400) // 400 is group width
          maxY = Math.max(maxY, (group.y ?? 0) + 200) // 200 is group height
        }
        
        // Check all existing rows
        for (const row of s.rows) {
          maxX = Math.max(maxX, (row.x ?? 0) + 300) // 300 is row width
          maxY = Math.max(maxY, (row.y ?? 0) + 150) // 150 is row height
        }
        
        // Check all loose trackers
        for (const trackerId of s.looseIds) {
          const tracker = s.trackersById[trackerId]
          if (tracker) {
            maxX = Math.max(maxX, (tracker.x ?? 0) + 115) // 115 is tracker width
            maxY = Math.max(maxY, (tracker.y ?? 0) + 30)  // 30 is tracker height
          }
        }
        
        // Place group behind everything with some margin
        const groupX = Math.max(0, maxX + 50)
        const groupY = Math.max(0, maxY + 50)
        
        const nextSectionNumber = getNextSectionNumber(s.rowGroups)
        s.rowGroups.push({ 
          id, 
          databaseId: null,
          rowIds: [], 
          x: groupX, 
          y: groupY, 
          name: `Grupo ${s.rowGroups.length + 1}`,
          isFinalized: false,
          contourPath: '',
          sectionNumber: nextSectionNumber
        })
      })
      return id
    },

    addRowToGroup: (rowId, groupId) => {
      const snap = get().serialize()
      set((s) => { s.historyPast.push(snap); s.historyFuture = [] })
      set((s) => {
        const row = s.rows.find((r) => r.id === rowId)
        const group = s.rowGroups.find((g) => g.id === groupId)
        if (row && group) {
          // Remove from any existing group FIRST
          if (row.groupId && row.groupId !== groupId) {
            const oldGroup = s.rowGroups.find((g) => g.id === row.groupId)
            if (oldGroup) {
              oldGroup.rowIds = oldGroup.rowIds.filter((id) => id !== rowId)
            }
          }
          
          // Now add to new group
          // Initialize offset preserving relative position
          const groupRows = group.rowIds.map(id => s.rows.find(r => r.id === id)).filter(Boolean) as Row[]
          const allRows = [...groupRows, row]
          const minX = allRows.length > 0 ? Math.min(...allRows.map(r => r?.x ?? 0)) : (row.x ?? 0)
          row.groupOffsetX = (row.x ?? 0) - minX
          row.groupId = groupId
          if (!group.rowIds.includes(rowId)) {
            group.rowIds.push(rowId)
          }
        }
      })
    },

    removeRowFromGroup: (rowId) => {
      const snap = get().serialize()
      set((s) => { s.historyPast.push(snap); s.historyFuture = [] })
      set((s) => {
        const row = s.rows.find((r) => r.id === rowId)
        if (row) {
          const group = s.rowGroups.find((g) => g.id === row.groupId)
          if (group) {
            group.rowIds = group.rowIds.filter((id) => id !== rowId)
          }
          delete row.groupId
        }
      })
    },

    removeRowGroup: (groupId) => {
      const snap = get().serialize()
      set((s) => { s.historyPast.push(snap); s.historyFuture = [] })
      set((s) => {
        const group = s.rowGroups.find((g) => g.id === groupId)
        if (group) {
          // Remove group reference from all rows
          for (const rowId of group.rowIds) {
            const row = s.rows.find((r) => r.id === rowId)
            if (row) {
              delete row.groupId
            }
          }
          s.rowGroups = s.rowGroups.filter((g) => g.id !== groupId)
        }
      })
    },

    beginDragGroup: (groupId) => {
      const group = get().rowGroups.find((g) => g.id === groupId)
      set({ draggingGroupId: groupId, dragGroupStart: { x: group?.x ?? 0, y: group?.y ?? 0 } })
    },

    moveGroupByDelta: (groupId, dx, dy, snap) => {
      set((s) => {
        const group = s.rowGroups.find((g) => g.id === groupId)
        if (!group) return
        const start = s.dragGroupStart ?? { x: group.x ?? 0, y: group.y ?? 0 }
        group.x = snapToGrid(start.x + dx, snap)
        group.y = snapToGrid(start.y + dy, snap)
        
        // Move all rows in the group
        for (const rowId of group.rowIds) {
          const row = s.rows.find((r) => r.id === rowId)
          if (row) {
            row.x = snapToGrid((row.x ?? 0) + dx, snap)
            row.y = snapToGrid((row.y ?? 0) + dy, snap)
          }
        }
      })
    },

    endDragGroup: () => set({ draggingGroupId: undefined, dragGroupStart: undefined }),

    setGroupFinalized: (groupId, isFinalized, contourPath) => {
      set((s) => {
        const group = s.rowGroups.find((g) => g.id === groupId)
        if (!group) return

        group.isFinalized = isFinalized
        if (contourPath) {
          group.contourPath = contourPath
        }
      })
    },

    reorderRowsInGroup: (groupId, activeRowId, overRowId) => {
      const snap = get().serialize()
      set((s) => { s.historyPast.push(snap); s.historyFuture = [] })
      set((s) => {
        const group = s.rowGroups.find((g) => g.id === groupId)
        if (!group) return
        const from = group.rowIds.indexOf(activeRowId)
        const to = group.rowIds.indexOf(overRowId)
        if (from === -1 || to === -1) return
        const [moved] = group.rowIds.splice(from, 1)
        group.rowIds.splice(to, 0, moved)
      })
    },

    groupSelectedRowsIntoGroup: () => {
      const state = get()
      const selectedRows = state.selectedIds.filter((id) => 
        state.rows.some((r) => r.id === id)
      )
      if (selectedRows.length === 0) return undefined
      const snap = get().serialize()
      set((s) => { s.historyPast.push(snap); s.historyFuture = [] })

      const newGroupId = nextId('group')
      set((s) => {
        // Preserve on-screen order: sort by y asc, then x asc
        const rowsInOrder = [...selectedRows]
          .map((id) => s.rows.find((r) => r.id === id))
          .filter(Boolean) as Row[]
        rowsInOrder.sort((a, b) => {
          const ay = a.y ?? 0
          const by = b.y ?? 0
          if (ay !== by) return ay - by
          const ax = a.x ?? 0
          const bx = b.x ?? 0
          return ax - bx
        })

        // Compute left/top normalization to preserve relative positions
        const minX = Math.min(...rowsInOrder.map(r => r.x ?? 0))
        const minY = Math.min(...rowsInOrder.map(r => r.y ?? 0))

        const nextSectionNumber = getNextSectionNumber(s.rowGroups)
        s.rowGroups.push({ 
          id: newGroupId, 
          databaseId: null,
          rowIds: rowsInOrder.map((r) => r.id), 
          x: minX, 
          y: minY, 
          name: `Grupo ${s.rowGroups.length + 1}`,
          isFinalized: false,
          contourPath: '',
          sectionNumber: nextSectionNumber
        })
        
        // Update rows to reference the group
        // Calculate offset relative to the leftmost row position
        // The offset should align the content areas, not the row containers
        for (const rowId of rowsInOrder.map((r) => r.id)) {
          const row = s.rows.find((r) => r.id === rowId)
          if (row) {
            row.groupId = newGroupId
            // Offset is simply the difference in X positions
            // The padding is already accounted for in the row's x position
            row.groupOffsetX = (row.x ?? 0) - minX
          }
        }
        
        s.selectedIds = []
      })
      return newGroupId
    },

    duplicateSelected: () => {
      const snap = get().serialize()
      set((s) => { s.historyPast.push(snap); s.historyFuture = [] })
      const state = get()
      if (state.selectedIds.length === 0) return

      const offset = 20 // Offset for duplicated items
      const newIds: string[] = []
      
      set((s) => {
        // Duplicate loose trackers
        const selectedLoose = state.selectedIds.filter((id) => state.looseIds.includes(id))
        for (const id of selectedLoose) {
          const tracker = state.trackersById[id]
          if (tracker) {
            const newId = nextId('t')
            const newTracker: Tracker = {
              id: newId,
              databaseId: null,
              type: tracker.type,
              title: `${tracker.title} (cópia)`,
              x: (tracker.x ?? 0) + offset,
              y: (tracker.y ?? 0) + offset,
              ext: tracker.ext ? { ...tracker.ext } : undefined
            }
            s.trackersById[newId] = newTracker
            s.looseIds.push(newId)
            newIds.push(newId)
          }
        }

        // Duplicate standalone rows
        const selectedRows = state.selectedIds.filter((id) => 
          state.rows.some((r) => r.id === id && !r.groupId)
        )
        for (const rowId of selectedRows) {
          const row = state.rows.find((r) => r.id === rowId)
          if (row) {
            const newRowId = nextId('row')
            const newTrackerIds: string[] = []
            
            // Duplicate trackers in the row
            for (const trackerId of row.trackerIds) {
              const tracker = state.trackersById[trackerId]
              if (tracker) {
                const newTrackerId = nextId('t')
              const originalTitle = tracker.title || 'Tracker'
              const baseTitle = originalTitle.replace(/\(\s*c[oó]pia\s*\)$/i, '').trim()
              const suffixMatch = originalTitle.match(/_(\d+)$/)
              let newTitle: string
              if (suffixMatch) {
                const num = parseInt(suffixMatch[1], 10)
                newTitle = `${baseTitle}_${num + 1}`
              } else {
                newTitle = `${baseTitle}_1`
              }

              const newTracker: Tracker = {
                  id: newTrackerId,
                  databaseId: null,
                  type: tracker.type,
                title: newTitle,
                  rowY: tracker.rowY,
                  ext: tracker.ext ? { ...tracker.ext } : undefined
                }
                s.trackersById[newTrackerId] = newTracker
                newTrackerIds.push(newTrackerId)
              }
            }
            
            const newRow: Row = {
              id: newRowId,
              databaseId: null,
              trackerIds: newTrackerIds,
              x: (row.x ?? 0) + offset,
              y: (row.y ?? 0) + offset,
              isFinalized: false,
              contourPath: ''
            }
            s.rows.push(newRow)
            newIds.push(newRowId)
          }
        }

        // Duplicate rows that are inside groups (keep them in the same group)
        const selectedRowsInGroups = state.selectedIds.filter((id) => 
          state.rows.some((r) => r.id === id && r.groupId)
        )
        for (const rowId of selectedRowsInGroups) {
          const row = s.rows.find((r) => r.id === rowId)
          if (row && row.groupId) {
            const group = s.rowGroups.find((g) => g.id === row.groupId)
            if (group) {
              const newRowId = nextId('row')
              const newTrackerIds: string[] = []
              
              // Duplicate trackers in the row
              for (const trackerId of row.trackerIds) {
                const tracker = state.trackersById[trackerId]
                if (tracker) {
                  const newTrackerId = nextId('t')
                  const originalTitle = tracker.title || 'Tracker'
                  const baseTitle = originalTitle.replace(/\(\s*c[oó]pia\s*\)$/i, '').trim()
                  const suffixMatch = originalTitle.match(/_(\d+)$/)
                  let newTitle: string
                  if (suffixMatch) {
                    const num = parseInt(suffixMatch[1], 10)
                    newTitle = `${baseTitle}_${num + 1}`
                  } else {
                    newTitle = `${baseTitle}_1`
                  }

                  const newTracker: Tracker = {
                    id: newTrackerId,
                    databaseId: null,
                    type: tracker.type,
                    title: newTitle,
                    rowY: tracker.rowY,
                    ext: tracker.ext ? { ...tracker.ext } : undefined
                  }
                  s.trackersById[newTrackerId] = newTracker
                  newTrackerIds.push(newTrackerId)
                }
              }
              
              // Create new row with same groupId and groupOffsetX
              const newRow: Row = {
                id: newRowId,
                databaseId: null,
                trackerIds: newTrackerIds,
                x: row.x ?? 0, // Keep same x position (group handles positioning)
                y: row.y ?? 0, // Keep same y position
                groupId: row.groupId, // Keep in the same group
                groupOffsetX: row.groupOffsetX ?? 0, // Keep same offset
                isFinalized: false,
                contourPath: ''
              }
              s.rows.push(newRow)
              
              // Add the new row to the group's rowIds
              if (!group.rowIds.includes(newRowId)) {
                group.rowIds.push(newRowId)
              }
              
              newIds.push(newRowId)
            }
          }
        }

        // Duplicate row groups
        const selectedGroups = state.selectedIds.filter((id) => 
          state.rowGroups.some((g) => g.id === id)
        )
        for (const groupId of selectedGroups) {
          const group = state.rowGroups.find((g) => g.id === groupId)
          if (group) {
            const newGroupId = nextId('group')
            const newRowIds: string[] = []
            
            // Duplicate all rows in the group
            for (const rowId of group.rowIds) {
              const row = state.rows.find((r) => r.id === rowId)
              if (row) {
                const newRowId = nextId('row')
                const newTrackerIds: string[] = []
                
                // Duplicate trackers in the row
                for (const trackerId of row.trackerIds) {
                  const tracker = state.trackersById[trackerId]
                  if (tracker) {
                    const newTrackerId = nextId('t')
                    const newTracker: Tracker = {
                      id: newTrackerId,
                      databaseId: null,
                      type: tracker.type,
                      title: `${tracker.title} (cópia)`,
                      rowY: tracker.rowY,
                      ext: tracker.ext ? { ...tracker.ext } : undefined
                    }
                    s.trackersById[newTrackerId] = newTracker
                    newTrackerIds.push(newTrackerId)
                  }
                }
                
                const newRow: Row = {
                  id: newRowId,
                  databaseId: null,
                  trackerIds: newTrackerIds,
                  x: (row.x ?? 0) + offset,
                  y: (row.y ?? 0) + offset,
                  groupId: newGroupId,
                  isFinalized: false,
                  contourPath: ''
                }
                s.rows.push(newRow)
                newRowIds.push(newRowId)
              }
            }
            
            const baseGroupName = group.name?.replace(/\(\s*c[oó]pia\s*\)$/i, '').trim() || `Grupo ${groupId}`
            const groupSuffixMatch = group.name?.match(/_(\d+)$/)
            const newGroupName = groupSuffixMatch
              ? `${baseGroupName}_${parseInt(groupSuffixMatch[1], 10) + 1}`
              : `${baseGroupName}_1`

            const nextSectionNumber = getNextSectionNumber(s.rowGroups)
            const newGroup: RowGroup = {
              id: newGroupId,
              databaseId: null,
              rowIds: newRowIds,
              x: (group.x ?? 0) + offset,
              y: (group.y ?? 0) + offset,
              isFinalized: false,
              contourPath: '',
              name: newGroupName,
              sectionNumber: nextSectionNumber
            }
            s.rowGroups.push(newGroup)
            newIds.push(newGroupId)
          }
        }

        // Duplicate text elements
        const selectedTexts = state.selectedIds.filter((id) => state.textElementIds.includes(id))
        for (const id of selectedTexts) {
          const text = state.textElementsById[id]
          if (text) {
            const newId = nextId('text')
            const newText: TextElement = {
              id: newId,
              x: text.x + offset,
              y: text.y + offset,
              text: text.text,
              fontSize: text.fontSize,
              color: text.color,
              fontWeight: text.fontWeight,
              fontStyle: text.fontStyle,
              textDecoration: text.textDecoration,
              textAlign: text.textAlign
            }
            s.textElementsById[newId] = newText
            s.textElementIds.push(newId)
            newIds.push(newId)
          }
        }

        // Select the newly created items
        s.selectedIds = newIds
      })
    },

    serialize: () => {
      const s = get()

      // Build nested structure: groups -> rows -> trackers
      const groups = s.rowGroups.map((g, groupIndex) => {
        const rowsInGroup = g.rowIds
          .map((rowId) => s.rows.find((r) => r.id === rowId))
          .filter(Boolean) as Row[]

        const rows = rowsInGroup.map((r, rowIndex) => ({
          id: r.databaseId ?? r.id,
          databaseId: r.databaseId ?? null,
          x: r.x ?? 0,
          y: r.y ?? 0,
          row_number: rowIndex + 1,
          groupOffsetX: r.groupOffsetX ?? 0,
          isFinalized: r.isFinalized ?? false,
          contourPath: r.contourPath ?? '',
          trackers: r.trackerIds.map((tid, trackerIndex) => {
            const t = s.trackersById[tid]
            return {
              id: t.databaseId ?? t.id,
              databaseId: t.databaseId ?? null,
              type: t.type,
              title: t.title,
              rowY: t.rowY ?? 0,
              ext: t.ext,
              stakeStatusIds: t.stakeStatusIds,
              position: trackerIndex + 1
            }
          })
        }))

        return {
          id: g.databaseId ?? g.id,
          databaseId: g.databaseId ?? null,
          name: g.name,
          x: g.x ?? 0,
          y: g.y ?? 0,
          isFinalized: g.isFinalized ?? false,
          contourPath: g.contourPath ?? '',
          section_number: groupIndex + 1,
          rows
        }
      })

      // Standalone rows (not in any group)
      const standaloneRows = s.rows
        .filter((r) => !r.groupId)
        .map((r, rowIndex) => ({
          id: r.databaseId ?? r.id,
          databaseId: r.databaseId ?? null,
          x: r.x ?? 0,
          y: r.y ?? 0,
          row_number: rowIndex + 1,
          isFinalized: r.isFinalized ?? false,
          contourPath: r.contourPath ?? '',
          trackers: r.trackerIds.map((tid, trackerIndex) => {
            const t = s.trackersById[tid]
            return {
              id: t.databaseId ?? t.id,
              databaseId: t.databaseId ?? null,
              type: t.type,
              title: t.title,
              rowY: t.rowY ?? 0,
              ext: t.ext,
              stakeStatusIds: t.stakeStatusIds,
              position: trackerIndex + 1
            }
          })
        }))

      const loose = s.looseIds.map((id) => {
        const t = s.trackersById[id]
        return { id: t.databaseId ?? t.id, databaseId: t.databaseId ?? null, type: t.type, title: t.title, x: t.x ?? 0, y: t.y ?? 0, ext: t.ext, stakeStatusIds: t.stakeStatusIds }
      })

      const textElements = s.textElementIds.map((id) => {
        const text = s.textElementsById[id]
        return {
          id: text.id,
          x: text.x,
          y: text.y,
          text: text.text,
          fontSize: text.fontSize,
          color: text.color,
          fontWeight: text.fontWeight,
          fontStyle: text.fontStyle,
          textDecoration: text.textDecoration,
          textAlign: text.textAlign
        }
      })

      const json = {
        groups,
        standaloneRows,
        loose,
        textElements,
        settings: {
          trackerWidth: 109,
          gap: 8,
          padding: 8,
          contourPadding: 2,
          stakeSize: 30,
          stakeGap: 4
        }
      }

      return JSON.stringify(json, null, 2)
    },

    setZoom: (zoom) => {
      set((s) => {
        s.zoom = Math.max(0.1, Math.min(3, zoom))
      })
    },

    zoomIn: () => {
      set((s) => {
        s.zoom = Math.min(3, s.zoom * 1.2)
      })
    },

    zoomOut: () => {
      set((s) => {
        s.zoom = Math.max(0.1, s.zoom / 1.2)
      })
    },

    resetZoom: () => {
      set({ zoom: 1 })
    },

    setPan: (x, y) => {
      set((s) => {
        s.panX = x
        s.panY = y
      })
    },

    resetPan: () => {
      set({ panX: 0, panY: 0 })
    },

    alignSelected: (type) => {
      set((s) => {
        // Handle loose trackers
        const selectedTrackers = s.selectedIds.filter((id) => s.looseIds.includes(id))
        if (selectedTrackers.length >= 2) {
          const trackers = selectedTrackers.map((id) => s.trackersById[id]).filter(Boolean) as Tracker[]
          if (trackers.length >= 2) {
            // Calculate actual tracker dimensions based on stakes
            const positions = trackers.map((t) => {
              const stakeCount = t?.ext?.stake_quantity ?? 0
              const height = calculateTrackerHeight(stakeCount)
              return { x: t.x ?? 0, y: t.y ?? 0, width: 30, height }
            })

            if (type === 'left') {
              const minX = Math.min(...positions.map((p) => p.x))
              trackers.forEach((t) => {
                if (t.x !== undefined) t.x = minX
              })
            } else if (type === 'right') {
              const maxX = Math.max(...positions.map((p) => p.x + p.width))
              trackers.forEach((t) => {
                if (t.x !== undefined) t.x = maxX - 30
              })
            } else if (type === 'center') {
              const minX = Math.min(...positions.map((p) => p.x))
              const maxX = Math.max(...positions.map((p) => p.x + p.width))
              const centerX = (minX + maxX) / 2
              trackers.forEach((t) => {
                if (t.x !== undefined) t.x = centerX - 15
              })
            } else if (type === 'top') {
              const minY = Math.min(...positions.map((p) => p.y))
              trackers.forEach((t) => {
                if (t.y !== undefined) t.y = minY
              })
            } else if (type === 'bottom') {
              const maxY = Math.max(...positions.map((p) => p.y + p.height))
              trackers.forEach((t, index) => {
                const trackerHeight = positions[index].height
                if (t.y !== undefined) t.y = maxY - trackerHeight
              })
            } else if (type === 'middle') {
              const minY = Math.min(...positions.map((p) => p.y))
              const maxY = Math.max(...positions.map((p) => p.y + p.height))
              const centerY = (minY + maxY) / 2
              trackers.forEach((t, index) => {
                const trackerHeight = positions[index].height
                if (t.y !== undefined) t.y = centerY - trackerHeight / 2
              })
            }

            // Snap to grid
            trackers.forEach((t) => {
              if (t.x !== undefined) t.x = snapToGrid(t.x, 30)
              if (t.y !== undefined) t.y = snapToGrid(t.y, 30)
            })
          }
        }

        // Handle rows (not in groups)
        const selectedRows = s.selectedIds.filter((id) => s.rows.some((r) => r.id === id && !r.groupId))
        if (selectedRows.length >= 2) {
          const rows = selectedRows.map((id) => s.rows.find((r) => r.id === id)).filter(Boolean) as Row[]
          if (rows.length >= 2) {
            const rowData = rows.map((r) => ({
              row: r,
              x: r.x ?? 0,
              y: r.y ?? 0,
              height: calculateRowHeight(r, s.trackersById)
            }))

            if (type === 'left') {
              const minX = Math.min(...rowData.map((d) => d.x))
              rows.forEach((r) => {
                if (r.x !== undefined) r.x = minX
              })
            } else if (type === 'right') {
              // For rows, we'd need width, but rows don't have fixed width
              // Skip right alignment for rows for now
            } else if (type === 'center') {
              // Skip center alignment for rows for now (would need width)
            } else if (type === 'top') {
              // Sort rows by current Y position to stack them properly
              const sortedRows = [...rowData].sort((a, b) => a.y - b.y)
              let currentY = sortedRows[0].y
              
              sortedRows.forEach((data) => {
                if (data.row.y !== undefined) {
                  data.row.y = currentY
                  // Move to next position: current Y + height of this row + gap mínimo de 4px
                  currentY = currentY + data.height + 4 // gap mínimo entre rows
                }
              })
            } else if (type === 'bottom') {
              const maxY = Math.max(...rowData.map((d) => d.y + d.height))
              rows.forEach((r) => {
                const rowH = calculateRowHeight(r, s.trackersById)
                if (r.y !== undefined) r.y = maxY - rowH
              })
            } else if (type === 'middle') {
              const minY = Math.min(...rowData.map((d) => d.y))
              const maxY = Math.max(...rowData.map((d) => d.y + d.height))
              const centerY = (minY + maxY) / 2
              rows.forEach((r) => {
                const rowH = calculateRowHeight(r, s.trackersById)
                if (r.y !== undefined) r.y = centerY - rowH / 2
              })
            }

            // Snap to grid
            rows.forEach((r) => {
              if (r.x !== undefined) r.x = snapToGrid(r.x, 30)
              if (r.y !== undefined) r.y = snapToGrid(r.y, 30)
            })
          }
        }

        // Handle row groups
        const selectedGroups = s.selectedIds.filter((id) => s.rowGroups.some((g) => g.id === id))
        if (selectedGroups.length >= 2) {
          const groups = selectedGroups.map((id) => s.rowGroups.find((g) => g.id === id)).filter(Boolean) as RowGroup[]
          if (groups.length >= 2) {
            // Calculate group dimensions based on their rows and offsets
            const groupData = groups.map((g) => {
              const groupRows = g.rowIds.map((rowId) => s.rows.find((r) => r.id === rowId)).filter(Boolean) as Row[]
              if (groupRows.length === 0) {
                return { group: g, x: g.x ?? 0, y: g.y ?? 0, width: 200, height: 120 }
              }
              
              // Calculate width: consider max offset + row width
              // Each row has a groupOffsetX that positions it within the group
              // Width = max(offsetX + rowWidth) - min(offsetX) + padding
              const rowWidths = groupRows.map((r) => {
                const trackerCount = r.trackerIds.length
                // 30px tracker width + 8px gap between trackers
                const rowContentWidth = trackerCount > 0 ? trackerCount * 30 + (trackerCount - 1) * 8 : 200
                // Add padding: px-2 = 8px on each side = 16px total
                return rowContentWidth + 16
              })
              
              const maxOffsetX = Math.max(...groupRows.map((r) => r.groupOffsetX ?? 0))
              const minOffsetX = Math.min(...groupRows.map((r) => r.groupOffsetX ?? 0))
              const maxRowWidth = Math.max(...rowWidths)
              // Total width = distance from leftmost to rightmost edge
              const estimatedWidth = Math.max(200, maxOffsetX + maxRowWidth - minOffsetX + 32) // +32 for group padding
              
              // Calculate height: sum of row heights + gaps between rows
              const rowHeights = groupRows.map((r) => calculateRowHeight(r, s.trackersById))
              const totalHeight = rowHeights.reduce((sum, h) => sum + h, 0) + (groupRows.length - 1) * 4 // 4px gap between rows
              // Add padding: pt-2 (8px) + py-2 (8px top + 8px bottom) = 24px
              const estimatedHeight = Math.max(120, totalHeight + 24)
              
              return {
                group: g,
                x: g.x ?? 0,
                y: g.y ?? 0,
                width: estimatedWidth,
                height: estimatedHeight
              }
            })

            if (type === 'left') {
              const minX = Math.min(...groupData.map((d) => d.x))
              groups.forEach((g) => {
                if (g.x !== undefined) g.x = minX
              })
            } else if (type === 'right') {
              const maxX = Math.max(...groupData.map((d) => d.x + d.width))
              groups.forEach((g, index) => {
                const groupWidth = groupData[index].width
                if (g.x !== undefined) g.x = maxX - groupWidth
              })
            } else if (type === 'center') {
              const minX = Math.min(...groupData.map((d) => d.x))
              const maxX = Math.max(...groupData.map((d) => d.x + d.width))
              const centerX = (minX + maxX) / 2
              groups.forEach((g, index) => {
                const groupWidth = groupData[index].width
                if (g.x !== undefined) g.x = centerX - groupWidth / 2
              })
            } else if (type === 'top') {
              const minY = Math.min(...groupData.map((d) => d.y))
              groups.forEach((g) => {
                if (g.y !== undefined) g.y = minY
              })
            } else if (type === 'bottom') {
              const maxY = Math.max(...groupData.map((d) => d.y + d.height))
              groups.forEach((g, index) => {
                const groupHeight = groupData[index].height
                if (g.y !== undefined) g.y = maxY - groupHeight
              })
            } else if (type === 'middle') {
              const minY = Math.min(...groupData.map((d) => d.y))
              const maxY = Math.max(...groupData.map((d) => d.y + d.height))
              const centerY = (minY + maxY) / 2
              groups.forEach((g, index) => {
                const groupHeight = groupData[index].height
                if (g.y !== undefined) g.y = centerY - groupHeight / 2
              })
            }

            // Snap to grid
            groups.forEach((g) => {
              if (g.x !== undefined) g.x = snapToGrid(g.x, 30)
              if (g.y !== undefined) g.y = snapToGrid(g.y, 30)
            })
          }
        }
      })
    },

    distributeSelected: (type) => {
      set((s) => {
        const selected = s.selectedIds.filter((id) => s.looseIds.includes(id))
        if (selected.length < 3) return

        const trackers = selected.map((id) => s.trackersById[id]).filter(Boolean) as Tracker[]
        if (trackers.length < 3) return

        if (type === 'horizontal') {
          // Sort by X position
          const sorted = [...trackers].sort((a, b) => (a.x ?? 0) - (b.x ?? 0))
          const leftmost = sorted[0].x ?? 0
          const rightmost = sorted[sorted.length - 1].x ?? 0
          const totalWidth = rightmost - leftmost
          const spacing = totalWidth / (sorted.length - 1)

          sorted.forEach((tracker, index) => {
            if (tracker.x !== undefined) {
              tracker.x = snapToGrid(leftmost + (spacing * index), 10)
            }
          })
        } else if (type === 'vertical') {
          // Sort by Y position
          const sorted = [...trackers].sort((a, b) => (a.y ?? 0) - (b.y ?? 0))
          const topmost = sorted[0].y ?? 0
          const bottommost = sorted[sorted.length - 1].y ?? 0
          const totalHeight = bottommost - topmost
          const spacing = totalHeight / (sorted.length - 1)

          sorted.forEach((tracker, index) => {
            if (tracker.y !== undefined) {
              tracker.y = snapToGrid(topmost + (spacing * index), 10)
            }
          })
        }
      })
    },

    moveTrackerInRow: (trackerId, _rowId, deltaY) => {
      set((s) => {
        const tracker = s.trackersById[trackerId]
        if (!tracker) return

        // Initialize rowY if not set
        if (tracker.rowY === undefined) {
          tracker.rowY = 0
        }

        // Update rowY with snap to grid
        tracker.rowY = snapToGrid(tracker.rowY + deltaY, 10)
      })
    },

    setTrackerRowY: (trackerId, rowY) => {
      set((s) => {
        const tracker = s.trackersById[trackerId]
        if (!tracker) return

        // Set absolute position with snap to grid
        tracker.rowY = snapToGrid(rowY, 10)
      })
    },

    setRowFinalized: (rowId, isFinalized, contourPath) => {
      set((s) => {
        const row = s.rows.find((r) => r.id === rowId)
        if (!row) return

        row.isFinalized = isFinalized
        if (contourPath) {
          row.contourPath = contourPath
        }
      })
    },

    loadFromJson: (jsonData) => {
      try {
        const parsedData = JSON.parse(jsonData)
        
        set((s) => {
          // Clear existing data
          s.trackersById = {}
          s.looseIds = []
          s.rows = []
          s.rowGroups = []
          s.textElementsById = {}
          s.textElementIds = []
          s.selectedIds = []
          
          // Load trackers
          const allTrackerIds: string[] = []
          
          // Helper function to get tracker metadata from store or catalog
          const getTrackerFromCatalog = (trackersId: number): ExtMeta | undefined => {
            // Tenta buscar do store primeiro (trackers da API)
            const storeTracker = useTrackersStore.getState().getTrackerById(trackersId)
            if (storeTracker) {
              return {
                id: storeTracker.id,
                stake_quantity: storeTracker.stake_quantity,
                max_modules: storeTracker.max_modules,
                type: storeTracker._trackers_types.type,
                manufacturer: storeTracker._manufacturers.name
              }
            }
            // Fallback para o catálogo estático
            const catalogTracker = TRACKERS_CATALOG.find(t => t.id === trackersId)
            if (!catalogTracker) return undefined
            return {
              id: catalogTracker.id,
              stake_quantity: catalogTracker.stake_quantity,
              max_modules: catalogTracker.max_modules,
              type: catalogTracker._trackers_types.type,
              manufacturer: catalogTracker._manufacturers.name
            }
          }
          
          // Check if it's database structure (array of sections/rows) or old structure (object with groups)
          const isDatabaseStructure = Array.isArray(parsedData)
          
          if (isDatabaseStructure) {
            // Check structure type:
            // 1. Sections with rows inside: parsedData[0].rows[0].list_rows_trackers
            // 2. Rows directly: parsedData[0].list_rows_trackers
            // 3. Old structure: parsedData[0].rows (sections with nested structure)
            const firstItem = parsedData[0]
            const isSectionsWithRows = firstItem?.rows && Array.isArray(firstItem.rows) && firstItem.rows.length > 0 && firstItem.rows[0]?.list_rows_trackers !== undefined
            const isNewRowStructure = firstItem?.list_rows_trackers !== undefined
            
            if (isSectionsWithRows) {
              // Structure: array of sections, each with rows containing list_rows_trackers
              parsedData.forEach((sectionData: any) => {
                const sectionId = String(sectionData.id)
                
                // Create section (group) from database
                const section: RowGroup = {
                  id: sectionId,
                  databaseId: parseDatabaseId(sectionData.id),
                  x: sectionData.x ?? 0,
                  y: sectionData.y ?? 0,
                  isFinalized: sectionData.isFinalized ?? false,
                  contourPath: sectionData.contourPath ?? '',
                  name: sectionData.section_number !== undefined ? `Section ${sectionData.section_number}` : `Section ${sectionId}`,
                  sectionNumber: sectionData.section_number,
                  rowIds: sectionData.rows ? sectionData.rows.map((rowData: any) => String(rowData.id)) : []
                }
                s.rowGroups.push(section)
                
                // Process rows in this section
                if (sectionData.rows && Array.isArray(sectionData.rows)) {
                  sectionData.rows.forEach((rowData: any) => {
                    const rowId = String(rowData.id)
                    const row: Row = {
                      id: rowId,
                      databaseId: parseDatabaseId(rowData.id),
                      x: rowData.x ?? 0,
                      y: rowData.y ?? 0,
                      isFinalized: rowData.isFinalized ?? false,
                      contourPath: rowData.contourPath ?? '',
                      groupId: sectionId,
                      groupOffsetX: rowData.groupOffsetX ?? 0,
                      trackerIds: rowData.list_rows_trackers ? rowData.list_rows_trackers.map((trackerData: any) => String(trackerData.id)) : []
                    }
                    s.rows.push(row)
                    
                    // Load trackers from this row
                    if (rowData.list_rows_trackers) {
                      rowData.list_rows_trackers.forEach((trackerData: any) => {
                        const trackerId = String(trackerData.id)
                        const catalogExt = getTrackerFromCatalog(trackerData.trackers_id)
                        
                        // Extract stakeStatusIds from list_trackers_stakes
                        // Order by stake position (A, B, C, etc.) or by array index
                        let stakeStatusIds: (number | null)[] | undefined = undefined
                        if (trackerData.list_trackers_stakes && Array.isArray(trackerData.list_trackers_stakes)) {
                          // Sort stakes by position (A, B, C...) or keep original order
                          const sortedStakes = [...trackerData.list_trackers_stakes].sort((a: any, b: any) => {
                            const posA = a.stakes?.position || ''
                            const posB = b.stakes?.position || ''
                            if (posA && posB) {
                              return posA.localeCompare(posB)
                            }
                            return 0
                          })
                          
                          stakeStatusIds = sortedStakes.map((stake: any) => {
                            return stake.stakes_statuses_id ?? null
                          })
                        }
                        
                        // Use stake_quantity from JSON (trackerData.trackers.stake_quantity) if available,
                        // otherwise fall back to catalog
                        const actualStakeQuantity = trackerData.trackers?.stake_quantity ?? catalogExt?.stake_quantity ?? 0
                        
                        // Create ext metadata with actual stake_quantity from JSON
                        const ext: ExtMeta | undefined = catalogExt ? {
                          ...catalogExt,
                          stake_quantity: actualStakeQuantity
                        } : undefined
                        
                        const tracker: Tracker = {
                          id: trackerId,
                          databaseId: parseDatabaseId(trackerData.id),
                          type: 'ext',
                          title: 'Tracker',
                          rowY: trackerData.rowY ?? 0,
                          ext: ext,
                          stakeStatusIds: stakeStatusIds
                        }
                        s.trackersById[tracker.id] = tracker
                        allTrackerIds.push(tracker.id)
                      })
                    }
                  })
                }
              })
            } else if (isNewRowStructure) {
              // New structure: array of rows, each with list_rows_trackers
              // Group rows by sections_id to create groups
              const rowsBySection = new Map<number, any[]>()
              
              parsedData.forEach((rowData: any) => {
                const sectionId = rowData.sections_id
                if (!rowsBySection.has(sectionId)) {
                  rowsBySection.set(sectionId, [])
                }
                rowsBySection.get(sectionId)!.push(rowData)
              })
              
              // Create groups (sections) and their rows
              rowsBySection.forEach((rowsInSection, sectionId) => {
                const sectionIdStr = String(sectionId)
                const inferredSectionNumber =
                  rowsInSection.find((rowData: any) => rowData.section_number !== undefined)?.section_number ??
                  rowsInSection[0]?.sections?.section_number
                const section: RowGroup = {
                  id: sectionIdStr,
                  databaseId: parseDatabaseId(sectionId),
                  x: 0, // Will be set from row positions or saved separately
                  y: 0,
                  isFinalized: false,
                  contourPath: '',
                  name: `Section ${sectionId}`,
                  rowIds: rowsInSection.map((rowData: any) => String(rowData.id)),
                  sectionNumber: inferredSectionNumber
                }
                s.rowGroups.push(section)
                
                // Process each row in this section
                rowsInSection.forEach((rowData: any) => {
                  const rowId = String(rowData.id)
                  const row: Row = {
                    id: rowId,
                    databaseId: parseDatabaseId(rowData.id),
                    x: 0, // Will be set from saved positions
                    y: 0,
                    isFinalized: false,
                    contourPath: '',
                    groupId: sectionIdStr,
                    groupOffsetX: 0,
                    trackerIds: rowData.list_rows_trackers ? rowData.list_rows_trackers.map((trackerData: any) => String(trackerData.id)) : []
                  }
                  s.rows.push(row)
                  
                  // Load trackers from this row
                  if (rowData.list_rows_trackers) {
                    rowData.list_rows_trackers.forEach((trackerData: any) => {
                      const trackerId = String(trackerData.id)
                      const catalogExt = getTrackerFromCatalog(trackerData.trackers_id)
                      
                      // Extract stakeStatusIds from list_trackers_stakes
                      // Order by stake position (A, B, C, etc.) or by array index
                      let stakeStatusIds: (number | null)[] | undefined = undefined
                      if (trackerData.list_trackers_stakes && Array.isArray(trackerData.list_trackers_stakes)) {
                        // Sort stakes by position (A, B, C...) or keep original order
                        const sortedStakes = [...trackerData.list_trackers_stakes].sort((a: any, b: any) => {
                          const posA = a.stakes?.position || ''
                          const posB = b.stakes?.position || ''
                          if (posA && posB) {
                            return posA.localeCompare(posB)
                          }
                          return 0
                        })
                        
                        stakeStatusIds = sortedStakes.map((stake: any) => {
                          return stake.stakes_statuses_id ?? null
                        })
                      }
                      
                      // Use stake_quantity from JSON (trackerData.trackers.stake_quantity) if available,
                      // otherwise fall back to catalog
                      const actualStakeQuantity = trackerData.trackers?.stake_quantity ?? catalogExt?.stake_quantity ?? 0
                      
                      // Create ext metadata with actual stake_quantity from JSON
                      const ext: ExtMeta | undefined = catalogExt ? {
                        ...catalogExt,
                        stake_quantity: actualStakeQuantity
                      } : undefined
                      
                      const tracker: Tracker = {
                        id: trackerId,
                        databaseId: parseDatabaseId(trackerData.id),
                        type: 'ext',
                        title: 'Tracker',
                        rowY: trackerData.rowY ?? 0,
                        ext: ext,
                        stakeStatusIds: stakeStatusIds
                      }
                      s.trackersById[tracker.id] = tracker
                      allTrackerIds.push(tracker.id)
                    })
                  }
                })
              })
            } else {
              // Old database structure: array of sections
              parsedData.forEach((sectionData: any) => {
                const sectionId = String(sectionData.id)
                
                // Create section (group) from database
                const section: RowGroup = {
                  id: sectionId,
                  databaseId: parseDatabaseId(sectionData.id),
                  x: sectionData.x ?? 0,
                  y: sectionData.y ?? 0,
                  isFinalized: sectionData.isFinalized ?? false,
                  contourPath: sectionData.contourPath ?? '',
                  name: `Section ${sectionData.section_number}`,
                  sectionNumber: sectionData.section_number,
                  rowIds: sectionData.rows ? sectionData.rows.map((rowData: any) => String(rowData.id)) : []
                }
                s.rowGroups.push(section)

                // Load rows for this section
                if (sectionData.rows) {
                  sectionData.rows.forEach((rowData: any) => {
                    const rowId = String(rowData.id)
                    const row: Row = {
                      id: rowId,
                      databaseId: parseDatabaseId(rowData.id),
                      x: rowData.x ?? 0,
                      y: rowData.y ?? 0,
                      isFinalized: rowData.isFinalized ?? false,
                      contourPath: rowData.contourPath ?? '',
                      groupId: sectionId,
                      groupOffsetX: rowData.groupOffsetX ?? 0,
                      trackerIds: rowData.trackers ? rowData.trackers.map((trackerData: any) => String(trackerData.id)) : []
                    }
                    s.rows.push(row)

                    // Load trackers from this row into trackersById
                    if (rowData.trackers) {
                      rowData.trackers.forEach((trackerData: any) => {
                        const trackerId = String(trackerData.id)
                        const ext = getTrackerFromCatalog(trackerData.trackers_id ?? trackerData.trackersId)
                        
                        const tracker: Tracker = {
                          id: trackerId,
                          databaseId: parseDatabaseId(trackerData.id),
                          type: 'ext',
                          title: 'Tracker',
                          rowY: trackerData.rowY ?? 0,
                          ext: ext,
                          stakeStatusIds: trackerData.stakeStatusIds ?? undefined
                        }
                        s.trackersById[tracker.id] = tracker
                        allTrackerIds.push(tracker.id)
                      })
                    }
                  })
                }
              })
            }

            // Load text elements from database structure (if they exist at root level)
            if (Array.isArray(parsedData) && parsedData.length > 0 && parsedData[0].textElements) {
              parsedData[0].textElements.forEach((textData: any) => {
                const text: TextElement = {
                  id: String(textData.id),
                  x: textData.x ?? 0,
                  y: textData.y ?? 0,
                  text: textData.text ?? 'Novo texto',
                  fontSize: textData.fontSize ?? 14,
                  color: textData.color ?? '#000000',
                  fontWeight: textData.fontWeight ?? 'normal',
                  fontStyle: textData.fontStyle ?? 'normal',
                  textDecoration: textData.textDecoration ?? 'none',
                  textAlign: textData.textAlign ?? 'left'
                }
                s.textElementsById[text.id] = text
                s.textElementIds.push(text.id)
              })
            }
          } else {
            // Old structure: object with groups, standaloneRows, loose
            const data = parsedData
            
            // Load groups and their rows/trackers
            if (data.groups) {
              data.groups.forEach((groupData: any) => {
                const group: RowGroup = {
                  id: String(groupData.id),
                  databaseId: parseDatabaseId(groupData.databaseId ?? groupData.id),
                  x: groupData.x ?? 0,
                  y: groupData.y ?? 0,
                  isFinalized: groupData.isFinalized ?? false,
                  contourPath: groupData.contourPath ?? '',
                  name: groupData.name,
                  rowIds: groupData.rows ? groupData.rows.map((rowData: any) => String(rowData.id)) : [],
                  sectionNumber: groupData.section_number
                }
                s.rowGroups.push(group)

                // Load rows for this group
                if (groupData.rows) {
                  groupData.rows.forEach((rowData: any) => {
                    const row: Row = {
                      id: String(rowData.id),
                      databaseId: parseDatabaseId(rowData.databaseId ?? rowData.id),
                      x: rowData.x ?? 0,
                      y: rowData.y ?? 0,
                      isFinalized: rowData.isFinalized ?? false,
                      contourPath: rowData.contourPath ?? '',
                      groupId: String(groupData.id),
                      groupOffsetX: rowData.groupOffsetX ?? 0,
                      trackerIds: rowData.trackers ? rowData.trackers.map((trackerData: any) => String(trackerData.id)) : []
                    }
                    s.rows.push(row)

                    // Load trackers from this row into trackersById
                    if (rowData.trackers) {
                      rowData.trackers.forEach((trackerData: any) => {
                        const tracker: Tracker = {
                          id: String(trackerData.id),
                          databaseId: parseDatabaseId(trackerData.databaseId ?? trackerData.id),
                          type: trackerData.type ?? 'ext',
                          title: trackerData.title ?? 'Tracker',
                          rowY: trackerData.rowY ?? 0,
                          ext: trackerData.ext,
                          stakeStatusIds: trackerData.stakeStatusIds ?? undefined
                        }
                        s.trackersById[tracker.id] = tracker
                        allTrackerIds.push(tracker.id)
                      })
                    }
                  })
                }
              })
            }

            // Load standalone rows
            if (data.standaloneRows) {
              data.standaloneRows.forEach((rowData: any) => {
                const row: Row = {
                  id: String(rowData.id),
                  databaseId: parseDatabaseId(rowData.databaseId ?? rowData.id),
                  x: rowData.x ?? 0,
                  y: rowData.y ?? 0,
                  isFinalized: rowData.isFinalized ?? false,
                  contourPath: rowData.contourPath ?? '',
                  trackerIds: rowData.trackers ? rowData.trackers.map((trackerData: any) => String(trackerData.id)) : []
                }
                s.rows.push(row)

                // Load trackers from this row into trackersById
                if (rowData.trackers) {
                  rowData.trackers.forEach((trackerData: any) => {
                    const tracker: Tracker = {
                      id: String(trackerData.id),
                      databaseId: parseDatabaseId(trackerData.databaseId ?? trackerData.id),
                      type: trackerData.type ?? 'ext',
                      title: trackerData.title ?? 'Tracker',
                      rowY: trackerData.rowY ?? 0,
                      ext: trackerData.ext
                    }
                    s.trackersById[tracker.id] = tracker
                    allTrackerIds.push(tracker.id)
                  })
                }
              })
            }

            // Load loose trackers
            if (data.loose) {
              data.loose.forEach((trackerData: any) => {
                const tracker: Tracker = {
                  id: String(trackerData.id),
                  databaseId: parseDatabaseId(trackerData.databaseId ?? trackerData.id),
                  type: trackerData.type ?? 'ext',
                  title: trackerData.title ?? 'Tracker',
                  x: trackerData.x ?? 0,
                  y: trackerData.y ?? 0,
                  ext: trackerData.ext,
                  stakeStatusIds: trackerData.stakeStatusIds ?? undefined
                }
                
                s.trackersById[tracker.id] = tracker
                s.looseIds.push(tracker.id)
                allTrackerIds.push(tracker.id)
              })
            }

            // Load text elements
            if (data.textElements) {
              data.textElements.forEach((textData: any) => {
                const text: TextElement = {
                  id: String(textData.id),
                  x: textData.x ?? 0,
                  y: textData.y ?? 0,
                  text: textData.text ?? 'Novo texto',
                  fontSize: textData.fontSize ?? 14,
                  color: textData.color ?? '#000000',
                  fontWeight: textData.fontWeight ?? 'normal',
                  fontStyle: textData.fontStyle ?? 'normal',
                  textDecoration: textData.textDecoration ?? 'none',
                  textAlign: textData.textAlign ?? 'left'
                }
                s.textElementsById[text.id] = text
                s.textElementIds.push(text.id)
              })
            }
          }
        })
      } catch (error) {
        console.error('Error loading JSON data:', error)
      }
    },

    loadFromApi: async (projectsId: number, fieldsId: number, authToken?: string | null) => {
      try {
        const data = await apiRequest<any>(API_ROUTES.trackersMap, {
          authToken,
          query: {
            projects_id: projectsId,
            fields_id: fieldsId,
          },
        })
        
        // Verifica se a resposta vem no novo formato com mapa e campo
        let sectionsData = data
        let mapTexts: any = {}
        
        if (data.mapa && Array.isArray(data.mapa)) {
          // Novo formato: { mapa: [...], campo: { map_texts: {...} } }
          sectionsData = data.mapa
          if (data.campo && data.campo.map_texts) {
            mapTexts = data.campo.map_texts
          }
        }
        
        // Carrega as seções usando loadFromJson
        const jsonString = JSON.stringify(sectionsData)
        get().loadFromJson(jsonString)
        
        // Carrega os textos do map_texts se existirem
        if (mapTexts && typeof mapTexts === 'object' && !Array.isArray(mapTexts)) {
          set((s) => {
            // Limpa textos existentes antes de carregar
            s.textElementsById = {}
            s.textElementIds = []
            
            // Converte map_texts (objeto) em array de textos
            const textKeys = Object.keys(mapTexts)
            if (textKeys.length > 0) {
              textKeys.forEach((key) => {
                const textData = mapTexts[key]
                if (textData && typeof textData === 'object') {
                  const text: TextElement = {
                    id: String(textData.id || key),
                    x: textData.x ?? 0,
                    y: textData.y ?? 0,
                    text: textData.text ?? 'Novo texto',
                    fontSize: textData.fontSize ?? 14,
                    color: textData.color ?? '#000000',
                    fontWeight: textData.fontWeight ?? 'normal',
                    fontStyle: textData.fontStyle ?? 'normal',
                    textDecoration: textData.textDecoration ?? 'none',
                    textAlign: textData.textAlign ?? 'left'
                  }
                  s.textElementsById[text.id] = text
                  s.textElementIds.push(text.id)
                }
              })
            }
          })
        }
        
        return { success: true }
      } catch (error) {
        console.error('Erro ao carregar da API:', error)
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Erro desconhecido ao carregar'
        }
      }
    },

    downloadJson: () => {
      const s = get()
      const json = s.serialize()
      
      // Create filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      const filename = `trackers-${timestamp}.json`
      
      // Create and download file
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.style.display = 'none'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    },

    saveToApi: async (projectId?: number | null, fieldId?: number | null, authToken?: string | null, fieldName?: string | null) => {
      try {
        const s = get()
        
        // Validação: é obrigatório ter pelo menos 1 seção (rowGroup) para salvar
        if (s.rowGroups.length === 0) {
          throw new Error('É obrigatório criar pelo menos 1 seção para salvar o mapa')
        }
        
        const serializedData = JSON.parse(s.serialize())
        
        // Remove stakeStatusIds dos trackers (não faz parte do formato da API de criação)
        const cleanGroups = serializedData.groups.map((group: any) => {
          const { databaseId: _groupDbId, ...groupRest } = group
          return {
            ...groupRest,
            rows: group.rows.map((row: any) => {
              const { databaseId: _rowDbId, ...rowRest } = row
              return {
                ...rowRest,
                trackers: row.trackers.map((tracker: any) => {
                  const { stakeStatusIds, databaseId: _trackerDbId, ...trackerWithoutStatus } = tracker
                  return trackerWithoutStatus
                })
              }
            })
          }
        })
        
        // Não salva standaloneRows (rows que não estão em seções)
        const cleanStandaloneRows: any[] = []
        
        // Não salva loose trackers (trackers que não estão em seções)
        const cleanLoose: any[] = []
        
        // Usa projectId da URL ou fallback para 7
        const finalProjectId = projectId || 7
        
        // Converte textElements (array) em map_texts (objeto)
        const mapTexts: Record<string, any> = {}
        if (serializedData.textElements && Array.isArray(serializedData.textElements)) {
          serializedData.textElements.forEach((textElement: any) => {
            mapTexts[textElement.id] = {
              id: textElement.id,
              x: textElement.x,
              y: textElement.y,
              text: textElement.text,
              fontSize: textElement.fontSize,
              color: textElement.color,
              fontWeight: textElement.fontWeight,
              fontStyle: textElement.fontStyle,
              textDecoration: textElement.textDecoration,
              textAlign: textElement.textAlign
            }
          })
        }
        
        // Formata os dados no formato esperado pela API
        const apiPayload: any = {
          json_map: {
            groups: cleanGroups,
            standaloneRows: cleanStandaloneRows,
            loose: cleanLoose,
            textElements: serializedData.textElements,
            settings: serializedData.settings
          },
          map_texts: mapTexts,
          projects_id: finalProjectId
        }
        
        // Adiciona fields_id se fornecido
        // IMPORTANTE: verifica explicitamente !== null e !== undefined para permitir fieldId = 0
        if (fieldId !== null && fieldId !== undefined) {
          apiPayload.fields_id = fieldId
        }
        
        // Adiciona name se fornecido (para criação de novo campo)
        if (fieldName && fieldName.trim()) {
          apiPayload.name = fieldName.trim()
        }
        
        // Determina se é criação (POST) ou edição (PUT)
        // Se fieldId existe e é diferente de 0, é edição
        const isEdit = fieldId !== null && fieldId !== undefined && fieldId !== 0
        const method = isEdit ? 'PUT' : 'POST'
        
        // Para POST (criação): se não tiver name mas tiver fieldName, adiciona
        // Para garantir que o name sempre seja enviado na criação
        if (!isEdit && !apiPayload.name && fieldName && fieldName.trim()) {
          apiPayload.name = fieldName.trim()
        }
        
        const responseData = await apiRequest<any>(API_ROUTES.trackersMap, {
          method,
          authToken,
          body: apiPayload,
        })
        const createdFieldId = responseData?.fields_id || responseData?.id || null
        
        return { success: true, fieldId: createdFieldId }
      } catch (error) {
        console.error('Erro ao salvar na API:', error)
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Erro desconhecido ao salvar'
        }
      }
    },

    exportToDatabaseFormat: () => {
      const s = get()
      
      const groupById = new Map<string, RowGroup>()
      s.rowGroups.forEach((group) => {
        groupById.set(group.id, group)
      })

      // Agrupa rows por groupId (sections_id)
      const rowsBySection = new Map<string, Row[]>()
      
      s.rows.forEach((row) => {
        const sectionId = row.groupId || 'standalone'
        if (!rowsBySection.has(sectionId)) {
          rowsBySection.set(sectionId, [])
        }
        rowsBySection.get(sectionId)!.push(row)
      })
      
      // Converte para o formato do banco
      const result: any[] = []
      
      rowsBySection.forEach((rowsInSection, sectionId) => {
        // Para cada row na seção
        rowsInSection.forEach((row, rowIndex) => {
          const rowDbId = row.databaseId ?? parseDatabaseId(row.id)
          const sectionDbId = sectionId === 'standalone' ? null : (groupById.get(row.groupId || '')?.databaseId ?? parseDatabaseId(sectionId))

          const rowData: any = {
            id: rowDbId,
            row_number: rowIndex + 1,
            sections_id: sectionDbId,
            list_rows_trackers: row.trackerIds.map((trackerId, trackerIndex) => {
              const tracker = s.trackersById[trackerId]
              if (!tracker) return null
              const trackerDbId = tracker.databaseId ?? parseDatabaseId(tracker.id)
              
              // Cria list_trackers_stakes baseado no stakeStatusIds
              const list_trackers_stakes: any[] = []
              if (tracker.ext && tracker.stakeStatusIds) {
                // Precisamos mapear cada status_id para uma estaca
                // Como não temos os IDs das estacas individuais, vamos criar uma estrutura
                // que pode ser usada para atualizar o banco
                tracker.stakeStatusIds.forEach((statusId, stakeIndex) => {
                  // A posição da estaca seria A, B, C, etc.
                  const position = String.fromCharCode(65 + stakeIndex) // A=65, B=66, etc.
                  
                  list_trackers_stakes.push({
                    // id: seria o ID do banco se já existir, ou null para criar novo
                    rows_trackers_id: trackerDbId,
                    stakes_id: (tracker.ext?.id || 0) * 100 + stakeIndex, // ID temporário baseado no tracker e posição
                    stakes_statuses_id: statusId ?? 1, // Default para 1 (Não cravada) se null
                    position: position
                  })
                })
              }
              
              return {
                id: trackerDbId,
                position: String(trackerIndex + 1),
                rows_id: rowDbId,
                trackers_id: tracker.ext?.id || null,
                rows_trackers_statuses_id: 1, // Default status
                rowY: tracker.rowY ?? 0,
                list_trackers_stakes: list_trackers_stakes
              }
            }).filter(Boolean)
          }
          
          result.push(rowData)
        })
      })
      
      return JSON.stringify(result, null, 2)
    },

    // History: undo/redo via snapshot serialization
    undo: () => {
      const past = get().historyPast
      if (!past.length) return
      const current = get().serialize()
      const prev = past[past.length - 1]
      set((s) => {
        s.historyPast = s.historyPast.slice(0, -1)
        s.historyFuture.push(current)
      })
      get().loadFromJson(prev)
    },
    redo: () => {
      const future = get().historyFuture
      if (!future.length) return
      const current = get().serialize()
      const next = future[future.length - 1]
      set((s) => {
        s.historyFuture = s.historyFuture.slice(0, -1)
        s.historyPast.push(current)
      })
      get().loadFromJson(next)
    },

    setRowGroupOffsetX: (rowId, offsetX) => {
      set((s) => {
        const row = s.rows.find((r) => r.id === rowId)
        if (!row) return

        row.groupOffsetX = Math.round(offsetX)
      })
    },

    resetGroupRowOffsets: (groupId) => {
      const snap = get().serialize()
      set((s) => { s.historyPast.push(snap); s.historyFuture = [] })
      set((s) => {
        const group = s.rowGroups.find(g => g.id === groupId)
        if (!group) return

        // Reset all row offsets in the group to 0
        for (const rowId of group.rowIds) {
          const row = s.rows.find(r => r.id === rowId)
          if (row) {
            row.groupOffsetX = 0
          }
        }
      })
    },

    // Text element actions
    addTextElement: (x, y) => {
      const snap = get().serialize()
      set((s) => { s.historyPast.push(snap); s.historyFuture = [] })
      const id = nextId('text')
      set((s) => {
        s.textElementsById[id] = {
          id,
          x: snapToGrid(x, GRID),
          y: snapToGrid(y, GRID),
          text: 'Novo texto',
          fontSize: 14,
          color: '#000000',
          fontWeight: 'normal',
          fontStyle: 'normal',
          textDecoration: 'none',
          textAlign: 'left'
        }
        s.textElementIds.push(id)
      })
      return id
    },

    updateTextElement: (id, updates, saveHistory = false) => {
      if (saveHistory) {
        const snap = get().serialize()
        set((s) => { s.historyPast.push(snap); s.historyFuture = [] })
      }
      set((s) => {
        const text = s.textElementsById[id]
        if (!text) return
        Object.assign(text, updates)
      })
    },

    removeTextElement: (id) => {
      const snap = get().serialize()
      set((s) => { s.historyPast.push(snap); s.historyFuture = [] })
      set((s) => {
        s.textElementIds = s.textElementIds.filter((tid) => tid !== id)
        delete s.textElementsById[id]
        s.selectedIds = s.selectedIds.filter((tid) => tid !== id)
        if (s.draggingTextId === id) {
          s.draggingTextId = undefined
          s.dragTextStart = undefined
        }
      })
    },

    moveTextElementByDelta: (id, dx, dy) => {
      set((s) => {
        const text = s.textElementsById[id]
        if (!text) return
        const start = s.dragTextStart ?? { x: text.x, y: text.y }
        text.x = snapToGrid(start.x + dx, GRID)
        text.y = snapToGrid(start.y + dy, GRID)
      })
    },

    beginDragText: (id) => {
      const text = get().textElementsById[id]
      set({ draggingTextId: id, dragTextStart: { x: text?.x ?? 0, y: text?.y ?? 0 } })
    },

    endDragText: () => set({ draggingTextId: undefined, dragTextStart: undefined }),
  }))
)
