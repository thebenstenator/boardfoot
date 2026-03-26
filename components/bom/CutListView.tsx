'use client'

import { useMemo, useState } from 'react'
import { useProjectStore } from '@/store/projectStore'
import { buildCutList } from '@/lib/calculations/cutList'

const COLORS = [
  'bg-blue-200',
  'bg-amber-200',
  'bg-green-200',
  'bg-rose-200',
  'bg-purple-200',
  'bg-orange-200',
  'bg-teal-200',
  'bg-pink-200',
]

export function CutListView() {
  const lumberItems = useProjectStore((s) => s.lumberItems)
  const [stockLengthFt, setStockLengthFt] = useState(8)
  const [kerfIn, setKerfIn] = useState(0.125)

  const groups = useMemo(
    () => buildCutList(lumberItems, stockLengthFt, kerfIn),
    [lumberItems, stockLengthFt, kerfIn]
  )

  return (
    <div className="space-y-8">
      {/* Settings bar */}
      <div className="flex items-center gap-6 text-sm">
        <label>
          Stock length:{' '}
          <input
            type="number"
            value={stockLengthFt}
            min={1}
            onChange={(e) => setStockLengthFt(parseFloat(e.target.value) || 8)}
            className="w-16 border border-border rounded px-2 py-0.5 text-sm bg-background ml-1"
          />{' '}
          ft
        </label>
        <label>
          Kerf:{' '}
          <input
            type="number"
            value={kerfIn}
            step="0.0625"
            min={0}
            onChange={(e) => setKerfIn(parseFloat(e.target.value) || 0)}
            className="w-16 border border-border rounded px-2 py-0.5 text-sm bg-background ml-1"
          />{' '}
          in
        </label>
      </div>

      {groups.length === 0 && (
        <p className="text-muted-foreground text-sm">
          No lumber items to optimize.
        </p>
      )}

      {groups.map((group) => (
        <div key={group.key} className="space-y-3">
          {/* Group header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">
              {group.species} &mdash; {group.thickness_in}&quot; &times; {group.width_in}&quot;
            </h3>
            <span className="text-xs text-muted-foreground">
              {group.boards.length} board{group.boards.length !== 1 ? 's' : ''}{' '}
              &middot; {Math.round(group.wastePct * 100)}% waste
            </span>
          </div>

          {/* tooLong warning */}
          {group.tooLong.length > 0 && (
            <p className="text-xs text-destructive">
              &#9888; {group.tooLong.length} piece
              {group.tooLong.length !== 1 ? 's' : ''} exceed the stock length
              and cannot be laid out automatically.
            </p>
          )}

          {/* Board diagrams */}
          {group.boards.map((board) => (
            <div key={board.boardIndex} className="space-y-1">
              <span className="text-xs text-muted-foreground">
                Board {board.boardIndex}
              </span>
              <div className="relative h-10 w-full rounded overflow-hidden bg-muted flex">
                {board.cuts.map((cut, i) => {
                  const widthPct = (cut.piece.lengthFt / stockLengthFt) * 100
                  const color = COLORS[cut.piece.colorIndex % COLORS.length]
                  return (
                    <div
                      key={i}
                      className={`${color} h-full flex items-center justify-center overflow-hidden shrink-0`}
                      style={{ width: `${widthPct}%` }}
                      title={`${cut.piece.label} — ${cut.piece.lengthFt.toFixed(2)}ft`}
                    >
                      <span className="text-[10px] font-medium px-1 truncate">
                        {cut.piece.lengthFt.toFixed(2)}&apos;
                      </span>
                    </div>
                  )
                })}
                {/* waste block */}
                {board.wasteFt > 0 && (
                  <div
                    className="h-full bg-muted-foreground/20 flex items-center justify-center shrink-0"
                    style={{ width: `${(board.wasteFt / stockLengthFt) * 100}%` }}
                  >
                    <span className="text-[10px] text-muted-foreground">
                      {board.wasteFt.toFixed(2)}&apos; waste
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
