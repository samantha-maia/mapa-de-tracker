import React, { useState, useCallback, useEffect } from 'react'

export type ContourRect = {
  left: number
  top: number
  width: number
  height: number
}

type Props = {
  initialRect: ContourRect
  onRectChange: (rect: ContourRect) => void
  onSave: () => void
  onCancel: () => void
  containerBounds: { width: number; height: number }
}

type DragHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | 'move'

export function ContourEditor({ initialRect, onRectChange, onSave, onCancel, containerBounds }: Props) {
  const [rect, setRect] = useState<ContourRect>(initialRect)
  const [isDragging, setIsDragging] = useState<DragHandle | null>(null)
  const [dragStart, setDragStart] = useState<{ x: number; y: number; rect: ContourRect } | null>(null)

  // Atualiza quando initialRect muda
  useEffect(() => {
    setRect(initialRect)
  }, [initialRect])

  const handleMouseDown = useCallback((e: React.MouseEvent, handle: DragHandle) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(handle)
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      rect: { ...rect }
    })
  }, [rect])

  useEffect(() => {
    if (!isDragging || !dragStart) return

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStart.x
      const dy = e.clientY - dragStart.y

      let newRect = { ...dragStart.rect }

      switch (isDragging) {
        case 'move':
          newRect.left = Math.max(0, Math.min(containerBounds.width - newRect.width, dragStart.rect.left + dx))
          newRect.top = Math.max(0, Math.min(containerBounds.height - newRect.height, dragStart.rect.top + dy))
          break
        case 'nw':
          newRect.left = Math.max(0, dragStart.rect.left + dx)
          newRect.top = Math.max(0, dragStart.rect.top + dy)
          newRect.width = dragStart.rect.width - dx
          newRect.height = dragStart.rect.height - dy
          break
        case 'ne':
          newRect.top = Math.max(0, dragStart.rect.top + dy)
          newRect.width = dragStart.rect.width + dx
          newRect.height = dragStart.rect.height - dy
          break
        case 'sw':
          newRect.left = Math.max(0, dragStart.rect.left + dx)
          newRect.width = dragStart.rect.width - dx
          newRect.height = dragStart.rect.height + dy
          break
        case 'se':
          newRect.width = dragStart.rect.width + dx
          newRect.height = dragStart.rect.height + dy
          break
        case 'n':
          newRect.top = Math.max(0, dragStart.rect.top + dy)
          newRect.height = dragStart.rect.height - dy
          break
        case 's':
          newRect.height = dragStart.rect.height + dy
          break
        case 'e':
          newRect.width = dragStart.rect.width + dx
          break
        case 'w':
          newRect.left = Math.max(0, dragStart.rect.left + dx)
          newRect.width = dragStart.rect.width - dx
          break
      }

      // Garante tamanho mínimo
      if (newRect.width < 50) {
        if (isDragging === 'nw' || isDragging === 'w' || isDragging === 'sw') {
          newRect.left = dragStart.rect.left + dragStart.rect.width - 50
        }
        newRect.width = 50
      }
      if (newRect.height < 50) {
        if (isDragging === 'nw' || isDragging === 'n' || isDragging === 'ne') {
          newRect.top = dragStart.rect.top + dragStart.rect.height - 50
        }
        newRect.height = 50
      }

      // Garante que não sai dos limites
      newRect.left = Math.max(0, Math.min(containerBounds.width - newRect.width, newRect.left))
      newRect.top = Math.max(0, Math.min(containerBounds.height - newRect.height, newRect.top))
      newRect.width = Math.min(containerBounds.width - newRect.left, newRect.width)
      newRect.height = Math.min(containerBounds.height - newRect.top, newRect.height)

      setRect(newRect)
      onRectChange(newRect)
    }

    const handleMouseUp = () => {
      setIsDragging(null)
      setDragStart(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragStart, containerBounds, onRectChange])

  const handleStyle: React.CSSProperties = {
    position: 'absolute',
    width: 12,
    height: 12,
    backgroundColor: '#3b82f6',
    border: '2px solid white',
    borderRadius: '50%',
    cursor: 'pointer',
    zIndex: 1000
  }

  const edgeHandleStyle: React.CSSProperties = {
    position: 'absolute',
    backgroundColor: '#3b82f6',
    border: '1px solid white',
    zIndex: 999
  }

  return (
    <>
      {/* Overlay escuro */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-[999]"
        onClick={onCancel}
      />
      
      {/* Container do editor */}
      <div className="fixed inset-0 z-[1000] pointer-events-none flex items-center justify-center">
        <div className="relative bg-white rounded-lg shadow-2xl p-4 pointer-events-auto max-w-4xl w-full mx-4">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-lg font-semibold">Editar Contorno</h3>
            <div className="flex gap-2">
              <button
                onClick={onSave}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Salvar
              </button>
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>

          {/* Área de preview */}
          <div
            className="relative border-2 border-gray-300 bg-gray-50"
            style={{
              width: containerBounds.width,
              height: containerBounds.height,
              minHeight: '400px'
            }}
          >
            {/* Retângulo editável */}
            <div
              className="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-20"
              style={{
                left: `${rect.left}px`,
                top: `${rect.top}px`,
                width: `${rect.width}px`,
                height: `${rect.height}px`,
                cursor: isDragging === 'move' ? 'grabbing' : 'grab'
              }}
              onMouseDown={(e) => handleMouseDown(e, 'move')}
            >
              {/* Handles dos cantos */}
              <div
                style={{ ...handleStyle, left: -6, top: -6, cursor: 'nw-resize' }}
                onMouseDown={(e) => handleMouseDown(e, 'nw')}
              />
              <div
                style={{ ...handleStyle, right: -6, top: -6, cursor: 'ne-resize' }}
                onMouseDown={(e) => handleMouseDown(e, 'ne')}
              />
              <div
                style={{ ...handleStyle, left: -6, bottom: -6, cursor: 'sw-resize' }}
                onMouseDown={(e) => handleMouseDown(e, 'sw')}
              />
              <div
                style={{ ...handleStyle, right: -6, bottom: -6, cursor: 'se-resize' }}
                onMouseDown={(e) => handleMouseDown(e, 'se')}
              />

              {/* Handles das bordas */}
              <div
                style={{ ...edgeHandleStyle, left: '50%', top: -6, width: 30, height: 6, marginLeft: -15, cursor: 'n-resize' }}
                onMouseDown={(e) => handleMouseDown(e, 'n')}
              />
              <div
                style={{ ...edgeHandleStyle, left: '50%', bottom: -6, width: 30, height: 6, marginLeft: -15, cursor: 's-resize' }}
                onMouseDown={(e) => handleMouseDown(e, 's')}
              />
              <div
                style={{ ...edgeHandleStyle, left: -6, top: '50%', width: 6, height: 30, marginTop: -15, cursor: 'w-resize' }}
                onMouseDown={(e) => handleMouseDown(e, 'w')}
              />
              <div
                style={{ ...edgeHandleStyle, right: -6, top: '50%', width: 6, height: 30, marginTop: -15, cursor: 'e-resize' }}
                onMouseDown={(e) => handleMouseDown(e, 'e')}
              />
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <p>• Arraste o retângulo para mover</p>
            <p>• Arraste os cantos ou bordas para redimensionar</p>
            <p>• O contorno seguirá os limites deste retângulo</p>
          </div>
        </div>
      </div>
    </>
  )
}
