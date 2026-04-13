import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

interface CasePdfInput {
  courtCase: {
    caseNumber: string
    title: string
    caseType: string
    status: string
    court: string
    judge?: string | null
    clientName: string
    clientEmail: string
    clientPhone?: string | null
    opposingParty?: string | null
    advocate?: string | null
    filingDate?: Date | null
    nextHearingDate?: Date | null
    description?: string | null
    payments: Array<{
      id: string
      amount: number
      mode: string
      reference?: string | null
      description?: string | null
      paymentDate: Date
    }>
  }
  firmName: string
  advocateName: string
  includePayments: boolean
}

function fmtDate(d: Date | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })
}

function fmtCurrency(n: number): string {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export async function generateCasePdf(input: CasePdfInput): Promise<string> {
  const { courtCase, firmName, advocateName, includePayments } = input

  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842]) // A4
  const { width, height } = page.getSize()

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica)

  const gold = rgb(0.831, 0.659, 0.325)
  const dark = rgb(0.102, 0.071, 0.031)
  const gray = rgb(0.55, 0.478, 0.333)
  const lightGray = rgb(0.9, 0.886, 0.863)
  const white = rgb(1, 1, 1)

  // Header background
  page.drawRectangle({ x: 0, y: height - 90, width, height: 90, color: dark })

  // Firm name
  page.drawText(firmName, {
    x: 40, y: height - 40,
    size: 18, font: fontBold, color: gold,
  })
  // Advocate
  page.drawText(advocateName, {
    x: 40, y: height - 60,
    size: 11, font: fontReg, color: white,
  })
  // Doc type
  const docTitle = includePayments ? 'PAYMENT RECEIPT' : 'CASE DETAILS REPORT'
  page.drawText(docTitle, {
    x: width - 40 - fontBold.widthOfTextAtSize(docTitle, 12),
    y: height - 45,
    size: 12, font: fontBold, color: gold,
  })
  const genDate = `Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
  page.drawText(genDate, {
    x: width - 40 - fontReg.widthOfTextAtSize(genDate, 9),
    y: height - 62,
    size: 9, font: fontReg, color: white,
  })

  let y = height - 110

  // Section helper
  const sectionHeader = (title: string) => {
    page.drawRectangle({ x: 40, y: y - 4, width: width - 80, height: 20, color: lightGray })
    page.drawText(title, { x: 44, y, size: 10, font: fontBold, color: dark })
    y -= 24
  }

  const row = (label: string, value: string) => {
    page.drawText(label + ':', { x: 44, y, size: 9, font: fontBold, color: gray })
    page.drawText(value, { x: 180, y, size: 9, font: fontReg, color: dark })
    y -= 16
  }

  // Case Details
  sectionHeader('CASE INFORMATION')
  row('Case Number', courtCase.caseNumber)
  row('Title', courtCase.title)
  row('Case Type', courtCase.caseType)
  row('Status', courtCase.status)
  row('Court', courtCase.court)
  if (courtCase.judge) row('Judge', courtCase.judge)
  row('Filing Date', fmtDate(courtCase.filingDate))
  row('Next Hearing', fmtDate(courtCase.nextHearingDate))
  if (courtCase.opposingParty) row('Opposing Party', courtCase.opposingParty)
  if (courtCase.advocate) row('Advocate', courtCase.advocate)
  y -= 8

  // Client Info
  sectionHeader('CLIENT INFORMATION')
  row('Name', courtCase.clientName)
  row('Email', courtCase.clientEmail)
  if (courtCase.clientPhone) row('Phone', courtCase.clientPhone)
  y -= 8

  // Description
  if (courtCase.description && !includePayments) {
    sectionHeader('CASE SUMMARY')
    // Word-wrap description
    const words = courtCase.description.split(' ')
    let line = ''
    const maxW = 400
    for (const word of words) {
      const test = line ? line + ' ' + word : word
      if (fontReg.widthOfTextAtSize(test, 9) > maxW) {
        page.drawText(line, { x: 44, y, size: 9, font: fontReg, color: dark })
        y -= 14
        line = word
      } else {
        line = test
      }
    }
    if (line) {
      page.drawText(line, { x: 44, y, size: 9, font: fontReg, color: dark })
      y -= 14
    }
    y -= 8
  }

  // Payments section
  if (includePayments && courtCase.payments.length > 0) {
    sectionHeader('PAYMENT RECORDS')

    // Table header
    page.drawRectangle({ x: 40, y: y - 4, width: width - 80, height: 16, color: dark })
    page.drawText('Date', { x: 44, y, size: 8, font: fontBold, color: white })
    page.drawText('Mode', { x: 140, y, size: 8, font: fontBold, color: white })
    page.drawText('Reference', { x: 220, y, size: 8, font: fontBold, color: white })
    page.drawText('Description', { x: 330, y, size: 8, font: fontBold, color: white })
    page.drawText('Amount', { x: 480, y, size: 8, font: fontBold, color: white })
    y -= 18

    let total = 0
    for (const p of courtCase.payments) {
      total += p.amount
      page.drawText(fmtDate(p.paymentDate), { x: 44, y, size: 8, font: fontReg, color: dark })
      page.drawText(p.mode, { x: 140, y, size: 8, font: fontReg, color: dark })
      page.drawText(p.reference || '—', { x: 220, y, size: 8, font: fontReg, color: dark })
      page.drawText((p.description || '—').substring(0, 20), { x: 330, y, size: 8, font: fontReg, color: dark })
      const amtStr = fmtCurrency(p.amount)
      page.drawText(amtStr, { x: 480, y, size: 8, font: fontReg, color: dark })
      y -= 14
    }

    // Total
    y -= 4
    page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.5, color: gray })
    y -= 14
    page.drawText('TOTAL FEES PAID:', { x: 44, y, size: 10, font: fontBold, color: dark })
    page.drawText(fmtCurrency(total), { x: 480, y, size: 10, font: fontBold, color: gold })
    y -= 20
  }

  // Footer
  page.drawLine({ start: { x: 40, y: 50 }, end: { x: width - 40, y: 50 }, thickness: 0.5, color: lightGray })
  page.drawText('This is a computer-generated document. No signature required.', {
    x: 40, y: 34, size: 8, font: fontReg, color: gray,
  })
  page.drawText(firmName, {
    x: width - 40 - fontBold.widthOfTextAtSize(firmName, 8),
    y: 34, size: 8, font: fontBold, color: gray,
  })

  const pdfBytes = await pdfDoc.saveAsBase64({ dataUri: false })
  return pdfBytes
}
