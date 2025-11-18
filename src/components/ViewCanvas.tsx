import { useRef, useCallback, useEffect } from 'react'
import { Row } from './Row'
import { RowGroup } from './RowGroup'
import { Tracker } from './Tracker'
import { TextElement } from './TextElement'
import { useLayoutStore } from '../store/layoutStore'
import { GRID } from '../utils/gridConstants'

export function ViewCanvas() {
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const looseIds = useLayoutStore((s) => s.looseIds)
  const rows = useLayoutStore((s) => s.rows)
  const rowGroups = useLayoutStore((s) => s.rowGroups)
  const trackersById = useLayoutStore((s) => s.trackersById)
  const textElementIds = useLayoutStore((s) => s.textElementIds)
  const textElementsById = useLayoutStore((s) => s.textElementsById)
  const zoom = useLayoutStore((s) => s.zoom)
  const panX = useLayoutStore((s) => s.panX)
  const panY = useLayoutStore((s) => s.panY)
  const setZoom = useLayoutStore((s) => s.setZoom)
  const setPan = useLayoutStore((s) => s.setPan)
  const resetZoom = useLayoutStore((s) => s.resetZoom)
  const resetPan = useLayoutStore((s) => s.resetPan)

  // Mouse wheel handler for zoom and pan
  const handleWheel = useCallback((e: WheelEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const isOverCanvas = canvas.contains(e.target as Node)
    if (!isOverCanvas) return
    
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

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  // Double click to reset zoom and pan
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      e.preventDefault()
      resetZoom()
      resetPan()
    }
  }, [resetZoom, resetPan])

  return (
    <div className="relative h-full w-full rounded-lg border bg-white min-h-0">
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
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
          }}
          onDoubleClick={handleDoubleClick}
        >
          {/* Render row groups first */}
          {rowGroups.map((g) => (
            <div 
              key={g.id} 
              className="absolute" 
              style={{ left: g.x ?? 0, top: g.y ?? 0, zIndex: 1 }} 
            >
              <RowGroup key={`group-${g.id}`} groupId={g.id} viewMode={true} />
            </div>
          ))}
          
          {/* Render standalone rows (not in groups) */}
          {rows.filter(r => !r.groupId).map((r) => (
            <div 
              key={r.id} 
              className="absolute" 
              style={{ left: r.x ?? 0, top: r.y ?? 0, zIndex: 10 }} 
            >
              <Row rowId={r.id} viewMode={true} />
            </div>
          ))}
          
          {/* Render loose trackers */}
          {looseIds.map((id) => {
            const t = trackersById[id]
            return (
              <div key={id} className="absolute" style={{ left: t.x ?? 0, top: t.y ?? 0 }}>
                <Tracker tracker={t} selected={false} viewMode={true} />
              </div>
            )
          })}
          
          {/* Render text elements */}
          {textElementIds.map((id) => {
            const text = textElementsById[id]
            return (
              <div key={id} className="absolute" style={{ left: text.x, top: text.y, zIndex: 100 }}>
                <TextElement textElement={text} selected={false} viewMode={true} />
              </div>
            )
          })}
        </div>
      </div>

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
    </div>
  )
}

