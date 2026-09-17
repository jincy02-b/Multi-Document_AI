import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PDFDocument, StandardFonts } from 'pdf-lib'

const samplesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../samples')

const licenceText = `HARBOUR CREDIT LICENCE EXTRACT (SYNTHETIC)
This document is synthetic sample data for an assessment. It is not a real licence.
Company name: Harbour Retail Pty Ltd
Applicant: Priya Raman
Address: 12 Harbour Street, Sydney NSW 2000
Licence number: ACL-198773
ABN: 84 221 009 331
Date: 2024-11-18
Revenue: AUD 1,020,000
Obligation: Licence conditions require annual compliance attestation
Reporting period: FY2024`

async function main() {
  await mkdir(samplesDir, { recursive: true })
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([612, 792])
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const lines = licenceText.split('\n')
  let y = 740
  for (const line of lines) {
    page.drawText(line, { x: 50, y, size: 11, font })
    y -= 16
  }
  const bytes = await pdf.save()
  await writeFile(path.join(samplesDir, 'harbour_credit_licence.pdf'), bytes)
  await writeFile(path.join(samplesDir, 'corrupt.pdf'), Buffer.from('%PDF-1.4 not a valid pdf file'))
  console.log('Wrote synthetic PDF samples to', samplesDir)
}

await main()
