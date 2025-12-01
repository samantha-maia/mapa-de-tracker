/**
 * Calcula a cor do tracker baseado nos status das estacas
 * 
 * Regras (em ordem de prioridade):
 * - Se contém 1 ou mais estacas vermelhas escuras (status_id 7) → tracker vermelho escuro (Inspeção reprovada)
 * - Se contém 1 ou mais estacas vermelhas (status_id 4) → tracker vermelho (Impedido para montagem)
 * - Se contém 1 ou mais estacas amarelas (status_id 3) → tracker amarelo (Atenção)
 * - Se contém 1 ou mais estacas roxas (status_id 6) → tracker roxo (Aguardando inspeção)
 * - Se todas as estacas são azuis (status_id 2) → tracker azul (Liberado para montagem)
 * - Se todas as estacas são verdes (status_id 5) → tracker verde (Módulos montados)
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

  // Verifica se há estacas vermelhas escuras (status_id 7) - prioridade máxima
  const hasDarkRed = stakeStatusIds.some(statusId => statusId === 7)
  if (hasDarkRed) {
    return {
      color: '#991b1b', // red-800 - Inspeção reprovada (mais grave)
      status: 'blocked'
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

  // Verifica se há estacas amarelas (status_id 3)
  const hasYellow = stakeStatusIds.some(statusId => statusId === 3)
  if (hasYellow) {
    return {
      color: '#eab308', // yellow-500 - Atenção (problema sem impeditivo)
      status: 'warning'
    }
  }

  // Verifica se há estacas roxas (status_id 6)
  const hasPurple = stakeStatusIds.some(statusId => statusId === 6)
  if (hasPurple) {
    return {
      color: '#9333ea', // violet-600 - Aguardando inspeção
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

  // Verifica se todas as estacas são verdes (status_id 5)
  const allGreen = stakeStatusIds.every(statusId => statusId === 5)
  if (allGreen) {
    return {
      color: '#059669', // emerald-600 - Módulos montados
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
 * - blocked (vermelho/vermelho escuro) → rows_trackers_statuses_id para "Impedido para montagem" ou "Inspeção reprovada"
 * - warning (amarelo/roxo) → rows_trackers_statuses_id para status de atenção
 * - ready (azul/verde) → rows_trackers_statuses_id para "Liberado para montagem" ou "Módulos montados"
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
      return 2 // Assumindo que 2 = Impedido para montagem (vermelho) ou Inspeção reprovada (vermelho escuro)
    case 'warning':
      return 3 // Assumindo que 3 = Atenção (amarelo ou roxo)
    case 'ready':
      return 1 // Assumindo que 1 = Liberado para montagem (azul) ou Módulos montados (verde)
    default:
      return 1 // Status padrão
  }
}

