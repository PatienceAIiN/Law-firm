import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export type ReceiptItem = { description: string; qty: number; rate: number; amount: number }

export type ReceiptData = {
  number: string
  clientName: string
  clientEmail: string
  createdByName: string
  items: ReceiptItem[]
  currency: string
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  notes?: string | null
  createdAt: Date | string
}

const FIRM_NAME = process.env.BREVO_SENDER_NAME || 'Law Firm'

function money(v: number, currency: string) {
  const symbol = currency === 'INR' ? 'Rs. ' : currency === 'USD' ? '$' : `${currency} `
  return `${symbol}${v.toFixed(2)}`
}

export async function generateReceiptPdf(data: ReceiptData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([595, 842]) // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const navy = rgb(0.04, 0.1, 0.18)
  const gold = rgb(0.77, 0.63, 0.35)
  const gray = rgb(0.4, 0.4, 0.4)
  let y = 800

  const text = (t: string, x: number, yy: number, size = 10, f = font, color = rgb(0, 0, 0)) =>
    page.drawText(t, { x, y: yy, size, font: f, color })

  // Header
  page.drawRectangle({ x: 0, y: 792, width: 595, height: 50, color: navy })
  text(FIRM_NAME, 40, 810, 18, bold, rgb(1, 1, 1))
  text('PAYMENT RECEIPT', 420, 810, 12, bold, gold)

  y = 760
  text(`Receipt No: ${data.number}`, 40, y, 10, bold)
  text(`Date: ${new Date(data.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 400, y, 10)
  y -= 30

  text('Billed To', 40, y, 9, bold, gray)
  y -= 16
  text(data.clientName, 40, y, 11, bold)
  y -= 14
  text(data.clientEmail, 40, y, 10, font, gray)
  y -= 30

  // Table header
  page.drawRectangle({ x: 40, y: y - 4, width: 515, height: 22, color: rgb(0.96, 0.95, 0.92) })
  text('Description', 48, y + 2, 9, bold, navy)
  text('Qty', 360, y + 2, 9, bold, navy)
  text('Rate', 420, y + 2, 9, bold, navy)
  text('Amount', 500, y + 2, 9, bold, navy)
  y -= 24

  for (const it of data.items) {
    text(it.description.slice(0, 60), 48, y, 10)
    text(String(it.qty), 360, y, 10)
    text(money(it.rate, data.currency), 420, y, 10)
    text(money(it.amount, data.currency), 490, y, 10)
    y -= 20
    page.drawLine({ start: { x: 40, y: y + 6 }, end: { x: 555, y: y + 6 }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) })
  }

  y -= 10
  text('Subtotal', 420, y, 10, font, gray)
  text(money(data.subtotal, data.currency), 490, y, 10)
  y -= 18
  text(`Tax (${data.taxRate}%)`, 420, y, 10, font, gray)
  text(money(data.taxAmount, data.currency), 490, y, 10)
  y -= 22
  page.drawRectangle({ x: 360, y: y - 6, width: 195, height: 24, color: navy })
  text('TOTAL', 372, y, 11, bold, rgb(1, 1, 1))
  text(money(data.total, data.currency), 478, y, 11, bold, gold)
  y -= 50

  if (data.notes) {
    text('Notes', 40, y, 9, bold, gray)
    y -= 14
    text(data.notes.slice(0, 90), 40, y, 9, font, gray)
    y -= 30
  }

  text(`Issued by: ${data.createdByName}`, 40, 70, 9, font, gray)
  text('This is a computer-generated receipt.', 40, 56, 8, font, gray)

  return pdf.save()
}
