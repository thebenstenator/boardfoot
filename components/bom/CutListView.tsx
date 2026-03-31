'use client'

import { Fragment, useMemo, useState } from 'react'
import { useCutParts } from '@/hooks/useLineItems'
import { useProjectStore } from '@/store/projectStore'
import { buildCutList } from '@/lib/calculations/cutList'
import type { BoardLayout, SheetLayout, CutPiece, StockGroup } from '@/lib/calculations/cutList'
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

// ─── Board Layout Diagram ──────────────────────────────────────────────────────

function BoardLayoutView({ layout }: { layout: BoardLayout }) {
  return (
    <div className="space-y-2">
      {layout.boards.map((board) => (
        <div key={board.index} className="space-y-1">
          <span className="text-xs text-muted-foreground">Board {board.index}</span>
          <div className="relative h-10 w-full rounded overflow-hidden bg-muted flex">
            {board.segments.map((seg, i) => {
              if ('type' in seg && seg.type === 'waste') {
                return (
                  <div
                    key={i}
                    className="h-full bg-muted-foreground/20 flex items-center justify-center shrink-0"
                    style={{ width: `${(seg.lengthIn / (board.segments.reduce((s, x) => s + x.lengthIn, 0))) * 100}%` }}
                  >
                    <span className="text-[10px] text-muted-foreground">
                      {seg.lengthIn.toFixed(1)}&quot; waste
                    </span>
                  </div>
                )
              }
              const cut = seg as { piece: CutPiece; lengthIn: number }
              const totalIn = board.segments.reduce((s, x) => s + x.lengthIn, 0)
              const widthPct = (cut.lengthIn / totalIn) * 100
              const color = COLORS[cut.piece.colorIndex % COLORS.length]
              return (
                <div
                  key={i}
                  className={`${color} h-full flex items-center justify-center overflow-hidden shrink-0`}
                  style={{ width: `${widthPct}%` }}
                  title={`${cut.piece.label} — ${cut.lengthIn.toFixed(1)}"`}
                >
                  <span className="text-[10px] font-medium px-1 truncate text-white">
                    {cut.piece.label ? `${cut.piece.label} — ` : ''}{cut.lengthIn.toFixed(1)}&quot;
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Sheet Layout Diagram ─────────────────────────────────────────────────────

function SheetLayoutView({ layout, group, boardMode = false }: { layout: SheetLayout; group: StockGroup; boardMode?: boolean }) {
  const DIAGRAM_WIDTH = 480
  const DIAGRAM_HEIGHT = boardMode
    ? Math.max(48, Math.min(80, Math.round((group.stockWidthIn / group.stockLengthIn) * DIAGRAM_WIDTH * 3)))
    : 200

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {boardMode
          ? 'Rip cut layout — each board can yield multiple widths.'
          : 'Strip/rip cut layout — each horizontal band is one rip width.'}
      </p>
      {layout.sheets.map((sheet) => {
        const totalWidthUsed = sheet.strips.reduce((s, st) => s + st.widthIn, 0)
        const widthUsedWithKerfs = sheet.widthUsed

        return (
          <div key={sheet.index} className="space-y-1">
            <span className="text-xs text-muted-foreground">{boardMode ? 'Board' : 'Sheet'} {sheet.index}</span>
            <div
              className="relative rounded overflow-hidden border border-border bg-muted/40"
              style={{ width: boardMode ? '100%' : DIAGRAM_WIDTH, height: DIAGRAM_HEIGHT }}
            >
              {/* Render strips as horizontal bands */}
              {sheet.strips.map((strip, si) => {
                // Compute top offset: sum of previous strip heights + kerf gaps
                let topOffset = 0
                for (let k = 0; k < si; k++) {
                  topOffset += (sheet.strips[k].widthIn / group.stockWidthIn) * DIAGRAM_HEIGHT
                }
                const stripHeight = (strip.widthIn / group.stockWidthIn) * DIAGRAM_HEIGHT

                return (
                  <div
                    key={si}
                    className="absolute left-0 right-0 overflow-hidden"
                    style={{ top: topOffset, height: stripHeight }}
                  >
                    {/* Pieces within this strip */}
                    {strip.pieces.map(({ piece, offsetIn }, pi) => {
                      const leftPct = (offsetIn / group.stockLengthIn) * 100
                      const widthPct = (piece.lengthIn / group.stockLengthIn) * 100
                      const color = COLORS[piece.colorIndex % COLORS.length]
                      return (
                        <div
                          key={pi}
                          className={`${color} absolute h-full flex items-center justify-center overflow-hidden`}
                          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                          title={`${piece.label} — ${piece.lengthIn.toFixed(1)}" × ${piece.widthIn.toFixed(1)}"`}
                        >
                          <span className="text-[10px] font-medium px-0.5 truncate text-white">
                            {piece.label ? `${piece.label}` : ''} {piece.lengthIn.toFixed(0)}&quot;
                          </span>
                        </div>
                      )
                    })}
                    {/* Waste at end of strip */}
                    {strip.wasteIn > 0 && (
                      <div
                        className="absolute h-full bg-muted-foreground/20 flex items-center justify-center"
                        style={{
                          left: `${((group.stockLengthIn - strip.wasteIn) / group.stockLengthIn) * 100}%`,
                          width: `${(strip.wasteIn / group.stockLengthIn) * 100}%`,
                        }}
                      >
                        <span className="text-[9px] text-muted-foreground truncate px-0.5">
                          {strip.wasteIn.toFixed(0)}&quot; waste
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
              {/* Unused height below all strips */}
              {totalWidthUsed < group.stockWidthIn && (
                <div
                  className="absolute left-0 right-0 bottom-0 bg-muted-foreground/10 flex items-center justify-center"
                  style={{
                    height: `${((group.stockWidthIn - widthUsedWithKerfs) / group.stockWidthIn) * DIAGRAM_HEIGHT}px`,
                  }}
                >
                  <span className="text-[10px] text-muted-foreground">
                    {(group.stockWidthIn - widthUsedWithKerfs).toFixed(1)}&quot; unused width
                  </span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CutListView({ projectId }: CutListViewProps) {
  const { items, addItem, updateItem, removeItem, undoRemove } = useCutParts(projectId)
  const lumberItems = useProjectStore((s) => s.lumberItems)
  const [kerfIn, setKerfIn] = useState(0.125)
  const [undoState, setUndoState] = useState<{ id: string; label: string; index: number } | null>(null)
  const undoTimerRef = useState<ReturnType<typeof setTimeout> | null>(null)

  const groups = useMemo(
    () => buildCutList(items, lumberItems, kerfIn),
    [items, lumberItems, kerfIn]
  )

  function handleRemove(id: string, label: string, index: number) {
    removeItem(id)
    if (undoTimerRef[0]) clearTimeout(undoTimerRef[0])
    setUndoState({ id, label, index })
    undoTimerRef[1](setTimeout(() => setUndoState(null), 5000))
  }

  function handleUndo() {
    if (!undoState) return
    if (undoTimerRef[0]) clearTimeout(undoTimerRef[0])
    undoRemove(undoState.id)
    setUndoState(null)
  }

  function handleUpdate(id: string, field: keyof CutPart, raw: string) {
    const numericFields: Array<keyof CutPart> = [
      'thickness_in', 'width_in', 'length_in', 'quantity',
      'stock_width_in', 'stock_length_in',
    ]
    const value = numericFields.includes(field) ? (parseFloat(raw) || null) : raw
    updateItem(id, { [field]: value } as Partial<CutPart>)
  }

  function handleStockSelect(id: string, lumberItemId: string) {
    if (lumberItemId === '') {
      updateItem(id, { lumber_item_id: null })
    } else {
      updateItem(id, { lumber_item_id: lumberItemId, stock_width_in: null, stock_length_in: null })
    }
  }

  // Derive display values for stock dims per part
  function getStockDimsDisplay(item: CutPart): { w: string; l: string } {
    if (item.lumber_item_id) {
      const li = lumberItems.find((l) => l.id === item.lumber_item_id)
      if (li) {
        const len = li.length_unit === 'in' ? li.length_ft : li.length_ft * 12
        return { w: li.width_in.toString(), l: len.toString() }
      }
    }
    return {
      w: item.stock_width_in != null ? item.stock_width_in.toString() : '',
      l: item.stock_length_in != null ? item.stock_length_in.toString() : '',
    }
  }

  return (
    <div className="space-y-8">
      {/* ── Section 1: Parts List ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Parts List</h2>
          <Button size="sm" onClick={addItem}>+ Add part</Button>
        </div>

        <div className="overflow-x-auto -mx-4 px-4 sm:overflow-visible sm:mx-0 sm:px-0">
          <div className="min-w-[700px] sm:min-w-0">
            <div className={bomHeader}>
              <span className={col.md}>Stock</span>
              <span className={col.lg}>Part name</span>
              <span className={col.sm}>T (in)</span>
              <span className={col.sm}>W (in)</span>
              <span className={col.sm}>L (in)</span>
              <span className={col.sm}>Stock W&quot;</span>
              <span className={col.sm}>Stock L&quot;</span>
              <span className={col.sm}>Qty</span>
              <span className={col.delete}></span>
            </div>

            {items.map((item, rowIndex) => {
              const isLinked = !!item.lumber_item_id
              const dims = getStockDimsDisplay(item)
              return (
                <Fragment key={item.id}>
                {undoState?.index === rowIndex && (
                  <div className="flex items-center justify-between px-3 py-2 border-b rounded bg-muted text-sm">
                    <span className="text-muted-foreground">&ldquo;{undoState.label}&rdquo; deleted</span>
                    <button onClick={handleUndo} aria-label="Undo delete" className="cursor-pointer font-medium underline hover:text-foreground focus:outline-none">Undo</button>
                  </div>
                )}
                <div
                  className={`${bomRow} border-b hover:bg-muted/30`}
                >
                  {/* Stock dropdown */}
                  <div className={col.md}>
                    <select
                      value={item.lumber_item_id ?? ''}
                      onChange={(e) => handleStockSelect(item.id, e.target.value)}
                      className="w-full bg-transparent border border-transparent rounded px-1 py-0.5 text-sm
                        focus:outline-none focus:border-ring focus:bg-background hover:border-border
                        text-foreground"
                    >
                      <option value="">Manual</option>
                      {lumberItems.map((li) => (
                        <option key={li.id} value={li.id}>
                          {li.species && li.species.trim()
                            ? li.species
                            : `${li.thickness_in}" × ${li.width_in}"`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Part name */}
                  <div className={col.lg}>
                    <DescriptionCell
                      value={item.label}
                      onChange={(v) => handleUpdate(item.id, 'label', v)}
                    />
                  </div>

                  {/* T */}
                  <div className={col.sm}>
                    <EditableCell
                      value={item.thickness_in}
                      onChange={(v) => handleUpdate(item.id, 'thickness_in', v)}
                      type="text"
                    />
                  </div>

                  {/* W */}
                  <div className={col.sm}>
                    <EditableCell
                      value={item.width_in}
                      onChange={(v) => handleUpdate(item.id, 'width_in', v)}
                      type="text"
                    />
                  </div>

                  {/* L */}
                  <div className={col.sm}>
                    <EditableCell
                      value={item.length_in}
                      onChange={(v) => handleUpdate(item.id, 'length_in', v)}
                      type="text"
                    />
                  </div>

                  {/* Stock W" — read-only if linked, editable if manual */}
                  <div className={col.sm}>
                    {isLinked ? (
                      <span className="px-1 py-0.5 text-sm text-muted-foreground">
                        {dims.w}&quot;
                      </span>
                    ) : (
                      <EditableCell
                        value={item.stock_width_in ?? ''}
                        onChange={(v) => handleUpdate(item.id, 'stock_width_in', v)}
                        type="text"
                      />
                    )}
                  </div>

                  {/* Stock L" — read-only if linked, editable if manual */}
                  <div className={col.sm}>
                    {isLinked ? (
                      <span className="px-1 py-0.5 text-sm text-muted-foreground">
                        {dims.l}&quot;
                      </span>
                    ) : (
                      <EditableCell
                        value={item.stock_length_in ?? ''}
                        onChange={(v) => handleUpdate(item.id, 'stock_length_in', v)}
                        type="text"
                      />
                    )}
                  </div>

                  {/* Qty */}
                  <div className={col.sm}>
                    <EditableCell
                      value={item.quantity}
                      onChange={(v) => handleUpdate(item.id, 'quantity', v)}
                      type="text"
                    />
                  </div>

                  {/* Delete */}
                  <div className={col.delete}>
                    <button
                      onClick={() => handleRemove(item.id, item.label || 'part', rowIndex)}
                      aria-label={`Delete ${item.label || 'part'}`}
                      className="cursor-pointer text-muted-foreground hover:text-destructive
                        text-xs focus:outline-none focus:ring-1 focus:ring-ring rounded"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                </Fragment>
              )
            })}

            {undoState?.index === items.length && (
              <div className="flex items-center justify-between px-3 py-2 border-b rounded bg-muted text-sm">
                <span className="text-muted-foreground">&ldquo;{undoState.label}&rdquo; deleted</span>
                <button onClick={handleUndo} aria-label="Undo delete" className="cursor-pointer font-medium underline hover:text-foreground focus:outline-none">Undo</button>
              </div>
            )}

            {/* Ghost row — click to add */}
            <div
              onClick={addItem}
              className="flex items-center w-full gap-3 py-2 border-b border-dashed
                text-sm text-muted-foreground/40 hover:text-muted-foreground/70
                hover:bg-muted/20 cursor-pointer select-none transition-colors"
            >
              <span className={col.md}>+ Add part</span>
              <span className={col.lg}></span>
              <span className={col.sm}></span>
              <span className={col.sm}></span>
              <span className={col.sm}></span>
              <span className={col.sm}></span>
              <span className={col.sm}></span>
              <span className={col.sm}></span>
              <span className={col.delete}></span>
            </div>

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
              const unitLabel = group.isSheet ? 'sheet' : 'board'
              const count =
                group.layout.type === 'board'
                  ? (group.layout as BoardLayout).boardsNeeded
                  : (group.layout as SheetLayout).sheetsNeeded
              const wastePct = group.layout.wastePct

              return (
                <div key={group.key} className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-semibold text-sm">
                      {group.label}
                      <span className="font-normal text-muted-foreground ml-2 text-xs">
                        stock: {group.stockWidthIn}&quot; × {group.stockLengthIn}&quot;
                      </span>
                    </h3>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {count} {unitLabel}{count !== 1 ? 's' : ''}{' '}
                      · {Math.round(wastePct * 100)}% waste
                    </span>
                  </div>

                  {group.layout.type === 'board' ? (
                    <BoardLayoutView layout={group.layout as BoardLayout} />
                  ) : (
                    <SheetLayoutView layout={group.layout as SheetLayout} group={group} boardMode={!group.isSheet} />
                  )}
                </div>
              )
            })}

            {groups.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Add parts and assign stock sources to see the layout.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
