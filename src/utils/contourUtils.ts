/**
 * Utilitários para cálculo de contornos SVG de grupos de rows
 */

export type RowBox = { left: number; right: number; top: number; bottom: number }
export type TrackerBox = { left: number; right: number; top: number; bottom: number; trackerId: string }

const GEOM = {
  MARGIN: 6, // Margem ao redor dos trackers no contorno (mais enxuto para evitar espaços exagerados)
}

const align = (v: number) => Math.round(v) + 0.5

/**
 * Calcula as boxes das rows a partir do DOM real
 * @param rootElement Elemento raiz do grupo que contém as rows
 * @returns Array de boxes calculadas
 */
export function calculateRowBoxesFromDOM(rootElement: HTMLElement | null): RowBox[] {
  if (!rootElement) return []

  const base = rootElement.getBoundingClientRect()
  const rowEls = Array.from(rootElement.querySelectorAll('[data-row-id]')) as HTMLElement[]
  
  if (rowEls.length === 0) return []

  // Ordena rows por posição vertical
  const ordered = rowEls
    .map(el => ({ el, top: el.getBoundingClientRect().top }))
    .sort((a, b) => a.top - b.top)
    .map(x => x.el)

  const boxes: RowBox[] = []

  for (let idx = 0; idx < ordered.length; idx++) {
    const rEl = ordered[idx]
    const isFirstRow = idx === 0
    const isLastRow = idx === ordered.length - 1
    
    const trackerEls = Array.from(rEl.querySelectorAll('[data-tracker-id]')) as HTMLElement[]
    
    if (trackerEls.length === 0) {
      // Row vazia - cria uma box mínima
      const rowRect = rEl.getBoundingClientRect()
      boxes.push({
        left: align(rowRect.left - base.left),
        right: align(rowRect.right - base.left + GEOM.MARGIN),
        top: align(isFirstRow ? rowRect.top - base.top - 12 : rowRect.top - base.top), // Margem extra só no topo da primeira
        bottom: align(isLastRow ? rowRect.bottom - base.top + GEOM.MARGIN : rowRect.bottom - base.top) // Margem extra só no bottom da última
      })
      continue
    }

    let left = Infinity
    let right = -Infinity
    let top = Infinity
    let bottom = -Infinity

    for (const tEl of trackerEls) {
      const r = tEl.getBoundingClientRect()
      left = Math.min(left, r.left - base.left)
      right = Math.max(right, r.right - base.left)
      top = Math.min(top, r.top - base.top)
      bottom = Math.max(bottom, r.bottom - base.top)
    }

    boxes.push({
      left: align(left - GEOM.MARGIN),
      right: align(right + GEOM.MARGIN + 8), // +8 cobre o botão de remover e um respiro mínimo
      top: align(isFirstRow ? top - 12 : top), // Margem extra no topo apenas para a primeira row
      bottom: align(isLastRow ? bottom + GEOM.MARGIN : bottom) // Margem extra no bottom apenas para a última row
    })
  }

  return boxes
}

/**
 * Gera o path SVG do contorno baseado nas boxes das rows
 * Cria um contorno em formato de escada (degraus) nas laterais direita e esquerda
 * @param rowBoxes Array de boxes das rows
 * @returns String com o path SVG (d attribute)
 */
export function generateContourPath(rowBoxes: RowBox[]): string {
  if (!rowBoxes.length) return ''

  // Inicie no topo-esquerda da 1ª row e desça primeiro (evita traço horizontal no topo)
  let d = `M ${align(rowBoxes[0].left)} ${align(rowBoxes[0].top)} `
  d += `V ${align(rowBoxes[0].bottom)} `
  // direita da primeira
  d += `H ${align(rowBoxes[0].right)} `
  // "escada" pela direita (row → row)
  for (let i = 1; i < rowBoxes.length; i++) {
    d += `V ${align(rowBoxes[i].top)} `
    d += `H ${align(rowBoxes[i].right)} `
    d += `V ${align(rowBoxes[i].bottom)} `
  }
  // fecha pela ESQUERDA em degraus (de baixo pra cima)
  for (let i = rowBoxes.length - 1; i >= 0; i--) {
    d += `H ${align(rowBoxes[i].left)} `
    d += `V ${align(rowBoxes[i].top)} `
  }
  d += 'Z'
  return d
}

