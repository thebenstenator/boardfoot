'use client'

import { useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

// Standard rough lumber sizes (quarters system).
// roughIn = nominal rough thickness in inches.
// maxFinIn = comfortable finished thickness after jointing/planing both faces.
const ROUGH_SIZES = [
  { label: '4/4',  roughIn: 1.0,  maxFinIn: 0.75  },
  { label: '5/4',  roughIn: 1.25, maxFinIn: 1.0   },
  { label: '6/4',  roughIn: 1.5,  maxFinIn: 1.25  },
  { label: '8/4',  roughIn: 2.0,  maxFinIn: 1.75  },
  { label: '10/4', roughIn: 2.5,  maxFinIn: 2.25  },
  { label: '12/4', roughIn: 3.0,  maxFinIn: 2.75  },
]

interface CalcResult {
  stock: typeof ROUGH_SIZES[number]
  boardCount: number
  boardWidthIn: number
  purchaseLengthFt: number   // rounded up to nearest 0.5 ft for ordering
  roughLengthFt: number      // exact
  totalBF: number
}

function calcPanel(
  finThIn: number,
  finWIn: number,
  finLIn: number,
  panelCount: number,
  boardWidthIn: number,
  wastePct: number,
): CalcResult {
  // Pick the thinnest rough size that can comfortably yield finThIn.
  const stock =
    ROUGH_SIZES.find((s) => s.maxFinIn >= finThIn) ??
    ROUGH_SIZES[ROUGH_SIZES.length - 1]

  // Width: add user-specified waste (jointing, edge defects, random-width off-fall).
  // Length: add 7% fixed for snipe / end-grain checks / rough-end trimming.
  const widthFactor = 1 + wastePct / 100
  const roughWidthTotalIn = finWIn * widthFactor * panelCount
  const roughLengthIn = finLIn * 1.07
  const roughLengthFt = roughLengthIn / 12

  // Boards needed = ceil(total rough width ÷ board width).
  const boardCount = Math.max(1, Math.ceil(roughWidthTotalIn / boardWidthIn))

  // BF of rough stock = (roughT × roughW × roughL) / 144, summed across all boards.
  // All boards are the same size here so: boardCount × (roughIn × boardWidthIn × roughLengthIn) / 144
  const totalBF = (boardCount * stock.roughIn * boardWidthIn * roughLengthIn) / 144

  // Round purchase length up to nearest 0.5 ft (how lumber yards sell it).
  const purchaseLengthFt = Math.ceil(roughLengthFt * 2) / 2

  return { stock, boardCount, boardWidthIn, purchaseLengthFt, roughLengthFt, totalBF }
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PanelLumberResult {
  thickness_in: number
  width_in: number
  length_ft: number
  quantity: number
}

interface PanelCalculatorModalProps {
  open: boolean
  onClose: () => void
  onAdd: (result: PanelLumberResult) => void
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PanelCalculatorModal({
  open,
  onClose,
  onAdd,
}: PanelCalculatorModalProps) {
  const [finThIn, setFinThIn] = useState('1.5')
  const [finWIn, setFinWIn]   = useState('24')
  const [finLIn, setFinLIn]   = useState('60')
  const [panelCount, setPanelCount]   = useState('1')
  const [boardWidthIn, setBoardWidthIn] = useState('6')
  const [wastePct, setWastePct]         = useState('20')

  const result = useMemo<CalcResult | null>(() => {
    const th  = parseFloat(finThIn)
    const w   = parseFloat(finWIn)
    const l   = parseFloat(finLIn)
    const cnt = Math.max(1, parseInt(panelCount) || 1)
    const bw  = parseFloat(boardWidthIn) || 6
    const wp  = parseFloat(wastePct) || 20
    if (!th || !w || !l || th <= 0 || w <= 0 || l <= 0) return null
    return calcPanel(th, w, l, cnt, bw, wp)
  }, [finThIn, finWIn, finLIn, panelCount, boardWidthIn, wastePct])

  function handleAdd() {
    if (!result) return
    onAdd({
      thickness_in: result.stock.roughIn,
      width_in: result.boardWidthIn,
      length_ft: result.purchaseLengthFt,
      quantity: result.boardCount,
    })
    onClose()
  }

  const inp = 'w-full rounded-md border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
  const lbl = 'text-xs text-muted-foreground'

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Panel / Glue-up Calculator</DialogTitle>
          <DialogDescription>
            Enter your finished panel dimensions and we'll recommend the rough lumber to buy.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-1">

          {/* ── Finished dimensions ── */}
          <div className="space-y-2">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              Finished dimensions
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className={lbl}>Thickness (in)</label>
                <input
                  type="text" inputMode="decimal"
                  value={finThIn} onChange={(e) => setFinThIn(e.target.value)}
                  className={inp}
                />
              </div>
              <div className="space-y-1">
                <label className={lbl}>Width (in)</label>
                <input
                  type="text" inputMode="decimal"
                  value={finWIn} onChange={(e) => setFinWIn(e.target.value)}
                  className={inp}
                />
              </div>
              <div className="space-y-1">
                <label className={lbl}>Length (in)</label>
                <input
                  type="text" inputMode="decimal"
                  value={finLIn} onChange={(e) => setFinLIn(e.target.value)}
                  className={inp}
                />
              </div>
            </div>
          </div>

          {/* ── Options ── */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className={lbl}>Panels</label>
              <input
                type="text" inputMode="numeric"
                value={panelCount} onChange={(e) => setPanelCount(e.target.value)}
                className={inp}
              />
            </div>
            <div className="space-y-1">
              <label className={lbl}>Board width (in)</label>
              <input
                type="text" inputMode="decimal"
                value={boardWidthIn} onChange={(e) => setBoardWidthIn(e.target.value)}
                className={inp}
              />
            </div>
            <div className="space-y-1">
              <label className={lbl}>Width waste %</label>
              <input
                type="text" inputMode="decimal"
                value={wastePct} onChange={(e) => setWastePct(e.target.value)}
                className={inp}
              />
            </div>
          </div>

          {/* ── Live results ── */}
          {result ? (
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Recommendation
              </p>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{result.stock.label}</span>
                <span className="text-sm text-muted-foreground">
                  ({result.stock.roughIn}&Prime; rough stock)
                </span>
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Boards to buy</span>
                  <span className="font-medium tabular-nums">
                    {result.boardCount} × {result.boardWidthIn}&Prime; wide × {result.purchaseLengthFt} ft
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rough board feet</span>
                  <span className="font-medium tabular-nums">{result.totalBF.toFixed(1)} BF</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Finished panel</span>
                  <span className="font-medium tabular-nums">
                    {finThIn}&Prime; × {finWIn}&Prime; × {finLIn}&Prime;
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
                Width includes {wastePct}% for jointing & random-width off-fall.
                Length adds 7% for snipe & end-grain trimming.
                {result.stock.label === '8/4' && Number(finThIn) <= 1.5 &&
                  ' 8/4 gives you ~¼" of room to flatten and plane to your finished thickness.'}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground/50">
              Enter dimensions above to see the recommendation.
            </div>
          )}
        </div>

        <DialogFooter className="mt-2 p-0">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleAdd} disabled={!result}>
            Add to lumber list
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
