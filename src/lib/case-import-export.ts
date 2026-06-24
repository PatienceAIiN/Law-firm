import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export type CaseExportRow = {
  caseNumber: string
  title: string
  caseType: string
  status: string
  court: string
  clientName: string
  clientEmail?: string | null
  clientPhone?: string | null
  advocateName?: string | null
  nextHearingDate?: Date | string | null
}

const HEADERS = ['Case Number', 'Title', 'Type', 'Status', 'Court', 'Client Name', 'Client Email', 'Client Phone', 'Lawyer', 'Next Hearing']

function cell(value: unknown) {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function casesToExcelXml(rows: CaseExportRow[]) {
  const body = rows.map((r) => [
    r.caseNumber, r.title, r.caseType, r.status, r.court, r.clientName, r.clientEmail, r.clientPhone, r.advocateName, r.nextHearingDate,
  ])
  const tableRows = [HEADERS, ...body].map((row) => `<Row>${row.map((v) => `<Cell><Data ss:Type="String">${cell(v)}</Data></Cell>`).join('')}</Row>`).join('')
  return `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Cases"><Table>${tableRows}</Table></Worksheet></Workbook>`
}

export async function casesToPdf(rows: CaseExportRow[], title = 'Cases Export') {
  const pdf = await PDFDocument.create()
  let page = pdf.addPage([842, 595])
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const black = rgb(0, 0, 0)
  const gray = rgb(0.35, 0.35, 0.35)
  let y = 555
  page.drawText(title, { x: 36, y, size: 16, font: bold, color: black })
  y -= 26
  page.drawText(['Case #', 'Title', 'Status', 'Court', 'Client', 'Lawyer', 'Next'].join('   '), { x: 36, y, size: 8, font: bold, color: black })
  y -= 14
  for (const r of rows) {
    if (y < 36) {
      page = pdf.addPage([842, 595])
      y = 555
    }
    const line = [r.caseNumber, r.title, r.status, r.court, r.clientName, r.advocateName || '-', cell(r.nextHearingDate) || '-']
      .map((v) => String(v || '').slice(0, 22)).join('   ')
    page.drawText(line, { x: 36, y, size: 8, font, color: gray })
    y -= 13
  }
  return pdf.save()
}

export function parseCaseCsv(text: string) {
  if (/<(Workbook|Worksheet|Row|Cell)[\s>]/i.test(text)) {
    const rows = Array.from(text.matchAll(/<Row[^>]*>([\s\S]*?)<\/Row>/gi)).map((m) =>
      Array.from(m[1].matchAll(/<Data[^>]*>([\s\S]*?)<\/Data>/gi)).map((c) => c[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim()),
    )
    if (rows.length < 2) return []
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    return parseCaseCsv(csv)
  }
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []
  const parseLine = (line: string) => {
    const out: string[] = []
    let cur = ''
    let q = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; continue }
      if (ch === '"') { q = !q; continue }
      if (ch === ',' && !q) { out.push(cur.trim()); cur = ''; continue }
      cur += ch
    }
    out.push(cur.trim())
    return out
  }
  const header = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''))
  const idx = (names: string[]) => names.map((n) => header.indexOf(n)).find((i) => i >= 0) ?? -1
  const cols = {
    caseNumber: idx(['casenumber', 'case']), title: idx(['title', 'casetitle']), caseType: idx(['type', 'casetype']), status: idx(['status']), court: idx(['court']),
    clientName: idx(['clientname', 'client']), clientEmail: idx(['clientemail', 'email']), clientPhone: idx(['clientphone', 'phone']), nextHearingDate: idx(['nexthearing', 'nexthearingdate']),
  }
  return lines.slice(1).map(parseLine).map((row) => ({
    caseNumber: row[cols.caseNumber] || '', title: row[cols.title] || '', caseType: row[cols.caseType] || 'Civil', status: row[cols.status] || 'ACTIVE', court: row[cols.court] || '',
    clientName: row[cols.clientName] || '', clientEmail: row[cols.clientEmail] || '', clientPhone: row[cols.clientPhone] || '', nextHearingDate: row[cols.nextHearingDate] || '',
  })).filter((r) => r.caseNumber && r.title && r.court && r.clientName)
}
