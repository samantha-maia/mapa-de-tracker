import type { Row, Tracker } from '../store/layoutStore'

/**
 * Constantes de dimensão dos trackers
 */
const STAKE_SIZE = 20
const STAKE_GAP = 2
const HEADER_H = 10
const DEFAULT_TRACKER_HEIGHT = 80

/**
 * Calcula a altura de um tracker baseado no número de estacas
 */
export function calculateTrackerHeight(stakeCount: number): number {
  return stakeCount > 0 ? HEADER_H + stakeCount * (STAKE_SIZE + STAKE_GAP) : DEFAULT_TRACKER_HEIGHT
}

/**
 * Calcula a altura total de uma row considerando:
 * - Altura máxima dos trackers (com stakes)
 * - Padding do header: pt-2 = 8px
 * - Padding do container: py-2 = 8px top + 8px bottom = 16px
 * - MinHeight padrão: 120px
 * 
 * @param row - A row para calcular a altura
 * @param trackersById - Mapa de todos os trackers
 * @returns Altura total da row em pixels
 */
export function calculateRowHeight(row: Row, trackersById: Record<string, Tracker>): number {
  // Se a row está vazia, retorna minHeight
  if (row.trackerIds.length === 0) {
    return 120 // minHeight
  }

  // Busca todos os trackers da row
  const trackers = row.trackerIds
    .map(id => trackersById[id])
    .filter(Boolean) as Tracker[]

  if (trackers.length === 0) {
    return 120 // minHeight
  }

  // Calcula a altura máxima entre todos os trackers
  const trackerHeights = trackers.map(t => {
    const stakeCount = t?.ext?.stake_quantity ?? 0
    return calculateTrackerHeight(stakeCount)
  })
  const maxTrackerHeight = Math.max(...trackerHeights)

  // Padding do header: pt-2 = 8px
  const headerPadding = 8
  
  // Padding do container: py-2 = 8px top + 8px bottom = 16px
  const containerPadding = 16

  // Altura total: altura do tracker + paddings
  const totalHeight = maxTrackerHeight + headerPadding + containerPadding

  // Retorna o maior entre minHeight (120px) e altura calculada
  return Math.max(120, totalHeight)
}

/**
 * Calcula a altura de uma row incluindo gap mínimo para espaçamento entre rows
 * Usado principalmente para alinhamento vertical
 * 
 * @param row - A row para calcular a altura
 * @param trackersById - Mapa de todos os trackers
 * @param includeGap - Se true, inclui gap mínimo de 4px para espaçamento entre rows
 * @returns Altura total da row em pixels (com ou sem gap)
 */
export function calculateRowHeightWithGap(
  row: Row, 
  trackersById: Record<string, Tracker>,
  includeGap: boolean = false
): number {
  const baseHeight = calculateRowHeight(row, trackersById)
  const gap = includeGap ? 4 : 0
  return baseHeight + gap
}

