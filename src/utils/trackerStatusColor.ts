/**
 * Calcula a cor do tracker baseado nos status das estacas
 * 
 * Regras:
 * - Se contém 1 ou mais estacas vermelhas (status_id 4) → tracker vermelho (Impedido para montagem)
 * - Se contém 1 ou mais estacas laranja (status_id 3) → tracker laranja
 * - Se todas as estacas são azuis (status_id 2) → tracker azul (Liberado para montagem)
 */
export function getTrackerStatusColor(stakeStatusIds?: (number | null)[]): {
  color: string
  status: 'blocked' | 'warning' | 'ready' | 'default'
} {
  if (!stakeStatusIds || stakeStatusIds.length === 0) {
    return {
      color: '#e5e7eb', // gray-200 - cor padrão
      status: 'default'
    }
  }

  // Verifica se há estacas vermelhas (status_id 4)
  const hasRed = stakeStatusIds.some(statusId => statusId === 4)
  if (hasRed) {
    return {
      color: '#dc2626', // red-600 - Impedido para montagem
      status: 'blocked'
    }
  }

  // Verifica se há estacas laranja (status_id 3)
  const hasOrange = stakeStatusIds.some(statusId => statusId === 3)
  if (hasOrange) {
    return {
      color: '#d97706', // amber-600 - Laranja
      status: 'warning'
    }
  }

  // Verifica se todas as estacas são azuis (status_id 2)
  const allBlue = stakeStatusIds.every(statusId => statusId === 2)
  if (allBlue) {
    return {
      color: '#3b82f6', // blue-600 - Liberado para montagem
      status: 'ready'
    }
  }

  // Caso padrão (outros status ou mistura)
  return {
    color: '#e5e7eb', // gray-200
    status: 'default'
  }
}

/**
 * Calcula o rows_trackers_statuses_id baseado nos status das estacas
 * 
 * Mapeamento:
 * - blocked (vermelho) → rows_trackers_statuses_id para "Impedido para montagem"
 * - warning (laranja) → rows_trackers_statuses_id para status de atenção
 * - ready (azul) → rows_trackers_statuses_id para "Liberado para montagem"
 * - default → 1 (status padrão)
 * 
 * Nota: Os IDs específicos de rows_trackers_statuses_id precisam ser confirmados com o banco de dados.
 * Por enquanto, usamos valores assumidos baseados na lógica de negócio.
 */
export function getRowsTrackersStatusesId(stakeStatusIds?: (number | null)[]): number {
  const trackerStatus = getTrackerStatusColor(stakeStatusIds)
  
  // Mapeamento de status para rows_trackers_statuses_id
  // TODO: Confirmar os IDs corretos com o banco de dados
  switch (trackerStatus.status) {
    case 'blocked':
      return 2 // Assumindo que 2 = Impedido para montagem (vermelho)
    case 'warning':
      return 3 // Assumindo que 3 = Atenção (laranja)
    case 'ready':
      return 1 // Assumindo que 1 = Liberado para montagem (azul)
    default:
      return 1 // Status padrão
  }
}