/**
 * Calcula o offset mínimo das boxes (para ajustar o viewBox do SVG se necessário)
 * @param rowBoxes Array de boxes das rows
 * @returns Objeto com offsetX e offsetY
 */
export function calculateBoxesOffset(rowBoxes: RowBox[]): { offsetX: number; offsetY: number } {
  if (!rowBoxes.length) return { offsetX: 0, offsetY: 0 }
  
  const minLeft = Math.min(...rowBoxes.map(b => b.left))
  const minTop = Math.min(...rowBoxes.map(b => b.top))
  
  return {
    offsetX: minLeft < 0 ? Math.abs(minLeft) : 0,
    offsetY: minTop < 0 ? Math.abs(minTop) : 0
  }
}

/**
 * Calcula as dimensões do grupo baseadas nas boxes
 * @param rowBoxes Array de boxes das rows
 * @returns Objeto com width e height
 */
export function calculateGroupDimensions(rowBoxes: RowBox[]): { width: number; height: number; offsetX?: number; offsetY?: number } {
  if (!rowBoxes.length) return { width: 120, height: 120, offsetX: 0, offsetY: 0 }
  
  const maxRight = Math.max(...rowBoxes.map(b => b.right))
  const maxBottom = Math.max(...rowBoxes.map(b => b.bottom))
  const minLeft = Math.min(...rowBoxes.map(b => b.left))
  const minTop = Math.min(...rowBoxes.map(b => b.top))
  
  // Se há valores negativos, precisamos ajustar o offset
  const offsetX = minLeft < 0 ? Math.abs(minLeft) : 0
  const offsetY = minTop < 0 ? Math.abs(minTop) : 0
  
  // Calcular a largura e altura reais necessárias
  // PROBLEMA: Quando minLeft é negativo (row vai para a esquerda), o cálculo maxRight - minLeft
  // aumenta a largura incorretamente porque inclui o espaço negativo à esquerda.
  // SOLUÇÃO: Se minLeft é negativo, a largura deve ser baseada apenas no conteúdo visível
  // dentro do grupo (da origem 0 até maxRight), não no espaço negativo à esquerda.
  // Se minLeft >= 0, calculamos normalmente: maxRight - minLeft
  let width: number
  if (minLeft < 0) {
    // Row(s) foram para a esquerda. A largura deve ser apenas do conteúdo visível (maxRight),
    // não incluindo o espaço negativo à esquerda. O grupo não deve expandir à direita.
    width = Math.ceil(Math.max(0, maxRight))
  } else {
    // Todas as rows estão à direita ou na origem. Cálculo normal.
    width = Math.ceil(maxRight - minLeft)
  }
  const height = Math.ceil(maxBottom - minTop) + offsetY // Altura com offset se necessário
  
  return { 
    width: Math.max(60, width), // largura mínima compatível com 1 tracker + paddings
    height: Math.max(80, height), // altura mínima para manter hit-area
    offsetX,
    offsetY
  }
}

/**
 * Calcula as dimensões do grupo diretamente do DOM
 * Útil quando as boxes ainda não foram calculadas ou precisamos valores atualizados
 * @param rootElement Elemento raiz do grupo
 * @returns Objeto com width e height, ou null se não foi possível calcular
 */
