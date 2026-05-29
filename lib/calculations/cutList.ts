import type { CutPart, LumberItem } from '@/types/bom'

export interface CutPiece {
  partId: string
  label: string
  widthIn: number    // cut piece width
  lengthIn: number   // cut piece length
  colorIndex: number
}

export interface StockGroup {
  key: string                    // lumber_item_id or "manual_W_L"
  label: string                  // e.g. "Birch Plywood" or "0.75\" × 3.5\""
  stockWidthIn: number           // raw stock width
  stockLengthIn: number          // raw stock length
  isSheet: boolean               // stockWidthIn >= 24
  hasRipping: boolean            // pieces narrower than stock — use 2D rip layout
  pieces: CutPiece[]             // all individual pieces (expanded by qty)
  layout: BoardLayout | SheetLayout
}

// 1D layout for boards
export interface BoardLayout {
  type: 'board'
  boards: Array<{
    index: number
    segments: Array<{ piece: CutPiece; lengthIn: number } | { type: 'waste'; lengthIn: number }>
    wasteIn: number
  }>
  boardsNeeded: number
  wastePct: number
}

// 2D layout for sheets (guillotine / strip cutting)
export interface SheetLayout {
  type: 'sheet'
  sheets: Array<{
    index: number
    strips: Array<{
      widthIn: number       // this strip's rip width
      pieces: Array<{ piece: CutPiece; offsetIn: number; widthOffsetIn: number }>
      wasteIn: number       // leftover at end of strip
    }>
    widthUsed: number       // sum of strip widths
    widthWaste: number      // stock width - widthUsed
  }>
  sheetsNeeded: number
  wastePct: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStockDims(
  part: CutPart,
  lumberItem: LumberItem | undefined
): { stockWidthIn: number; stockLengthIn: number } {
  // User override on the part takes priority
  if (part.stock_width_in != null && part.stock_length_in != null) {
    return { stockWidthIn: part.stock_width_in, stockLengthIn: part.stock_length_in }
  }
  if (part.stock_width_in != null && lumberItem) {
    const stockLengthIn =
      lumberItem.length_unit === 'in' ? lumberItem.length_ft : lumberItem.length_ft * 12
    return { stockWidthIn: part.stock_width_in, stockLengthIn }
  }
  if (lumberItem) {
    const stockLengthIn =
      lumberItem.length_unit === 'in' ? lumberItem.length_ft : lumberItem.length_ft * 12
    return { stockWidthIn: lumberItem.width_in, stockLengthIn }
  }
  // fallback: manual with partial overrides
  if (part.stock_width_in != null && part.stock_length_in != null) {
    return { stockWidthIn: part.stock_width_in, stockLengthIn: part.stock_length_in }
  }
  return {
    stockWidthIn: part.stock_width_in ?? 3.5,
    stockLengthIn: part.stock_length_in ?? 96,
  }
}

function buildBoardLayout(
  pieces: CutPiece[],
  stockLengthIn: number,
  kerfIn: number
): BoardLayout {
  // Separate pieces that are too long
  const fittable = pieces.filter((p) => p.lengthIn <= stockLengthIn)
  const sorted = [...fittable].sort((a, b) => b.lengthIn - a.lengthIn)

  // Track remaining space per board
  const boardRemaining: number[] = []
  const boardPieces: Array<Array<{ piece: CutPiece; lengthIn: number }>> = []

  for (const piece of sorted) {
    let placed = false
    for (let i = 0; i < boardRemaining.length; i++) {
      const spaceNeeded = piece.lengthIn + (boardPieces[i].length > 0 ? kerfIn : 0)
      if (boardRemaining[i] >= spaceNeeded) {
        boardRemaining[i] -= spaceNeeded
        boardPieces[i].push({ piece, lengthIn: piece.lengthIn })
        placed = true
        break
      }
    }
    if (!placed) {
      boardRemaining.push(stockLengthIn - piece.lengthIn)
      boardPieces.push([{ piece, lengthIn: piece.lengthIn }])
    }
  }

  let totalPiece = 0
  let totalStock = 0

  const boards = boardPieces.map((cuts, idx) => {
    const wasteIn = boardRemaining[idx]
    const segments: Array<{ piece: CutPiece; lengthIn: number } | { type: 'waste'; lengthIn: number }> = [
      ...cuts,
    ]
    if (wasteIn > 0) segments.push({ type: 'waste', lengthIn: wasteIn })
    totalPiece += cuts.reduce((s, c) => s + c.lengthIn, 0)
    totalStock += stockLengthIn
    return { index: idx + 1, segments, wasteIn }
  })

  const wastePct = totalStock > 0 ? (totalStock - totalPiece) / totalStock : 0

  return {
    type: 'board',
    boards,
    boardsNeeded: boards.length,
    wastePct,
  }
}

function buildSheetLayout(
  pieces: CutPiece[],
  stockWidthIn: number,
  stockLengthIn: number,
  kerfIn: number
): SheetLayout {
  // Sort pieces: widest first so wide strips form first; longest first within same width.
  const sorted = [...pieces].sort((a, b) => {
    if (b.widthIn !== a.widthIn) return b.widthIn - a.widthIn
    return b.lengthIn - a.lengthIn
  })

  // Each strip is divided into "columns" — slots at fixed length-offsets.
  // Within a column, multiple pieces can be stacked side-by-side in the WIDTH dimension
  // (sub-rip packing), as long as their widths sum to ≤ the strip's rip width.
  // This lets e.g. 5 × 3.5" stretchers occupy the 18"-wide waste area after a 50" bottom.
  type Column = {
    startOffsetIn: number   // length-axis start of this column in the strip
    maxLengthIn: number     // longest piece length in this column
    usedWidthIn: number     // cumulative width consumed (pieces + inter-piece kerfs)
  }

  type StripInternal = {
    widthIn: number         // rip width (= widest piece in strip)
    columns: Column[]
    pieces: Array<{ piece: CutPiece; offsetIn: number; widthOffsetIn: number }>
    endIn: number           // length-axis end of the last column
  }

  const stripList: StripInternal[] = []

  for (const piece of sorted) {
    let placed = false

    for (const strip of stripList) {
      if (piece.widthIn > strip.widthIn) continue  // piece too wide for this rip

      // 1. Try to sub-rip into an existing column (same length offset, stacked by width).
      //    Only valid if the piece doesn't exceed the column's committed length.
      for (const col of strip.columns) {
        if (piece.lengthIn > col.maxLengthIn) continue
        const spaceNeeded = col.usedWidthIn > 0 ? kerfIn + piece.widthIn : piece.widthIn
        if (col.usedWidthIn + spaceNeeded <= strip.widthIn + 0.001) {
          const widthOffsetIn = col.usedWidthIn + (col.usedWidthIn > 0 ? kerfIn : 0)
          strip.pieces.push({ piece, offsetIn: col.startOffsetIn, widthOffsetIn })
          col.usedWidthIn += spaceNeeded
          placed = true
          break
        }
      }
      if (placed) break

      // 2. Try to start a new column at the end of the strip.
      const kerfBefore = strip.columns.length > 0 ? kerfIn : 0
      const newColStart = strip.endIn + kerfBefore
      if (newColStart + piece.lengthIn <= stockLengthIn + 0.001) {
        strip.columns.push({
          startOffsetIn: newColStart,
          maxLengthIn: piece.lengthIn,
          usedWidthIn: piece.widthIn,
        })
        strip.pieces.push({ piece, offsetIn: newColStart, widthOffsetIn: 0 })
        strip.endIn = newColStart + piece.lengthIn
        placed = true
        break
      }
    }

    if (!placed) {
      stripList.push({
        widthIn: piece.widthIn,
        columns: [{ startOffsetIn: 0, maxLengthIn: piece.lengthIn, usedWidthIn: piece.widthIn }],
        pieces: [{ piece, offsetIn: 0, widthOffsetIn: 0 }],
        endIn: piece.lengthIn,
      })
    }
  }

  // Convert internal strips to external format
  const allStrips = stripList.map(sd => ({
    widthIn: sd.widthIn,
    pieces: sd.pieces,
    wasteIn: stockLengthIn - sd.endIn,
  }))

  // FFD bin-pack strips into sheets (along stockWidthIn).
  type Sheet = {
    index: number
    strips: typeof allStrips
    widthUsed: number
    widthWaste: number
  }

  const sheets: Sheet[] = []

  for (const strip of allStrips) {
    let placed = false
    for (const sheet of sheets) {
      const spaceNeeded = strip.widthIn + (sheet.strips.length > 0 ? kerfIn : 0)
      if (sheet.widthWaste >= spaceNeeded) {
        sheet.widthUsed += spaceNeeded
        sheet.widthWaste -= spaceNeeded
        sheet.strips.push(strip)
        placed = true
        break
      }
    }
    if (!placed) {
      sheets.push({
        index: sheets.length + 1,
        strips: [strip],
        widthUsed: strip.widthIn,
        widthWaste: stockWidthIn - strip.widthIn,
      })
    }
  }

  // Compute waste
  let totalPiece = 0
  let totalStock = 0
  for (const sheet of sheets) {
    totalStock += stockWidthIn * stockLengthIn
    for (const strip of sheet.strips) {
      for (const { piece } of strip.pieces) {
        totalPiece += piece.widthIn * piece.lengthIn
      }
    }
  }
  const wastePct = totalStock > 0 ? (totalStock - totalPiece) / totalStock : 0

  return {
    type: 'sheet',
    sheets,
    sheetsNeeded: sheets.length,
    wastePct,
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function buildCutList(
  parts: CutPart[],
  lumberItems: LumberItem[],
  kerfIn: number
): StockGroup[] {
  const lumberMap = new Map<string, LumberItem>()
  for (const item of lumberItems) lumberMap.set(item.id, item)

  // Assign color indices per unique part.id
  const colorByPartId = new Map<string, number>()
  let colorCounter = 0

  // Group parts into stock groups
  const groupMap = new Map<
    string,
    {
      label: string
      stockWidthIn: number
      stockLengthIn: number
      pieces: CutPiece[]
    }
  >()

  for (const part of parts) {
    const lumberItem = part.lumber_item_id ? lumberMap.get(part.lumber_item_id) : undefined
    const { stockWidthIn, stockLengthIn } = getStockDims(part, lumberItem)

    let key: string
    let label: string
    if (part.lumber_item_id && lumberItem) {
      key = part.lumber_item_id
      label = lumberItem.species && lumberItem.species.trim()
        ? lumberItem.species
        : `${lumberItem.thickness_in}" × ${lumberItem.width_in}"`
    } else {
      key = `manual_${stockWidthIn}_${stockLengthIn}`
      label = `${stockWidthIn}" × ${stockLengthIn}"`
    }

    if (!groupMap.has(key)) {
      groupMap.set(key, { label, stockWidthIn, stockLengthIn, pieces: [] })
    }

    // Assign color per part.id
    if (!colorByPartId.has(part.id)) {
      colorByPartId.set(part.id, colorCounter++)
    }
    const colorIndex = colorByPartId.get(part.id)!

    // Expand by quantity
    for (let i = 0; i < part.quantity; i++) {
      groupMap.get(key)!.pieces.push({
        partId: part.id,
        label: part.label,
        widthIn: part.width_in,
        lengthIn: part.length_in,
        colorIndex,
      })
    }
  }

  const groups: StockGroup[] = []

  for (const [key, { label, stockWidthIn, stockLengthIn, pieces }] of groupMap) {
    const isSheet = stockWidthIn >= 24

    // Ripping is worthwhile when pieces are narrow enough that 2+ fit across the stock width
    const maxPieceWidth = pieces.length > 0 ? Math.max(...pieces.map((p) => p.widthIn)) : 0
    const hasRipping = !isSheet && pieces.length > 0 && maxPieceWidth * 2 + kerfIn <= stockWidthIn

    let layout: BoardLayout | SheetLayout
    if (isSheet || hasRipping) {
      layout = buildSheetLayout(pieces, stockWidthIn, stockLengthIn, kerfIn)
    } else {
      layout = buildBoardLayout(pieces, stockLengthIn, kerfIn)
    }

    groups.push({
      key,
      label,
      stockWidthIn,
      stockLengthIn,
      isSheet,
      hasRipping,
      pieces,
      layout,
    })
  }

  return groups
}
