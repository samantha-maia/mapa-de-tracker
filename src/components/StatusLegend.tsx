import { getStatusColor } from '../utils/statusColors'

const STATUS_DESCRIPTIONS: Record<number, string> = {
  1: 'Não cravada',
  2: 'Cravada com Sucesso',
  3: 'Cravada com problema mas sem impeditivo para montagem do tracker',
  4: 'Problema que impede a montagem do tracker',
  5: 'Módulos montados',
  6: 'Aguardando inspeção',
  7: 'Inspeção reprovada',
}

type StatusLegendProps = {
  compact?: boolean
}

export function StatusLegend({ compact = false }: StatusLegendProps) {
  const statusIds = [1, 2, 3, 4, 5, 6, 7] as const

  if (compact) {
    // Versão compacta para ViewCanvas (canto fixo)
    return (
      <div className="absolute bottom-4 left-4 rounded-lg border border-gray-200 bg-white p-3 shadow-lg max-w-xs">
        <div className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
          Legenda de Status
        </div>
        <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
          {statusIds.map((statusId) => {
            const color = getStatusColor(statusId)
            const description = STATUS_DESCRIPTIONS[statusId]
            return (
              <div key={statusId} className="flex items-start gap-2">
                <div
                  className="w-4 h-4 rounded-sm flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-gray-600 leading-tight">
                    {description}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Versão completa para Canvas (barra lateral)
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm">
      <h4 className="text-[11px] font-medium text-gray-600 mb-2">
        Legenda de Status
      </h4>
      <div className="space-y-1.5">
        {statusIds.map((statusId) => {
          const color = getStatusColor(statusId)
          const description = STATUS_DESCRIPTIONS[statusId]
          return (
            <div key={statusId} className="flex items-start gap-2">
              <div
                className="w-4 h-4 rounded-sm flex-shrink-0 mt-0.5 border border-gray-300"
                style={{ backgroundColor: color }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-gray-600 leading-tight">
                  {description}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

