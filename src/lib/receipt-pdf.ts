import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { buildUpiUrl, buildUpiQrPng, getPaymentConfig } from './payments'

export type ReceiptItem = { description: string; qty: number; rate: number; amount: number }

export type ReceiptData = {
  id?: string
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
  paymentMethod?: string | null
  tenantId?: string | null
  caseId?: string | null
  caseNumber?: string | null
  caseTitle?: string | null
  createdAt: Date | string
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  UPI: 'UPI',
  NEFT: 'NEFT / Bank transfer',
  CASH: 'Cash',
  OTHER: 'Other',
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
  y -= 16

  // Case reference (when the receipt is linked to a CourtCase).
  if (data.caseNumber || data.caseTitle) {
    text('Case', 40, y, 9, bold, gray)
    if (data.caseNumber) {
      text(data.caseNumber, 80, y, 9, bold, navy)
    }
    y -= 13
    if (data.caseTitle) {
      // Truncate to one line so wide titles don't overflow into the items
      // table below.
      text(data.caseTitle.slice(0, 80), 40, y, 9, font, gray)
      y -= 14
    }
  }

  y -= 14

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
  y -= 30

  const pmKey = (data.paymentMethod || 'OTHER').toUpperCase()
  const pmLabel = PAYMENT_METHOD_LABELS[pmKey] || PAYMENT_METHOD_LABELS.OTHER
  text('Payment method', 40, y, 9, bold, gray)
  text(pmLabel, 140, y, 10, bold, navy)
  y -= 30

  // ─── Per-tenant payment details ────────────────────────────────────────
  // UPI → QR + VPA. NEFT → bank line. Each receipt only shows the tenant's
  // own credentials; we never leak another firm's bank info.
  if (data.tenantId) {
    try {
      const cfg = await getPaymentConfig(data.tenantId)
      if (pmKey === 'UPI' && cfg.upiVpa) {
        const url = buildUpiUrl({
          vpa: cfg.upiVpa,
          payeeName: cfg.upiName,
          amount: data.total,
          referenceId: data.number,
          note: `Receipt ${data.number}`,
          currency: data.currency,
        })
        const qrPng = await buildUpiQrPng(url).catch(() => null)
        if (qrPng) {
          const qrImage = await pdf.embedPng(qrPng)
          const qrSize = 110
          page.drawImage(qrImage, { x: 40, y: y - qrSize, width: qrSize, height: qrSize })
          text('Scan to pay with any UPI app', 160, y - 12, 9, bold, navy)
          text(`UPI ID: ${cfg.upiVpa}`, 160, y - 28, 10, font, navy)
          if (cfg.upiName) text(`Payee: ${cfg.upiName}`, 160, y - 42, 9, font, gray)
          text(`Amount: ${money(data.total, data.currency)}`, 160, y - 58, 9, font, gray)
          text(`Reference: ${data.number}`, 160, y - 72, 9, font, gray)
          y -= qrSize + 12
        } else {
          // QR lib missing — fall back to plain text UPI line.
          text('Pay via UPI', 40, y, 9, bold, gray);                       y -= 14
          text(`UPI ID: ${cfg.upiVpa}`, 40, y, 10);                        y -= 13
          if (cfg.upiName) { text(`Payee: ${cfg.upiName}`, 40, y, 9);     y -= 13 }
          text(`Reference: ${data.number}`, 40, y, 9, font, gray);        y -= 13
        }
      } else if (pmKey === 'NEFT' && cfg.bankAccountNumber) {
        text('Bank transfer details', 40, y, 9, bold, gray)
        y -= 14
        if (cfg.bankAccountHolder) { text(`Account name: ${cfg.bankAccountHolder}`, 40, y, 10); y -= 13 }
        if (cfg.bankName)          { text(`Bank: ${cfg.bankName}`, 40, y, 10);                   y -= 13 }
                                     text(`A/C: ${cfg.bankAccountNumber}`, 40, y, 10);          y -= 13
        if (cfg.bankIfsc)          { text(`IFSC: ${cfg.bankIfsc}`, 40, y, 10);                   y -= 13 }
        y -= 6
      }
    } catch (e) {
      // Non-fatal — receipt still renders without payment block.
      console.warn('[receipt-pdf] payment block skipped:', (e as any)?.message)
    }
  }

  if (data.id && data.tenantId) {
    const base = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || '').replace(/\/$/, '')
    const tenant = await (await import('./prisma')).prisma.tenant.findUnique({ where: { id: data.tenantId }, select: { slug: true } }).catch(() => null)
    if (base && tenant?.slug) {
      const proofUrl = `${base}/team/${tenant.slug}/payment-done/${data.id}`
      text('Submit UTR / transaction number and payment screenshot:', 40, y, 9, bold, gray)
      y -= 14
      text(proofUrl.slice(0, 95), 40, y, 8, font, navy)
      y -= 22
    }
  }

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
