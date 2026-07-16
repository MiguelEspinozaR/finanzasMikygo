import { createWorker } from 'tesseract.js'

export interface OcrReceiptData {
  monto: number | null
  fechaPago: string | null
  fechasTrabajo: string[]
  referencia: string | null
  rawText: string
}

const MONTH_MAP: Record<string, number> = {
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
  julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
}

function parseMonto(text: string): number | null {
  const patterns = [
    /Se acredit[oó]\s+la suma de BS::\s*([\d.,]+)/i,
    /Se debit[oó]\s+la suma de BS::\s*([\d.,]+)/i,
    /Bs\.?\s*([\d.,]+)/i,
    /([\d.,]+)\s*Bs/i,
  ]
  for (const pat of patterns) {
    const m = text.match(pat)
    if (m) {
      const raw = m[1].replace(',', '.')
      const num = parseFloat(raw)
      if (!isNaN(num) && num > 0) return num
    }
  }
  return null
}

function parseFechaPago(text: string): string | null {
  const patterns = [
    /Fecha de la Transacci[oó]n:\s*(\d{2})[\/\-](\d{2})[\/\-](\d{4})/i,
    /Fecha[:\s]*(\d{2})[\/\-](\d{2})[\/\-](\d{4})/i,
    /(\d{2})[\/\-](\d{2})[\/\-](\d{4})/,
  ]
  for (const pat of patterns) {
    const m = text.match(pat)
    if (m) {
      const [, dd, mm, yyyy] = m
      const date = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd))
      if (!isNaN(date.getTime())) {
        return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
      }
    }
  }
  return null
}

function parseFechasTrabajo(text: string, fallbackYear: number, fallbackMonth: number): string[] {
  console.log('[OCR] parseFechasTrabajo input text:', text)

  const monthNames = Object.keys(MONTH_MAP)
  const monthRegex = monthNames.join('|')
  const monthCapture = `(${monthRegex})`

  const rangePattern = new RegExp(
    `(\\d{1,2})\\s*(?:al|-|hasta)\\s*(\\d{1,2})\\s*${monthCapture}`,
    'i'
  )
  const rangeMatch = text.match(rangePattern)
  console.log('[OCR] rangePattern match on full text:', rangeMatch)
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1])
    const end = parseInt(rangeMatch[2])
    const monthName = rangeMatch[3].toLowerCase()
    const month = MONTH_MAP[monthName] ?? fallbackMonth
    const year = fallbackYear
    const dates: string[] = []
    for (let d = start; d <= end; d++) {
      const dt = new Date(year, month, d)
      if (!isNaN(dt.getTime())) {
        dates.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
      }
    }
    console.log('[OCR] rangePattern dates:', dates)
    if (dates.length > 0) return dates
  }

  const listPattern = new RegExp(
    `(\\d{1,2})(?:\\s*,\\s*|\\s+y\\s+)*(\\d{0,2})\\s*${monthCapture}`,
    'i'
  )
  const listMatch = text.match(listPattern)
  console.log('[OCR] listPattern match:', listMatch)
  if (listMatch) {
    const monthName = listMatch[3].toLowerCase()
    const month = MONTH_MAP[monthName] ?? fallbackMonth
    const year = fallbackYear
    const days: number[] = [parseInt(listMatch[1])]
    if (listMatch[2]) days.push(parseInt(listMatch[2]))
    const commaMatches = text.match(/(\d{1,2})\s*,/g)
    if (commaMatches) {
      for (const cm of commaMatches) {
        const num = parseInt(cm)
        if (!days.includes(num)) days.push(num)
      }
    }
    days.sort((a, b) => a - b)
    const dates: string[] = []
    for (const d of days) {
      const dt = new Date(year, month, d)
      if (!isNaN(dt.getTime())) {
        dates.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
      }
    }
    console.log('[OCR] listPattern dates:', dates)
    if (dates.length > 0) return dates
  }

  const singlePattern = new RegExp(`(\\d{1,2})\\s+de\\s*${monthCapture}`, 'i')
  const singleMatch = text.match(singlePattern)
  console.log('[OCR] singlePattern match:', singleMatch)
  if (singleMatch) {
    const day = parseInt(singleMatch[1])
    const monthName = singleMatch[2].toLowerCase()
    const month = MONTH_MAP[monthName] ?? fallbackMonth
    const dt = new Date(fallbackYear, month, day)
    if (!isNaN(dt.getTime())) {
      return [`${fallbackYear}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`]
    }
  }

  console.log('[OCR] parseFechasTrabajo: no dates found')
  return []
}

export function parseReceipt(rawText: string): OcrReceiptData {
  console.log('[OCR] rawText:', rawText)
  const text = rawText.replace(/\n/g, ' ').replace(/\s{2,}/g, ' ')
  console.log('[OCR] normalized text:', text)

  const monto = parseMonto(text)
  const fechaPago = parseFechaPago(text)

  let fallbackYear = new Date().getFullYear()
  let fallbackMonth = new Date().getMonth()
  if (fechaPago) {
    const [y, m] = fechaPago.split('-')
    fallbackYear = parseInt(y)
    fallbackMonth = parseInt(m) - 1
  }

  console.log('[OCR] monto:', monto, 'fechaPago:', fechaPago, 'fallbackYear:', fallbackYear, 'fallbackMonth:', fallbackMonth)

  const fechasTrabajo = parseFechasTrabajo(text, fallbackYear, fallbackMonth)

  const refMatch = text.match(/Referencia:\s*(.+?)(?:\s+Fecha|\s+Hora|\s+Se |\s+Monto|\s+Su\s|$)/i)
  console.log('[OCR] refMatch:', refMatch)

  const result = {
    monto,
    fechaPago,
    fechasTrabajo,
    referencia: refMatch ? refMatch[1].trim() : null,
    rawText,
  }
  console.log('[OCR] parseReceipt result:', result)
  return result
}

export async function recognizeReceipt(
  imageUrl: string,
  onProgress?: (progress: number) => void
): Promise<OcrReceiptData> {
  const worker = await createWorker('spa', undefined, {
    logger: (m) => {
      if (onProgress && m.progress) {
        onProgress(Math.round(m.progress * 100))
      }
    },
  })

  try {
    const { data } = await worker.recognize(imageUrl)
    return parseReceipt(data.text)
  } finally {
    await worker.terminate()
  }
}
