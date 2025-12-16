type PrintOrientation = 'portrait' | 'landscape'

// A4 em px @ 96 DPI (aprox)
const A4_PX_PORTRAIT = { width: 794, height: 1123 }
const getA4Px = (orientation: PrintOrientation) =>
  orientation === 'landscape'
    ? { width: A4_PX_PORTRAIT.height, height: A4_PX_PORTRAIT.width }
    : A4_PX_PORTRAIT

function copyStylesToPrintWindow(printDoc: Document) {
  const head = printDoc.head
  // Copia <link rel="stylesheet"> e <style> do documento atual
  document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
    head.appendChild(node.cloneNode(true))
  })
}

function hideNonPrintable(root: HTMLElement) {
  // Remove / esconde UI que não deve ir pra impressão
  root.querySelectorAll('[data-toolbar-button],[data-toolbar-group]').forEach((el) => {
    ;(el as HTMLElement).style.display = 'none'
  })
  root.querySelectorAll('img[alt="Gemini"]').forEach((el) => {
    ;(el as HTMLElement).style.display = 'none'
  })
  // Zoom controls (Canvas/ViewCanvas)
  root.querySelectorAll('.absolute.top-4.right-4').forEach((el) => {
    ;(el as HTMLElement).style.display = 'none'
  })
}

/**
 * "Gera PDF" abrindo o diálogo de impressão (Salvar como PDF).
 * Motivo: captura via canvas (html2canvas/html-to-image) é instável com OKLCH / CSS externo e pode sair em branco.
 */
export async function generateCanvasPDF(fieldName?: string): Promise<void> {
  const orientation: PrintOrientation = 'landscape'
  const A4_PX = getA4Px(orientation)
  const canvasContentElement = document.querySelector('.canvas-background')?.parentElement?.querySelector('.relative.h-full.w-full') as HTMLElement
  if (!canvasContentElement) throw new Error('Canvas content element not found')

  const printWin = window.open('', '_blank')
  if (!printWin) throw new Error('Popup bloqueado. Permita popups para imprimir.')

  const printDoc = printWin.document
  printDoc.open()
  printDoc.write(`<!doctype html><html><head><meta charset="utf-8"/><title>${fieldName ?? 'Mapa'}</title></head><body></body></html>`)
  printDoc.close()

  copyStylesToPrintWindow(printDoc)

  const body = printDoc.body
  body.style.margin = '0'
  body.style.background = '#fff'

  const page = printDoc.createElement('div')
  page.style.width = `${A4_PX.width}px`
  page.style.height = `${A4_PX.height}px`
  page.style.boxSizing = 'border-box'
  page.style.padding = '40px'
  page.style.display = 'flex'
  page.style.flexDirection = 'column'
  page.style.alignItems = 'center'
  page.style.justifyContent = 'flex-start'
  // Melhor chance de manter cores (ainda depende do "Background graphics" no Chrome)
  ;(page.style as any).printColorAdjust = 'exact'
  ;(page.style as any).webkitPrintColorAdjust = 'exact'

  const titleEl = printDoc.createElement('div')
  titleEl.textContent = fieldName ?? ''
  titleEl.style.fontSize = '16px'
  titleEl.style.fontWeight = '600'
  titleEl.style.marginBottom = '16px'
  titleEl.style.fontFamily = 'Lexend, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif'
  titleEl.style.width = '100%'
  titleEl.style.textAlign = 'center'
  if (!fieldName) titleEl.style.display = 'none'

  const stage = printDoc.createElement('div')
  stage.style.position = 'relative'
  stage.style.width = `${A4_PX.width - 80}px`
  stage.style.height = `${A4_PX.height - 80 - (fieldName ? 32 : 0)}px`
  stage.style.overflow = 'hidden'
  stage.style.background = '#fff'
  ;(stage.style as any).printColorAdjust = 'exact'
  ;(stage.style as any).webkitPrintColorAdjust = 'exact'

  // Clone do conteúdo
  const cloned = canvasContentElement.cloneNode(true) as HTMLElement
  cloned.style.transform = 'none'
  cloned.style.position = 'absolute'
  cloned.style.left = '0'
  cloned.style.top = '0'

  hideNonPrintable(cloned)
  stage.appendChild(cloned)

  page.appendChild(titleEl)
  page.appendChild(stage)
  body.appendChild(page)

  // Fit-to-page via scale (medindo bounds reais no DOM clonado)
  const availableW = stage.getBoundingClientRect().width
  const availableH = stage.getBoundingClientRect().height

  const measureBounds = () => {
    const els = Array.from(cloned.querySelectorAll('[data-selecto-uid]')) as HTMLElement[]
    if (els.length === 0) {
      return { minX: 0, minY: 0, width: availableW, height: availableH }
    }

    const stageRect = stage.getBoundingClientRect()
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    for (const el of els) {
      const r = el.getBoundingClientRect()
      minX = Math.min(minX, r.left - stageRect.left)
      minY = Math.min(minY, r.top - stageRect.top)
      maxX = Math.max(maxX, r.right - stageRect.left)
      maxY = Math.max(maxY, r.bottom - stageRect.top)
    }

    return { minX, minY, width: maxX - minX, height: maxY - minY }
  }

  // Aguarda layout real (agora que está no DOM)
  await new Promise((r) => requestAnimationFrame(() => r(null)))
  const real = measureBounds()

  const innerPad = 12
  const scale = Math.min(
    (availableW - innerPad * 2) / real.width,
    (availableH - innerPad * 2) / real.height
  )

  const scaledW = real.width * scale
  const scaledH = real.height * scale
  const dx = (availableW - scaledW) / 2 - real.minX * scale
  const dy = (availableH - scaledH) / 2 - real.minY * scale

  cloned.style.transformOrigin = 'top left'
  cloned.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`

  // CSS de impressão
  const style = printDoc.createElement('style')
  style.textContent = `
@page { size: A4 ${orientation}; margin: 0; }
@media print {
  html, body {
    width: ${A4_PX.width}px;
    height: ${A4_PX.height}px;
    margin: 0;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
`
  printDoc.head.appendChild(style)

  // Aguarda renderização e imprime
  await new Promise((r) => setTimeout(r, 150))
  printWin.focus()
  printWin.print()
  // Fecha depois (nem todo browser permite fechar automaticamente)
  setTimeout(() => {
    try { printWin.close() } catch { /* ignore */ }
  }, 500)
}

