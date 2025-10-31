import { useDraggable } from '@dnd-kit/core'
import { TRACKERS_CATALOG } from '../data/trackersCatalog'

type PaletteItemProps = { extId: number }

function PaletteItem({ extId }: PaletteItemProps) {
  const ext = TRACKERS_CATALOG.find((t) => t.id === extId)!
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `palette-ext-${extId}`, data: { from: 'palette', ext } })
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`cursor-grab active:cursor-grabbing select-none rounded border p-2 text-sm bg-white shadow-sm hover:shadow ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="font-semibold">{ext._trackers_types.type}</div>
      <div className="text-[11px] text-gray-500">{ext._manufacturers.name}</div>
      <div className="mt-1 text-[10px] text-gray-500">estacas: {ext.stake_quantity}</div>
    </div>
  )
}

export function Palette() {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-700">Trackers disponíveis</h3>
      <div className="grid grid-cols-2 gap-2">
        {TRACKERS_CATALOG.map((t) => (
          <PaletteItem key={t.id} extId={t.id} />
        ))}
      </div>
    </div>
  )
}