export function calculateGroupDimensionsFromDOM(rootElement: HTMLElement | null): { width: number; height: number } | null {
  if (!rootElement) return null
  
  const rowEls = Array.from(rootElement.querySelectorAll('[data-row-id]')) as HTMLElement[]
  if (rowEls.length === 0) return { width: 400, height: 200 }
  
  // Usa o método mais confiável: offsetLeft/offsetTop para coordenadas relativas ao grupo
  // Isso evita problemas quando o grupo ainda não foi redimensionado
  const baseRect = rootElement.getBoundingClientRect()
  const baseLeft = baseRect.left
  const baseTop = baseRect.top
  
  let minLeft = Infinity
  let maxRight = -Infinity
  let minTop = Infinity
  let maxBottom = -Infinity
  
  console.log('🔍 Calculando dimensões do grupo:')
  console.log('  Base rect:', { left: baseLeft, top: baseTop, width: baseRect.width, height: baseRect.height })
  
  for (const rowEl of rowEls) {
    // Primeiro, considera o container completo da row (para capturar largura total)
    const rowRect = rowEl.getBoundingClientRect()
    const rowLeft = rowRect.left - baseLeft
    const rowRight = rowRect.right - baseLeft
    const rowTop = rowRect.top - baseTop
    const rowBottom = rowRect.bottom - baseTop
    
    console.log(`  Row [${rowEl.getAttribute('data-row-id')}]:`)
    console.log(`    Container: left=${rowLeft.toFixed(1)}, right=${rowRight.toFixed(1)}, width=${rowRect.width.toFixed(1)}`)
    
    minLeft = Math.min(minLeft, rowLeft)
    maxRight = Math.max(maxRight, rowRight)
    minTop = Math.min(minTop, rowTop)
    maxBottom = Math.max(maxBottom, rowBottom)
    
    const trackerEls = Array.from(rowEl.querySelectorAll('[data-tracker-id]')) as HTMLElement[]
    
    if (trackerEls.length === 0) {
      console.log(`    Sem trackers`)
      continue
    }
    
    // Considera os trackers (pode se estender além do container da row)
    // CRÍTICO: Usa coordenadas absolutas da viewport e subtrai a posição base do grupo
    // Isso garante que mesmo que o grupo ainda não tenha sido redimensionado, capturamos tudo
    let trackerMinLeft = Infinity
    let trackerMaxRight = -Infinity
    for (const trackerEl of trackerEls) {
      const rect = trackerEl.getBoundingClientRect()
      const tLeft = rect.left - baseLeft
      const tRight = rect.right - baseLeft
      trackerMinLeft = Math.min(trackerMinLeft, tLeft)
      trackerMaxRight = Math.max(trackerMaxRight, tRight)
      
      minLeft = Math.min(minLeft, tLeft)
      maxRight = Math.max(maxRight, tRight)
      minTop = Math.min(minTop, rect.top - baseTop)
      maxBottom = Math.max(maxBottom, rect.bottom - baseTop)
    }
    
    console.log(`    Trackers: left=${trackerMinLeft.toFixed(1)}, right=${trackerMaxRight.toFixed(1)}, width=${(trackerMaxRight - trackerMinLeft).toFixed(1)}`)
    console.log(`    Trackers se estendem ${trackerMaxRight > rowRight ? 'SIM' : 'NÃO'} além do container da row (${trackerMaxRight.toFixed(1)} > ${rowRight.toFixed(1)})`)
    
    // Também considera os botões de remover que ficam fora dos trackers
    const removeButtons = Array.from(rowEl.querySelectorAll('button')) as HTMLElement[]
    for (const btn of removeButtons) {
      const rect = btn.getBoundingClientRect()
      minLeft = Math.min(minLeft, rect.left - baseLeft)
      maxRight = Math.max(maxRight, rect.right - baseLeft)
      minTop = Math.min(minTop, rect.top - baseTop)
      maxBottom = Math.max(maxBottom, rect.bottom - baseTop)
    }
    
    console.log(`    Final após considerar tudo: minLeft=${minLeft.toFixed(1)}, maxRight=${maxRight.toFixed(1)}`)
  }
  
  if (minLeft === Infinity) return { width: 400, height: 200 }
  
  console.log(`  Resultado final:`)
  console.log(`    minLeft=${minLeft.toFixed(1)}, maxRight=${maxRight.toFixed(1)}`)
  console.log(`    minTop=${minTop.toFixed(1)}, maxBottom=${maxBottom.toFixed(1)}`)
  
  // Adiciona margens de segurança maiores para garantir que nada seja cortado
  // Usa margens maiores para garantir espaço suficiente ao redor de tudo
  const marginX = 32 // 16px de cada lado horizontal
  const marginY = 32 // 16px de cada lado vertical
  const width = Math.ceil(maxRight - minLeft) + marginX
  const height = Math.ceil(maxBottom - minTop) + marginY
  
  const finalWidth = Math.max(400, width)
  const finalHeight = Math.max(200, height)
  
  console.log(`    Largura calculada: ${width}px (${maxRight - minLeft}px conteúdo + ${marginX}px margem)`)
  console.log(`    Altura calculada: ${height}px (${maxBottom - minTop}px conteúdo + ${marginY}px margem)`)
  console.log(`    Largura final retornada: ${finalWidth}px`)
  console.log(`    Altura final retornada: ${finalHeight}px`)
  
  return {
    width: finalWidth,
    height: finalHeight
  }
}

