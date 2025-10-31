import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

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
}

export type Row = {
  id: string
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
  rowIds: string[]
  x?: number
  y?: number
  isFinalized?: boolean
  contourPath?: string
  name?: string
}

export type SectionState = {
  trackersById: Record<string, Tracker>
  looseIds: string[]
  rows: Row[]
  rowGroups: RowGroup[]
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
  moveRowByDelta: (rowId: string, dx: number, dy: number, snap: number) => void
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
  downloadJson: () => void
  // history
  undo: () => void
  redo: () => void
  // group row offset
  setRowGroupOffsetX: (rowId: string, offsetX: number) => void
}

let idCounter = 0
const nextId = (prefix: string) => `${prefix}_${++idCounter}`

const snapToGrid = (value: number, grid: number) => Math.round(value / grid) * grid

export const useLayoutStore = create<SectionState & LayoutActions>()(
  immer((set, get) => ({
    trackersById: {},
    looseIds: [],
    rows: [],
    rowGroups: [],
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
        s.rows.push({ id, trackerIds: [], x: 40, y: 40 })
      })
      return id
    },

    addLooseTracker: (type, x, y) => {
      const snap = get().serialize()
      set((s) => { s.historyPast.push(snap); s.historyFuture = [] })
      const id = nextId('t')
      const title = 'Tracker'
      set((s) => {
        s.trackersById[id] = { id, type, title, x, y }
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
          s.trackersById[id] = { id, type: typeOrId, title }
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

    moveRowByDelta: (rowId, dx, dy, snap) => {
      set((s) => {
        const row = s.rows.find((r) => r.id === rowId)
        if (!row) return
        const start = s.dragRowStart ?? { x: row.x ?? 0, y: row.y ?? 0 }
        row.x = snapToGrid(start.x + dx, snap)
        row.y = snapToGrid(start.y + dy, snap)
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
      if (looseSelected.length === 0) return undefined
      const trackers = looseSelected.map((id) => state.trackersById[id]).filter(Boolean) as Tracker[]
      const minX = Math.min(...trackers.map((t) => t.x ?? 0))
      const minY = Math.min(...trackers.map((t) => t.y ?? 0))

      // Order by x for horizontal arrangement
      const ordered = [...trackers].sort((a, b) => (a.x ?? 0) - (b.x ?? 0))
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
        s.rows.push({ id: newRowId, trackerIds: ordered.map((t) => t.id), x: snapToGrid(minX, 10), y: snapToGrid(minY, 10) })
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
        
        s.rowGroups.push({ 
          id, 
          rowIds: [], 
          x: groupX, 
          y: groupY, 
          name: `Grupo ${s.rowGroups.length + 1}`,
          isFinalized: false,
          contourPath: ''
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

        // Compute left normalization to preserve relative horizontal positions
        const minX = Math.min(...rowsInOrder.map(r => r.x ?? 0))

        s.rowGroups.push({ 
          id: newGroupId, 
          rowIds: rowsInOrder.map((r) => r.id), 
          x: 40, 
          y: 40, 
          name: `Grupo ${s.rowGroups.length + 1}`,
          isFinalized: false,
          contourPath: ''
        })
        
        // Update rows to reference the group
        for (const rowId of rowsInOrder.map((r) => r.id)) {
          const row = s.rows.find((r) => r.id === rowId)
          if (row) {
            row.groupId = newGroupId
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
                const newTracker: Tracker = {
                  id: newTrackerId,
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
            
            const newGroup: RowGroup = {
              id: newGroupId,
              rowIds: newRowIds,
              x: (group.x ?? 0) + offset,
              y: (group.y ?? 0) + offset,
              isFinalized: false,
              contourPath: '',
              name: `${group.name || `Grupo ${groupId}`} (cópia)`
            }
            s.rowGroups.push(newGroup)
            newIds.push(newGroupId)
          }
        }

        // Select the newly created items
        s.selectedIds = newIds
      })
    },

    serialize: () => {
      const s = get()

      // Build nested structure: groups -> rows -> trackers
      const groups = s.rowGroups.map((g) => {
        const rowsInGroup = g.rowIds
          .map((rowId) => s.rows.find((r) => r.id === rowId))
          .filter(Boolean) as Row[]

        const rows = rowsInGroup.map((r) => ({
          id: r.id,
          x: r.x ?? 0,
          y: r.y ?? 0,
          groupOffsetX: r.groupOffsetX ?? 0,
          isFinalized: r.isFinalized ?? false,
          contourPath: r.contourPath ?? '',
          trackers: r.trackerIds.map((tid) => {
            const t = s.trackersById[tid]
            return {
              id: t.id,
              type: t.type,
              title: t.title,
              rowY: t.rowY ?? 0,
              ext: t.ext
            }
          })
        }))

        return {
          id: g.id,
          name: g.name,
          x: g.x ?? 0,
          y: g.y ?? 0,
          isFinalized: g.isFinalized ?? false,
          contourPath: g.contourPath ?? '',
          rows
        }
      })

      // Standalone rows (not in any group)
      const standaloneRows = s.rows
        .filter((r) => !r.groupId)
        .map((r) => ({
          id: r.id,
          x: r.x ?? 0,
          y: r.y ?? 0,
          isFinalized: r.isFinalized ?? false,
          contourPath: r.contourPath ?? '',
          trackers: r.trackerIds.map((tid) => {
            const t = s.trackersById[tid]
            return {
              id: t.id,
              type: t.type,
              title: t.title,
              rowY: t.rowY ?? 0,
              ext: t.ext
            }
          })
        }))

      const loose = s.looseIds.map((id) => {
        const t = s.trackersById[id]
        return { id: t.id, type: t.type, title: t.title, x: t.x ?? 0, y: t.y ?? 0, ext: t.ext }
      })

      const json = {
        groups,
        standaloneRows,
        loose,
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
        const selected = s.selectedIds.filter((id) => s.looseIds.includes(id))
        if (selected.length < 2) return

        const trackers = selected.map((id) => s.trackersById[id]).filter(Boolean) as Tracker[]
        if (trackers.length < 2) return

        const positions = trackers.map((t) => ({ x: t.x ?? 0, y: t.y ?? 0, width: 103, height: 80 }))

        if (type === 'left') {
          const minX = Math.min(...positions.map((p) => p.x))
          trackers.forEach((t) => {
            if (t.x !== undefined) t.x = minX
          })
        } else if (type === 'right') {
          const maxX = Math.max(...positions.map((p) => p.x + p.width))
          trackers.forEach((t) => {
            if (t.x !== undefined) t.x = maxX - 103
          })
        } else if (type === 'center') {
          const minX = Math.min(...positions.map((p) => p.x))
          const maxX = Math.max(...positions.map((p) => p.x + p.width))
          const centerX = (minX + maxX) / 2
          trackers.forEach((t) => {
            if (t.x !== undefined) t.x = centerX - 51.5
          })
        } else if (type === 'top') {
          const minY = Math.min(...positions.map((p) => p.y))
          trackers.forEach((t) => {
            if (t.y !== undefined) t.y = minY
          })
        } else if (type === 'bottom') {
          const maxY = Math.max(...positions.map((p) => p.y + p.height))
          trackers.forEach((t) => {
            if (t.y !== undefined) t.y = maxY - 80
          })
        } else if (type === 'middle') {
          const minY = Math.min(...positions.map((p) => p.y))
          const maxY = Math.max(...positions.map((p) => p.y + p.height))
          const centerY = (minY + maxY) / 2
          trackers.forEach((t) => {
            if (t.y !== undefined) t.y = centerY - 40
          })
        }

        // Snap to grid
        trackers.forEach((t) => {
          if (t.x !== undefined) t.x = snapToGrid(t.x, 10)
          if (t.y !== undefined) t.y = snapToGrid(t.y, 10)
        })
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
        const data = JSON.parse(jsonData)
        
        set((s) => {
          // Clear existing data
          s.trackersById = {}
          s.looseIds = []
          s.rows = []
          s.rowGroups = []
          s.selectedIds = []
          
          // Load trackers
          const allTrackerIds: string[] = []
          
          // Load groups and their rows/trackers
          if (data.groups) {
            data.groups.forEach((groupData: any) => {
              const group: RowGroup = {
                id: groupData.id,
                x: groupData.x,
                y: groupData.y,
                isFinalized: groupData.isFinalized,
                contourPath: groupData.contourPath,
                name: groupData.name,
                rowIds: groupData.rows.map((rowData: any) => rowData.id)
              }
              s.rowGroups.push(group)

              // Load rows for this group
              groupData.rows.forEach((rowData: any) => {
                const row: Row = {
                  id: rowData.id,
                  x: rowData.x,
                  y: rowData.y,
                  isFinalized: rowData.isFinalized,
                  contourPath: rowData.contourPath,
                  groupId: groupData.id,
                  groupOffsetX: rowData.groupOffsetX,
                  trackerIds: rowData.trackers.map((trackerData: any) => trackerData.id)
                }
                s.rows.push(row)

                // Load trackers from this row into trackersById
                if (rowData.trackers) {
                  rowData.trackers.forEach((trackerData: any) => {
                    const tracker: Tracker = {
                      id: trackerData.id,
                      type: trackerData.type,
                      title: trackerData.title,
                      rowY: trackerData.rowY ?? 0,
                      ext: trackerData.ext
                    }
                    s.trackersById[tracker.id] = tracker
                    allTrackerIds.push(tracker.id)
                  })
                }
              })
            })
          }

          // Load standalone rows
          if (data.standaloneRows) {
            data.standaloneRows.forEach((rowData: any) => {
              const row: Row = {
                id: rowData.id,
                x: rowData.x,
                y: rowData.y,
                isFinalized: rowData.isFinalized,
                contourPath: rowData.contourPath,
                trackerIds: rowData.trackers.map((trackerData: any) => trackerData.id)
              }
              s.rows.push(row)

              // Load trackers from this row into trackersById
              if (rowData.trackers) {
                rowData.trackers.forEach((trackerData: any) => {
                  const tracker: Tracker = {
                    id: trackerData.id,
                    type: trackerData.type,
                    title: trackerData.title,
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
                id: trackerData.id,
                type: trackerData.type,
                title: trackerData.title,
                x: trackerData.x,
                y: trackerData.y,
                ext: trackerData.ext
              }
              
              s.trackersById[tracker.id] = tracker
              s.looseIds.push(tracker.id)
              allTrackerIds.push(tracker.id)
            })
          }
        })
      } catch (error) {
        console.error('Error loading JSON data:', error)
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
        const row = s.rows.find(r => r.id === rowId)
        if (row) row.groupOffsetX = Math.round(offsetX)
      })
    },
  }))
)


