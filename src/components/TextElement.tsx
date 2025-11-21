import { useDraggable } from '@dnd-kit/core'
import { useState, useRef, useEffect } from 'react'
import type { TextElement as TextElementModel } from '../store/layoutStore'
import { useLayoutStore } from '../store/layoutStore'

type Props = {
  textElement: TextElementModel
  selected?: boolean
  viewMode?: boolean
}

export function TextElement({ textElement, selected, viewMode = false }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(textElement.text)
  const editRef = useRef<HTMLDivElement>(null)
  const updateTextElement = useLayoutStore((s) => s.updateTextElement)
  const removeTextElement = useLayoutStore((s) => s.removeTextElement)

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: textElement.id,
    data: { from: 'text', id: textElement.id },
    disabled: isEditing || viewMode
  })

  // Initialize content and focus when entering edit mode
  useEffect(() => {
    if (isEditing && editRef.current) {
      // Set initial content only if it's different
      if (editRef.current.textContent !== editText) {
        editRef.current.textContent = editText
      }
      editRef.current.focus()
      // Move cursor to end of text
      const range = document.createRange()
      const selection = window.getSelection()
      if (editRef.current.firstChild) {
        range.selectNodeContents(editRef.current)
        range.collapse(false) // Collapse to end
        selection?.removeAllRanges()
        selection?.addRange(range)
      }
    }
  }, [isEditing, editText])

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (viewMode) return
    e.preventDefault()
    e.stopPropagation()
    setIsEditing(true)
    setEditText(textElement.text)
  }

  const handleBlur = () => {
    if (isEditing) {
      updateTextElement(textElement.id, { text: editText }, true)
      setIsEditing(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      updateTextElement(textElement.id, { text: editText }, true)
      setIsEditing(false)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setEditText(textElement.text)
      setIsEditing(false)
    }
  }

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    // Update state but don't interfere with cursor position
    // The browser handles cursor position naturally with contentEditable
    const newText = e.currentTarget.textContent || ''
    setEditText(newText)
  }

  const textStyle: React.CSSProperties = {
    fontSize: `${textElement.fontSize}px`,
    color: textElement.color,
    fontWeight: textElement.fontWeight,
    fontStyle: textElement.fontStyle,
    textDecoration: textElement.textDecoration,
    textAlign: textElement.textAlign,
    minWidth: '50px',
    minHeight: '20px',
    outline: 'none',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    // Contorno nas letras usando text-shadow
    textShadow: `
      -1px -1px 0 #fff,
      1px -1px 0 #fff,
      -1px 1px 0 #fff,
      1px 1px 0 #fff,
      -1px 0 0 #fff,
      1px 0 0 #fff,
      0 -1px 0 #fff,
      0 1px 0 #fff
    `
  }

  return (
    <div className="relative">
      <div
        ref={viewMode ? undefined : setNodeRef}
        {...(isEditing || viewMode ? {} : attributes)}
        {...(isEditing || viewMode ? {} : listeners)}
        className={`pointer-events-auto select-none ${
          selected ? 'ring-2 ring-blue-500' : ''
        } ${isDragging ? 'opacity-50' : ''}`}
        onDoubleClick={handleDoubleClick}
        data-selecto-uid={textElement.id}
      >
        {isEditing ? (
          <div
            ref={editRef}
            contentEditable
            suppressContentEditableWarning
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            style={textStyle}
            className="outline-none"
          />
        ) : (
          <div style={textStyle}>
            {textElement.text || 'Novo texto'}
          </div>
        )}
      </div>
      {!viewMode && (
        <button
          className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-red-600 text-[10px] font-bold text-white"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            removeTextElement(textElement.id)
          }}
          aria-label="Remover"
        >
          ×
        </button>
      )}
    </div>
  )
}

