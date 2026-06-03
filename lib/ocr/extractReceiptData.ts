export interface ReceiptExtraction {
  description?: string
  amount?: number
  taxAmount?: number
  receiptDate?: string  // YYYY-MM-DD
}

function parseReceiptText(text: string): ReceiptExtraction {
  const result: ReceiptExtraction = {}
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0)

  // ── Date ──────────────────────────────────────────────────────────────────
  // Prefer 4-digit year formats; ignore 2-digit years (ambiguous)
  const iso = text.match(/\b(\d{4})[\/\-](\d{2})[\/\-](\d{2})\b/)
  const us  = text.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/)
  const mon = text.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})\b/i)

  if (iso) {
    result.receiptDate = `${iso[1]}-${iso[2]}-${iso[3]}`
  } else if (us) {
    result.receiptDate = `${us[3]}-${us[1].padStart(2, '0')}-${us[2].padStart(2, '0')}`
  } else if (mon) {
    const MONTHS: Record<string, string> = {
      jan:'01', feb:'02', mar:'03', apr:'04', may:'05', jun:'06',
      jul:'07', aug:'08', sep:'09', oct:'10', nov:'11', dec:'12',
    }
    const mo = MONTHS[mon[1].toLowerCase().slice(0, 3)]
    result.receiptDate = `${mon[3]}-${mo}-${mon[2].padStart(2, '0')}`
  }

  // ── Amount helpers ────────────────────────────────────────────────────────
  // Require a literal decimal point — prevents bare integers like "2026" matching
  function allAmountsOnLine(line: string): number[] {
    return [...line.matchAll(/\$?\s*(\d{1,6}\.\d{2})\b/g)]
      .map(m => parseFloat(m[1]))
      .filter(n => !isNaN(n) && n > 0)
  }

  function lastAmountOnLine(line: string): number | null {
    const found = allAmountsOnLine(line)
    return found.length > 0 ? found[found.length - 1] : null
  }

  // ── Tax ───────────────────────────────────────────────────────────────────
  for (const line of lines) {
    if (/\b(sales[\s\-]?tax|tax|hst|gst|vat|pst)\b/i.test(line) && !/\bexempt\b/i.test(line)) {
      const amt = lastAmountOnLine(line)
      if (amt != null) { result.taxAmount = amt; break }
    }
  }

  // ── Total ─────────────────────────────────────────────────────────────────
  // Match "total" lines, excluding subtotal / item total / partial
  const totalLines = lines.filter(l =>
    /\btotal\b/i.test(l) && !/\b(sub[\s\-]?total|item\s+total|partial)\b/i.test(l)
  )
  // Take the last matching line (grand total is usually the last "total" line)
  for (const line of [...totalLines].reverse()) {
    const amt = lastAmountOnLine(line)
    if (amt != null) { result.amount = amt; break }
  }
  // No loose "largest amount" fallback — leave blank if nothing found

  // ── Description (merchant name heuristic) ─────────────────────────────────
  // Skip lines starting with digits (addresses, transaction IDs) and lines
  // with known non-merchant keywords; take the first one that looks like a name
  const skipPat = /^[\d#]|cashier|manager|store|sale|auth|receipt|policy|return|visa|mastercard|amex|debit|credit/i
  for (const line of lines.slice(0, 10)) {
    if (!skipPat.test(line) && !/\$?\d+\.\d{2}/.test(line) && line.length >= 3 && line.length <= 60) {
      result.description = line
      break
    }
  }

  return result
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise
  let text = ''

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()

    // Group text items by rounded y-coordinate to reconstruct visual lines.
    // PDF y-coords increase upward, so higher y = higher on page.
    const yGroups = new Map<number, Array<{ str: string; x: number }>>()
    for (const rawItem of content.items) {
      const item = rawItem as { str: string; transform: number[] }
      if (!item.str.trim()) continue
      const y = Math.round(item.transform[5])
      const x = item.transform[4]
      if (!yGroups.has(y)) yGroups.set(y, [])
      yGroups.get(y)!.push({ str: item.str, x })
    }

    const sortedLines = [...yGroups.entries()]
      .sort((a, b) => b[0] - a[0])                              // top → bottom
      .map(([, items]) =>
        items.sort((a, b) => a.x - b.x).map(i => i.str).join(' ').trim()
      )
      .filter(l => l.length > 0)

    text += sortedLines.join('\n') + '\n'
  }

  return text
}

export async function extractReceiptData(file: File): Promise<ReceiptExtraction> {
  try {
    let text = ''

    if (file.type === 'application/pdf') {
      text = await extractPdfText(file)
    } else {
      const { createWorker } = await import('tesseract.js')
      const worker = await createWorker('eng')
      const { data } = await worker.recognize(file)
      text = data.text
      await worker.terminate()
    }

    return parseReceiptText(text)
  } catch (err) {
    console.warn('OCR failed:', err)
    return {}
  }
}
