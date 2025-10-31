import { useDraggable } from '@dnd-kit/core'
import type { Tracker as TrackerModel } from '../store/layoutStore'
import { useLayoutStore } from '../store/layoutStore'

type Props = {
  tracker: TrackerModel
  selected?: boolean
}

export function Tracker({ tracker, selected }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: tracker.id, data: { from: 'loose', id: tracker.id } })
  const removeTracker = useLayoutStore((s) => s.removeTracker)
  const stakeSize = 30
  const stakeGap = 4
  const headerH = 36
  const stakeCount = tracker.ext?.stake_quantity ?? 0
  const dynamicH = stakeCount > 0 ? headerH + stakeCount * (stakeSize + stakeGap) + 15 : 80
  return (
    <div className="relative">
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        className={`pointer-events-auto select-none rounded border bg-white p-2 text-xs shadow-sm ${
          selected ? 'ring-2 ring-blue-500' : ''
        } ${isDragging ? 'opacity-50' : ''}`}
        style={{ width: 115, height: dynamicH }}
      >
        <div className="font-semibold text-gray-800">{tracker.ext?.type ?? tracker.title}</div>
        <div className="text-gray-500" style={{ marginBottom: 8 }}>{tracker.ext?.manufacturer ?? '—'}</div>
        {tracker.ext ? (
          <div className="mt-1 flex flex-col items-center" style={{ gap: stakeGap }}>
            {Array.from({ length: tracker.ext.stake_quantity }).map((_, i) => (
              <div key={i} style={{ width: stakeSize, height: stakeSize }} className="rounded-sm bg-slate-600"/>
            ))}
          </div>
        ) : null}
      </div>
      <button
        className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-red-600 text-[10px] font-bold text-white"
        onClick={() => removeTracker(tracker.id)}
        aria-label="Remover"
      >×</button>
    </div>
  )
}


