import type { CutPart } from '@/types/bom'

export interface CutPiece {
  itemId: string        // source CutPart.id
  label: string         // part label for display on board diagram
  thickness_in: number
  width_in: number
  lengthFt: number
  colorIndex: number    // index into a color palette, assigned per T+W group
}

export interface BoardCut {
  piece: CutPiece
  startFt: number
  endFt: number
}

export interface StockBoard {
  boardIndex: number    // 1-based
  cuts: BoardCut[]
  usedFt: number        // sum of piece lengths + kerfs
  wasteFt: number       // stockLengthFt - usedFt
}

export interface CutGroup {
  key: string           // e.g. "0.75_3.5"
  dimensionLabel: string // e.g. "0.75\" × 3.5\""
  thickness_in: number
  width_in: number
  boards: StockBoard[]
  totalPieceFt: number  // sum of all piece lengths (no kerf, no waste)
  totalStockFt: number  // boards.length × stockLengthFt
  wastePct: number      // (totalStockFt - totalPieceFt) / totalStockFt
  tooLong: CutPiece[]   // pieces that exceed stockLengthFt
}

export function buildCutList(
  parts: CutPart[],
  stockLengthFt: number,  // e.g. 8
  kerfIn: number          // e.g. 0.125 (1/8")
): CutGroup[] {
  const kerfFt = kerfIn / 12

  // Expand each CutPart into quantity individual CutPiece objects
  const allPieces: CutPiece[] = []
  for (const part of parts) {
    const lengthFt = part.length_in / 12
    for (let i = 0; i < part.quantity; i++) {
      allPieces.push({
        itemId: part.id,
        label: part.label,
        thickness_in: part.thickness_in,
        width_in: part.width_in,
        lengthFt,
        colorIndex: 0, // assigned below
      })
    }
  }

  // Group pieces by thickness + width, assign colorIndex
  const groupMap = new Map<string, CutPiece[]>()
  let colorCounter = 0
  const colorByKey = new Map<string, number>()

  for (const piece of allPieces) {
    const key = `${piece.thickness_in}_${piece.width_in}`
    if (!colorByKey.has(key)) {
      colorByKey.set(key, colorCounter++)
    }
    piece.colorIndex = colorByKey.get(key)!
    if (!groupMap.has(key)) {
      groupMap.set(key, [])
    }
    groupMap.get(key)!.push(piece)
  }

  const groups: CutGroup[] = []

  for (const [key, pieces] of groupMap) {
    const first = pieces[0]

    // Separate pieces that exceed stockLengthFt
    const tooLong: CutPiece[] = []
    const fittable: CutPiece[] = []
    for (const piece of pieces) {
      if (piece.lengthFt > stockLengthFt) {
        tooLong.push(piece)
      } else {
        fittable.push(piece)
      }
    }

    // First Fit Decreasing — sort remaining pieces by lengthFt descending
    fittable.sort((a, b) => b.lengthFt - a.lengthFt)

    const boards: StockBoard[] = []

    for (const piece of fittable) {
      let placed = false

      for (const board of boards) {
        const spaceNeeded =
          piece.lengthFt + (board.cuts.length > 0 ? kerfFt : 0)
        if (board.wasteFt >= spaceNeeded) {
          const startFt =
            board.usedFt + (board.cuts.length > 0 ? kerfFt : 0)
          const endFt = startFt + piece.lengthFt
          board.cuts.push({ piece, startFt, endFt })
          board.usedFt += spaceNeeded
          board.wasteFt = stockLengthFt - board.usedFt
          placed = true
          break
        }
      }

      if (!placed) {
        const newBoard: StockBoard = {
          boardIndex: boards.length + 1,
          cuts: [],
          usedFt: 0,
          wasteFt: stockLengthFt,
        }
        newBoard.cuts.push({ piece, startFt: 0, endFt: piece.lengthFt })
        newBoard.usedFt = piece.lengthFt
        newBoard.wasteFt = stockLengthFt - piece.lengthFt
        boards.push(newBoard)
      }
    }

    // Compute totals
    const totalPieceFt = fittable.reduce((sum, p) => sum + p.lengthFt, 0)
    const totalStockFt = boards.length * stockLengthFt
    const wastePct =
      totalStockFt > 0 ? (totalStockFt - totalPieceFt) / totalStockFt : 0

    const dimensionLabel = `${first.thickness_in}" × ${first.width_in}"`

    groups.push({
      key,
      dimensionLabel,
      thickness_in: first.thickness_in,
      width_in: first.width_in,
      boards,
      totalPieceFt,
      totalStockFt,
      wastePct,
      tooLong,
    })
  }

  // Sort by thickness, then width
  groups.sort((a, b) => {
    if (a.thickness_in !== b.thickness_in) return a.thickness_in - b.thickness_in
    return a.width_in - b.width_in
  })

  return groups
}
