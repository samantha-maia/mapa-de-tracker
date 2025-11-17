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
    1: '#475569', // slate-600 (sólido, sem transparência)
    2: '#3b82f6', // blue-600 (sólido, sem transparência)
    3: '#d97706', // amber-600 (sólido, sem transparência)
    4: '#db2777', // pink-600 (sólido, sem transparência)
    5: '#059669', // emerald-600 (sólido, sem transparência)
  }

  // Se o status_id está no mapa, retorna a cor correspondente
  if (colorMap[statusId]) {
    return colorMap[statusId]
  }

  // Para status_ids não mapeados, retorna a cor padrão
  return '#dadee6'
}

