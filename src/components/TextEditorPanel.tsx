import { AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useLayoutStore } from '../store/layoutStore'

export function TextEditorPanel() {
  const selectedIds = useLayoutStore((s) => s.selectedIds)
  const textElementsById = useLayoutStore((s) => s.textElementsById)
  const textElementIds = useLayoutStore((s) => s.textElementIds)
  const updateTextElement = useLayoutStore((s) => s.updateTextElement)

  // Find first selected text element
  const selectedTextId = selectedIds.find((id) => textElementIds.includes(id))
  const textElement = selectedTextId ? textElementsById[selectedTextId] : null

  // Estado local para o tamanho da fonte (permite apagar e escrever)
  const [fontSizeInput, setFontSizeInput] = useState<string>('')

  // Atualizar o estado local quando o elemento de texto mudar
  useEffect(() => {
    if (textElement) {
      setFontSizeInput(textElement.fontSize.toString())
    }
  }, [textElement?.id, textElement?.fontSize])

  if (!textElement) return null

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <h4 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">
        Editar Texto
      </h4>
      
      <div className="space-y-3">
        {/* Text Content */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Conteúdo
          </label>
          <textarea
            value={textElement.text}
            onChange={(e) => updateTextElement(textElement.id, { text: e.target.value })}
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={3}
            placeholder="Digite o texto..."
          />
        </div>

        {/* Font Size */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Tamanho da Fonte: {textElement.fontSize}px
          </label>
          <input
            type="number"
            min="8"
            max="72"
            value={fontSizeInput}
            onChange={(e) => {
              // Permite apagar e escrever livremente
              setFontSizeInput(e.target.value)
            }}
            onBlur={(e) => {
              // Quando perder o foco, atualiza o valor no store
              const value = parseInt(e.target.value)
              if (!isNaN(value) && value >= 8 && value <= 72) {
                updateTextElement(textElement.id, { fontSize: value })
              } else {
                // Se o valor for inválido, restaura o valor anterior
                setFontSizeInput(textElement.fontSize.toString())
              }
            }}
            onKeyDown={(e) => {
              // Atualiza quando pressionar Enter
              if (e.key === 'Enter') {
                e.currentTarget.blur()
              }
            }}
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Color */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Cor
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={textElement.color}
              onChange={(e) => updateTextElement(textElement.id, { color: e.target.value })}
              className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              value={textElement.color}
              onChange={(e) => updateTextElement(textElement.id, { color: e.target.value })}
              className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
              placeholder="#000000"
            />
          </div>
        </div>

        {/* Style Toggles */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Estilo
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => updateTextElement(textElement.id, { 
                fontWeight: textElement.fontWeight === 'bold' ? 'normal' : 'bold' 
              })}
              className={`flex-1 h-10 rounded-[12px] px-3 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                textElement.fontWeight === 'bold'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title="Negrito"
            >
              <Bold size={14} />
              <span>Negrito</span>
            </button>
            <button
              onClick={() => updateTextElement(textElement.id, { 
                fontStyle: textElement.fontStyle === 'italic' ? 'normal' : 'italic' 
              })}
              className={`flex-1 h-10 rounded-[12px] px-3 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                textElement.fontStyle === 'italic'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title="Itálico"
            >
              <Italic size={14} />
              <span>Itálico</span>
            </button>
            <button
              onClick={() => updateTextElement(textElement.id, { 
                textDecoration: textElement.textDecoration === 'underline' ? 'none' : 'underline' 
              })}
              className={`flex-1 h-10 rounded-[12px] px-3 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                textElement.textDecoration === 'underline'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title="Sublinhado"
            >
              <Underline size={14} />
              <span>Sublinhado</span>
            </button>
          </div>
        </div>

        {/* Text Align */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Alinhamento
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => updateTextElement(textElement.id, { textAlign: 'left' })}
              className={`flex-1 h-10 rounded-[12px] px-2 text-xs font-medium flex items-center justify-center transition-colors ${
                textElement.textAlign === 'left'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title="Alinhar à esquerda"
            >
              <AlignLeft size={14} />
            </button>
            <button
              onClick={() => updateTextElement(textElement.id, { textAlign: 'center' })}
              className={`flex-1 h-10 rounded-[12px] px-2 text-xs font-medium flex items-center justify-center transition-colors ${
                textElement.textAlign === 'center'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title="Centralizar"
            >
              <AlignCenter size={14} />
            </button>
            <button
              onClick={() => updateTextElement(textElement.id, { textAlign: 'right' })}
              className={`flex-1 h-10 rounded-[12px] px-2 text-xs font-medium flex items-center justify-center transition-colors ${
                textElement.textAlign === 'right'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title="Alinhar à direita"
            >
              <AlignRight size={14} />
            </button>
          </div>
        </div>

        {/* Preview */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Preview
          </label>
          <div 
            className="rounded border border-gray-300 bg-white p-2 min-h-[60px]"
            style={{
              fontSize: `${textElement.fontSize}px`,
              color: textElement.color,
              fontWeight: textElement.fontWeight,
              fontStyle: textElement.fontStyle,
              textDecoration: textElement.textDecoration,
              textAlign: textElement.textAlign
            }}
          >
            {textElement.text || 'Novo texto'}
          </div>
        </div>
      </div>
    </div>
  )
}