/**
 * Função helper que calcula o contorno completo a partir de um elemento DOM
 * Útil para quando você quer calcular tudo de uma vez (ex: ao finalizar um grupo)
 * @param rootElement Elemento raiz do grupo
 * @returns Objeto com contourPath e dimensions, ou null se não foi possível calcular
 */
export function calculateContourFromDOM(rootElement: HTMLElement | null): {
  contourPath: string
  dimensions: { width: number; height: number }
} | null {
  const rowBoxes = calculateRowBoxesFromDOM(rootElement)
  if (!rowBoxes.length) return null

  const contourPath = generateContourPath(rowBoxes)
  const dimensions = calculateGroupDimensions(rowBoxes)

  return { contourPath, dimensions }
}

/**
 * Calcula as boxes de trackers individuais a partir do DOM real
 * Isso considera cada tracker individualmente, incluindo offsets verticais (rowY)
 * @param rootElement Elemento raiz do grupo que contém as rows
 * @returns Array de boxes de trackers individuais
 */
export function calculateTrackerBoxesFromDOM(rootElement: HTMLElement | null): TrackerBox[] {
  if (!rootElement) return []

  const base = rootElement.getBoundingClientRect()
  const trackerEls = Array.from(rootElement.querySelectorAll('[data-tracker-id]')) as HTMLElement[]
  
  if (trackerEls.length === 0) return []

  const boxes: TrackerBox[] = []

  for (const tEl of trackerEls) {
    const trackerId = tEl.getAttribute('data-tracker-id')
    if (!trackerId) continue

    const rect = tEl.getBoundingClientRect()
    boxes.push({
      left: align(rect.left - base.left - GEOM.MARGIN),
      right: align(rect.right - base.left + GEOM.MARGIN + 12), // +12 para botão de remover
      top: align(rect.top - base.top - GEOM.MARGIN),
      bottom: align(rect.bottom - base.top + GEOM.MARGIN),
      trackerId
    })
  }

  return boxes
}

/**
 * Gera o path SVG do contorno baseado em trackers individuais
 * Cria um contorno em formato de escada que abraça cada tracker individualmente
 * Segue os "indents" criados quando rows têm quantidades diferentes de trackers
 * @param trackerBoxes Array de boxes de trackers individuais
 * @returns String com o path SVG (d attribute)
 */
export function generateContourPathFromTrackers(trackerBoxes: TrackerBox[]): string {
  if (!trackerBoxes.length) return ''

  // Ordena trackers por posição vertical primeiro, depois horizontal
  const sorted = [...trackerBoxes].sort((a, b) => {
    const topDiff = a.top - b.top
    if (Math.abs(topDiff) > 20) return topDiff // Diferentes rows (threshold maior para separar rows reais)
    return a.left - b.left // Mesma row, ordena por left
  })

  // Agrupa trackers por "rows" (mesma altura Y aproximada)
  // Threshold maior (20px) para agrupar apenas trackers que estão realmente na mesma row
  const rows: TrackerBox[][] = []
  let currentRow: TrackerBox[] = []
  let currentTop = sorted[0]?.top ?? 0

  for (const box of sorted) {
    // Se a diferença de altura é significativa (> 20px), cria nova row
    if (Math.abs(box.top - currentTop) > 20) {
      if (currentRow.length > 0) {
        // Ordena a row atual por left antes de adicionar
        currentRow.sort((a, b) => a.left - b.left)
        rows.push(currentRow)
      }
      currentRow = [box]
      currentTop = box.top
    } else {
      currentRow.push(box)
    }
  }
  if (currentRow.length > 0) {
    currentRow.sort((a, b) => a.left - b.left)
    rows.push(currentRow)
  }

  if (rows.length === 0) return ''

  // Ordena rows por top (do topo para baixo)
  rows.sort((a, b) => {
    const aTop = Math.min(...a.map(box => box.top))
    const bTop = Math.min(...b.map(box => box.top))
    return aTop - bTop
  })

  // Gera contorno em formato de escada
  // Começa no topo-esquerda do primeiro tracker da primeira row
  const firstRow = rows[0]
  const firstRowLeft = Math.min(...firstRow.map(b => b.left))
  const firstRowTop = Math.min(...firstRow.map(b => b.top))
  const firstRowBottom = Math.max(...firstRow.map(b => b.bottom))
  const firstRowRight = Math.max(...firstRow.map(b => b.right))

  let d = `M ${align(firstRowLeft)} ${align(firstRowTop)} `
  d += `V ${align(firstRowBottom)} ` // Desce até o bottom da primeira row
  d += `H ${align(firstRowRight)} ` // Vai até a direita da primeira row

  // Para cada row seguinte, cria os degraus na direita
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const rowTop = Math.min(...row.map(b => b.top))
    const rowRight = Math.max(...row.map(b => b.right))
    const rowBottom = Math.max(...row.map(b => b.bottom))
    const prevRowRight = Math.max(...rows[i - 1].map(b => b.right))
    
    // Move verticalmente até o topo da próxima row
    d += `V ${align(rowTop)} `
    
    // Se a próxima row se estende mais à direita, vai até lá
    // Se não, mantém a posição atual (cria degrau para dentro)
    if (rowRight > prevRowRight) {
      d += `H ${align(rowRight)} `
    } else if (rowRight < prevRowRight) {
      // Se a próxima row é menor, mantém a posição e cria degrau para dentro
      // Não precisa mover horizontalmente - já está na posição correta
    }
    
    // Desce até o bottom da row atual
    d += `V ${align(rowBottom)} `
  }

  // Fecha pela esquerda (de baixo pra cima), criando degraus
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i]
    const rowLeft = Math.min(...row.map(b => b.left))
    const rowTop = Math.min(...row.map(b => b.top))
    
    // Move horizontalmente até a esquerda da row atual
    d += `H ${align(rowLeft)} `
    
    // Se não é a primeira row, sobe até o topo
    // Se é a primeira row, já estamos no topo (vai fechar o path)
    if (i > 0) {
      const prevRowBottom = Math.max(...rows[i - 1].map(b => b.bottom))
      
      // Sobe até o bottom da row anterior (ou topo da row atual se sobrepõe)
      d += `V ${align(Math.min(prevRowBottom, rowTop))} `
    }
  }

  d += 'Z'
  return d
}

