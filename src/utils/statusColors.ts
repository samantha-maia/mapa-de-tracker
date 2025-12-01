/**
 * Mapeia status_id para cores
 * Cada status_id recebe uma cor específica para visualização
 */
export function getStatusColor(statusId: number | null | undefined): string {
  if (statusId === null || statusId === undefined) {
    return '#dadee6' // Cor padrão (mesma do status_id 1)
  }

  // Mapeamento de status_id para cores HEX específicas (cores sólidas e opacas)
  const colorMap: Record<number, string> = {
    1: '#475569', // slate-600 - Cinza - Não cravada
    2: '#3b82f6', // blue-600 - Azul - Cravada com Sucesso
    3: '#eab308', // yellow-500 - Amarelo - Cravada com problema mas sem impeditivo
    4: '#dc2626', // red-600 - Vermelho - Problema que impede a montagem do tracker
    5: '#059669', // emerald-600 - Verde - Módulos montados
    6: '#9333ea', // violet-600 - Roxo/Violeta - Aguardando inspeção
    7: '#991b1b', // red-800 - Vermelho escuro - Inspeção reprovada
  }

  // Se o status_id está no mapa, retorna a cor correspondente
  if (colorMap[statusId]) {
    return colorMap[statusId]
  }

  // Para status_ids não mapeados, retorna a cor padrão
  return '#dadee6'
}

