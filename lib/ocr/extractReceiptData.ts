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

  // ── Helpers ───────────────────────────────────────────────────────────────
  function lastAmountOnLine(line: string): number | null {
    const matches = [...line.matchAll(/\$?\s*(\d{1,5}[,.]?\d{2})\b/g)]
      .map(m => parseFloat(m[1].replace(',', '')))
      .filter(n => !isNaN(n) && n > 0)
    return matches.length > 0 ? matches[matches.length - 1] : null
  }

  // ── Tax ───────────────────────────────────────────────────────────────────
  for (const line of lines) {
    if (/\b(sales[\s\-]?tax|tax|hst|gst|vat|pst)\b/i.test(line) && !/\bexempt\b/i.test(line)) {
      const amt = lastAmountOnLine(line)
      if (amt != null) { result.taxAmount = amt; break }
    }
  }

  // ── Total ─────────────────────────────────────────────────────────────────
  // Prefer lines that say "total" but not "sub-total", take the last (grand total) match
  const totalLines = lines.filter(l =>
    /\btotal\b/i.test(l) && !/\b(sub[\s\-]?total|item\s+total|partial)\b/i.test(l)
  )
  for (const line of [...totalLines].reverse()) {
    const amt = lastAmountOnLine(line)
    if (amt != null) { result.amount = amt; break }
  }
  // Fallback: largest dollar-sign amount in the whole text
  if (result.amount == null) {
    const all = [...text.matchAll(/\$\s*(\d{1,5}\.\d{2})\b/g)]
      .map(m => parseFloat(m[1])).filter(n => !isNaN(n))
    if (all.length > 0) result.amount = Math.max(...all)
  }

  // ── Description (merchant name heuristic) ─────────────────────────────────
  // Use the first short line that doesn't look like an amount
  for (const line of lines.slice(0, 6)) {
    if (!/\$?\d+\.\d{2}/.test(line) && line.length >= 3 && line.length <= 80) {
      result.description = line
      break
    }
  }

  return result
}

export async function extractReceiptData(file: File): Promise<ReceiptExtraction> {
  try {
    let text = ''

    if (file.type === 'application/pdf') {
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
      const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        text += content.items.map((item: unknown) => (item as { str: string }).str).join(' ') + '\n'
      }
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
