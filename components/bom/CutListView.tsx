'use client'

import { useMemo, useState } from 'react'
import { useCutParts } from '@/hooks/useLineItems'
import { buildCutList } from '@/lib/calculations/cutList'
import { Button } from '@/components/ui/button'
import { EditableCell, DescriptionCell } from '@/components/bom/BomCells'
import { bomRow, bomHeader, col } from '@/components/bom/bomStyles'
import type { CutPart } from '@/types/bom'

const COLORS = [
  'bg-blue-600/70',
  'bg-amber-600/70',
  'bg-green-600/70',
  'bg-rose-600/70',
  'bg-purple-600/70',
  'bg-orange-600/70',
  'bg-teal-600/70',
  'bg-pink-600/70',
]

interface CutListViewProps {
  projectId: string
}

export function CutListView({ projectId }: CutListViewProps) {
  const { items, addItem, updateItem, removeItem, undoRemove } = useCutParts(projectId)
  const [stockLengthFt, setStockLengthFt] = useState(8)
  const [kerfIn, setKerfIn] = useState(0.125)
  const [undoState, setUndoState] = useState<{ id: string; label: string } | null>(null)
  const undoTimerRef = useState<ReturnType<typeof setTimeout> | null>(null)

  const groups = useMemo(
    () => buildCutList(items, stockLengthFt, kerfIn),
    [items, stockLengthFt, kerfIn]
  )

  function handleRemove(id: string, label: string) {
    removeItem(id)
    if (undoTimerRef[0]) clearTimeout(undoTimerRef[0])
    setUndoState({ id, label })
    undoTimerRef[1](setTimeout(() => setUndoState(null), 5000))
  }

  function handleUndo() {
    if (!undoState) return
    if (undoTimerRef[0]) clearTimeout(undoTimerRef[0])
    undoRemove(undoState.id)
    setUndoState(null)
  }

  function handleUpdate(id: string, field: keyof CutPart, raw: string) {
    const numericFields = ['thickness_in', 'width_in', 'length_in', 'quantity']
    const value = numericFields.includes(field) ? parseFloat(raw) || 0 : raw
    updateItem(id, { [field]: value } as Partial<CutPart>)
  }

  const TAB_OFFSET = 200
  const TAB_STOPS_PER_ROW = 5

  return (
    <div className="space-y-8">
      {/* ── Section 1: Cut Parts ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Cut Parts</h2>
          <Button size="sm" onClick={addItem}>
            + Add part
          </Button>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No parts added yet. Click &ldquo;+ Add part&rdquo; to start.
          </p>
        ) : (
          <div className="overflow-x-auto -mx-4 px-4 sm:overflow-visible sm:mx-0 sm:px-0">
            <div className="min-w-[500px] sm:min-w-0">
              <div className={bomHeader}>
                <span className={col.lg}>Part name</span>
                <span className={col.sm}>T (in)</span>
                <span className={col.sm}>W (in)</span>
                <span className={col.sm}>L (in)</span>
                <span className={col.sm}>Qty</span>
                <span className={col.delete}></span>
              </div>

              {items.map((item, rowIndex) => {
                const baseTab = rowIndex * TAB_STOPS_PER_ROW + TAB_OFFSET
                return (
                  <div
                    key={item.id}
                    className={`${bomRow} border-b hover:bg-muted/30`}
                  >
                    <div className={col.lg}>
                      <DescriptionCell
                        value={item.label}
                        onChange={(v) => handleUpdate(item.id, 'label', v)}
                        tabIndex={baseTab}
                      />
                    </div>
                    <div className={col.sm}>
                      <EditableCell
                        value={item.thickness_in}
                        onChange={(v) => handleUpdate(item.id, 'thickness_in', v)}
                        type="number"
                        tabIndex={baseTab + 1}
                      />
                    </div>
                    <div className={col.sm}>
                      <EditableCell
                        value={item.width_in}
                        onChange={(v) => handleUpdate(item.id, 'width_in', v)}
                        type="number"
                        tabIndex={baseTab + 2}
                      />
                    </div>
                    <div className={col.sm}>
                      <EditableCell
                        value={item.length_in}
                        onChange={(v) => handleUpdate(item.id, 'length_in', v)}
                        type="number"
                        tabIndex={baseTab + 3}
                      />
                    </div>
                    <div className={col.sm}>
                      <EditableCell
                        value={item.quantity}
                        onChange={(v) => handleUpdate(item.id, 'quantity', v)}
                        type="number"
                        tabIndex={baseTab + 4}
                      />
                    </div>
                    <div className={col.delete}>
                      <button
                        onClick={() => handleRemove(item.id, item.label || 'part')}
                        tabIndex={-1}
                        aria-label={`Delete ${item.label || 'part'}`}
                        className="cursor-pointer text-muted-foreground hover:text-destructive
                          text-xs focus:outline-none focus:ring-1 focus:ring-ring rounded"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )
              })}

              {undoState && (
                <div className="flex items-center justify-between mt-2 px-3 py-2 rounded bg-muted text-sm">
                  <span className="text-muted-foreground">
                    &ldquo;{undoState.label}&rdquo; deleted
                  </span>
                  <button
                    onClick={handleUndo}
                    aria-label="Undo delete"
                    className="cursor-pointer font-medium underline hover:text-foreground focus:outline-none"
                  >
                    Undo
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Section 2: Stock Layout (only when there are parts) ── */}
      {items.length > 0 && (
        <>
          <div className="border-t" />

          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Stock Layout</h2>

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
                No parts to lay out.
              </p>
            )}

            {groups.map((group) => (
              <div key={group.key} className="space-y-3">
                {/* Group header */}
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">
                    {group.dimensionLabel}
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
                        const lengthIn = (cut.piece.lengthFt * 12).toFixed(1)
                        return (
                          <div
                            key={i}
                            className={`${color} h-full flex items-center justify-center overflow-hidden shrink-0`}
                            style={{ width: `${widthPct}%` }}
                            title={`${cut.piece.label} — ${lengthIn}"`}
                          >
                            <span className="text-[10px] font-medium px-1 truncate text-white">
                              {cut.piece.label ? `${cut.piece.label} — ` : ''}{lengthIn}&quot;
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
                            {(board.wasteFt * 12).toFixed(1)}&quot; waste
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