/**
 * Calcula um retângulo delimitador que abraça todos os trackers
 * Útil para criar um contorno simples retangular editável
 * @param trackerBoxes Array de boxes de trackers individuais
 * @returns Retângulo delimitador { left, top, right, bottom, width, height }
 */
export function calculateBoundingRectFromTrackers(trackerBoxes: TrackerBox[]): {
  left: number
  top: number
  right: number
  bottom: number
  width: number
  height: number
} | null {
  if (!trackerBoxes.length) return null

  const left = Math.min(...trackerBoxes.map(b => b.left))
  const right = Math.max(...trackerBoxes.map(b => b.right))
  const top = Math.min(...trackerBoxes.map(b => b.top))
  const bottom = Math.max(...trackerBoxes.map(b => b.bottom))

  return {
    left,
    top,
    right,
    bottom,
    width: right - left,
    height: bottom - top
  }
}

/**
 * Converte um retângulo em path SVG simples
 * @param rect Retângulo { left, top, width, height }
 * @returns String com o path SVG (d attribute)
 */
export function rectToPath(rect: { left: number; top: number; width: number; height: number }): string {
  const { left, top, width, height } = rect
  return `M ${align(left)} ${align(top)} H ${align(left + width)} V ${align(top + height)} H ${align(left)} Z`
}

/**
 * Extrai um retângulo de um path SVG simples (retangular)
 * Funciona apenas para paths retangulares gerados por rectToPath
 * @param path String com o path SVG (d attribute)
 * @returns Retângulo { left, top, width, height } ou null se não conseguir extrair
 */
export function pathToRect(path: string): { left: number; top: number; width: number; height: number } | null {
  if (!path) return null
  
  // Tenta extrair coordenadas do path: M x y H x2 V y2 H x Z
  // Exemplo: "M 10.5 20.5 H 110.5 V 120.5 H 10.5 Z"
  const match = path.match(/M\s+([\d.]+)\s+([\d.]+)\s+H\s+([\d.]+)\s+V\s+([\d.]+)\s+H\s+([\d.]+)\s+Z/)
  
  if (match) {
    const left = parseFloat(match[1])
    const top = parseFloat(match[2])
    const right = parseFloat(match[3])
    const bottom = parseFloat(match[4])
    
    return {
      left,
      top,
      width: right - left,
      height: bottom - top
    }
  }
  
  return null
}

