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
  const [kerfIn, setKerfIn] = useState(0.125)
  // Per-group stock lengths: key is group key (e.g. "0.75_3.5"), value is ft
  const [groupStockLengths, setGroupStockLengths] = useState<Record<string, string>>({})
  const [undoState, setUndoState] = useState<{ id: string; label: string } | null>(null)
  const undoTimerRef = useState<ReturnType<typeof setTimeout> | null>(null)

  function getStockLength(groupKey: string): number {
    return parseFloat(groupStockLengths[groupKey] ?? '') || 8
  }

  // Build groups using per-group stock lengths
  const groups = useMemo(() => {
    // We need all groups first to know keys, then rebuild with per-group lengths.
    // Build once with default 8 to get keys, then rebuild per group.
    const defaultGroups = buildCutList(items, 8, kerfIn)
    return defaultGroups.map((g) => {
      const stockFt = getStockLength(g.key)
      if (stockFt === 8) return g
      return buildCutList(
        items.filter((p) => {
          const key = `${p.thickness_in}_${p.width_in}`
          return key === g.key
        }),
        stockFt,
        kerfIn
      )[0] ?? g
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, groupStockLengths, kerfIn])

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
      {/* ── Section 1: Parts List ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Parts List</h2>
          <Button size="sm" onClick={addItem}>+ Add part</Button>
        </div>

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
                      type="text"
                      tabIndex={baseTab + 1}
                    />
                  </div>
                  <div className={col.sm}>
                    <EditableCell
                      value={item.width_in}
                      onChange={(v) => handleUpdate(item.id, 'width_in', v)}
                      type="text"
                      tabIndex={baseTab + 2}
                    />
                  </div>
                  <div className={col.sm}>
                    <EditableCell
                      value={item.length_in}
                      onChange={(v) => handleUpdate(item.id, 'length_in', v)}
                      type="text"
                      tabIndex={baseTab + 3}
                    />
                  </div>
                  <div className={col.sm}>
                    <EditableCell
                      value={item.quantity}
                      onChange={(v) => handleUpdate(item.id, 'quantity', v)}
                      type="text"
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

            {/* Ghost row — click to add */}
            <div
              onClick={addItem}
              className="flex items-center w-full gap-3 py-2 border-b border-dashed
                text-sm text-muted-foreground/40 hover:text-muted-foreground/70
                hover:bg-muted/20 cursor-pointer select-none transition-colors"
            >
              <span className={col.lg}>+ Add part</span>
              <span className={col.sm}></span>
              <span className={col.sm}></span>
              <span className={col.sm}></span>
              <span className={col.sm}></span>
              <span className={col.delete}></span>
            </div>

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
      </div>

      {/* ── Section 2: Stock Layout (only when there are parts) ── */}
      {items.length > 0 && (
        <>
          <div className="border-t" />

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Stock Layout</h2>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                Kerf:
                <input
                  type="text"
                  inputMode="decimal"
                  value={kerfIn}
                  onChange={(e) => setKerfIn(parseFloat(e.target.value) || 0)}
                  className="w-14 border border-border rounded px-2 py-0.5 text-sm bg-background"
                />
                in
              </label>
            </div>

            {groups.map((group) => {
              const stockVal = groupStockLengths[group.key] ?? '8'
              return (
                <div key={group.key} className="space-y-3">
                  {/* Group header with per-group stock length */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-sm">{group.dimensionLabel}</h3>
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        Stock:
                        <input
                          type="text"
                          inputMode="decimal"
                          value={stockVal}
                          onChange={(e) =>
                            setGroupStockLengths((prev) => ({ ...prev, [group.key]: e.target.value }))
                          }
                          className="w-12 border border-border rounded px-1.5 py-0.5 bg-background text-foreground text-xs"
                        />
                        ft
                      </label>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {group.boards.length} board{group.boards.length !== 1 ? 's' : ''}{' '}
                      · {Math.round(group.wastePct * 100)}% waste
                    </span>
                  </div>

                  {group.tooLong.length > 0 && (
                    <p className="text-xs text-destructive">
                      ⚠ {group.tooLong.length} piece{group.tooLong.length !== 1 ? 's' : ''} exceed
                      the stock length and cannot be laid out automatically.
                    </p>
                  )}

                  {group.boards.map((board) => {
                    const stockFt = getStockLength(group.key)
                    return (
                      <div key={board.boardIndex} className="space-y-1">
                        <span className="text-xs text-muted-foreground">Board {board.boardIndex}</span>
                        <div className="relative h-10 w-full rounded overflow-hidden bg-muted flex">
                          {board.cuts.map((cut, i) => {
                            const widthPct = (cut.piece.lengthFt / stockFt) * 100
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
                          {board.wasteFt > 0 && (
                            <div
                              className="h-full bg-muted-foreground/20 flex items-center justify-center shrink-0"
                              style={{ width: `${(board.wasteFt / stockFt) * 100}%` }}
                            >
                              <span className="text-[10px] text-muted-foreground">
                                {(board.wasteFt * 12).toFixed(1)}&quot; waste
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
