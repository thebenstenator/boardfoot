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
      pieces: Array<{ piece: CutPiece; offsetIn: number }>
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
  // Group by widthIn (strip rip width)
  const widthGroups = new Map<number, CutPiece[]>()
  for (const piece of pieces) {
    if (!widthGroups.has(piece.widthIn)) widthGroups.set(piece.widthIn, [])
    widthGroups.get(piece.widthIn)!.push(piece)
  }

  // Sort width groups descending (widest strips first)
  const sortedWidths = [...widthGroups.keys()].sort((a, b) => b - a)

  // Each strip: rip once along widthIn, cut pieces along stockLengthIn
  type Strip = {
    widthIn: number
    pieces: Array<{ piece: CutPiece; offsetIn: number }>
    wasteIn: number
  }

  const allStrips: Strip[] = []
  for (const w of sortedWidths) {
    const piecesForWidth = [...widthGroups.get(w)!].sort((a, b) => b.lengthIn - a.lengthIn)
    // Pack into strips of stockLengthIn
    let currentStrip: Strip = { widthIn: w, pieces: [], wasteIn: stockLengthIn }
    for (const piece of piecesForWidth) {
      const spaceNeeded = piece.lengthIn + (currentStrip.pieces.length > 0 ? kerfIn : 0)
      if (currentStrip.wasteIn >= spaceNeeded) {
        const offset = stockLengthIn - currentStrip.wasteIn + (currentStrip.pieces.length > 0 ? kerfIn : 0)
        currentStrip.pieces.push({ piece, offsetIn: offset })
        currentStrip.wasteIn -= spaceNeeded
      } else {
        allStrips.push(currentStrip)
        const offset = 0
        currentStrip = {
          widthIn: w,
          pieces: [{ piece, offsetIn: offset }],
          wasteIn: stockLengthIn - piece.lengthIn,
        }
      }
    }
    allStrips.push(currentStrip)
  }

  // Bin-pack strips into sheets (along stockWidthIn)
  type Sheet = {
    index: number
    strips: Strip[]
    widthUsed: number
    widthWaste: number
  }

  const sheets: Sheet[] = []
  let currentSheet: Sheet = { index: 1, strips: [], widthUsed: 0, widthWaste: stockWidthIn }

  for (const strip of allStrips) {
    const spaceNeeded = strip.widthIn + (currentSheet.strips.length > 0 ? kerfIn : 0)
    if (currentSheet.widthWaste >= spaceNeeded) {
      currentSheet.widthUsed += spaceNeeded
      currentSheet.widthWaste -= spaceNeeded
      currentSheet.strips.push(strip)
    } else {
      sheets.push(currentSheet)
      currentSheet = {
        index: sheets.length + 1,
        strips: [strip],
        widthUsed: strip.widthIn,
        widthWaste: stockWidthIn - strip.widthIn,
      }
    }
  }
  if (currentSheet.strips.length > 0) sheets.push(currentSheet)

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

    let layout: BoardLayout | SheetLayout
    if (isSheet) {
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
      pieces,
      layout,
    })
  }

  return groups
}
