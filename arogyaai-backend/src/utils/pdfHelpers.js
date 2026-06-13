// PDF formatting utilities and constants

export const PDF_CONFIG = {
  margins: {
    top: 50,
    right: 50,
    bottom: 50,
    left: 50
  },
  colors: {
    primary: '#1F2937',      // Dark gray
    secondary: '#6B7280',    // Medium gray
    accent: '#059669',       // Green
    border: '#D1D5DB',       // Light gray
    text: '#111827',         // Black
    lightText: '#6B7280',    // Gray text
    background: '#F9FAFB'   // Off-white
  },
  fonts: {
    headerSize: 22,
    titleSize: 16,
    subtitleSize: 13,
    bodySize: 11,
    smallSize: 9
  },
  spacing: {
    section: 1,
    paragraph: 0.5,
    line: 0.3
  }
}

/**
 * Add PDF header with logo/title
 */
export function addPDFHeader(doc) {
  doc
    .fontSize(PDF_CONFIG.fonts.headerSize)
    .font('Helvetica-Bold')
    .fillColor(PDF_CONFIG.colors.primary)
    .text('ArogyaAI', { align: 'center' })

  doc.moveDown(0.3)

  doc
    .fontSize(PDF_CONFIG.fonts.subtitleSize)
    .font('Helvetica')
    .fillColor(PDF_CONFIG.colors.secondary)
    .text('Health & Wellness Intelligence', { align: 'center' })

  doc.moveDown(0.5)

  // Horizontal line
  doc
    .moveTo(PDF_CONFIG.margins.left, doc.y)
    .lineTo(550, doc.y)
    .strokeColor(PDF_CONFIG.colors.border)
    .lineWidth(1)
    .stroke()

  doc.moveDown(0.5)
}

/**
 * Add PDF footer with page number and date
 */
export function addPDFFooter(doc, pageNumber = 1) {
  const footerY = doc.page.height - PDF_CONFIG.margins.bottom + 25

  doc.save()
  doc.moveTo(PDF_CONFIG.margins.left, footerY - 20)
  doc.lineTo(550, footerY - 20)
  doc.strokeColor(PDF_CONFIG.colors.border)
  doc.lineWidth(0.5)
  doc.stroke()

  doc
    .fontSize(PDF_CONFIG.fonts.smallSize)
    .fillColor(PDF_CONFIG.colors.lightText)
    .text(
      `Generated on ${new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })} | Page ${pageNumber}`,
      PDF_CONFIG.margins.left,
      footerY,
      { align: 'center' }
    )

  doc.restore()
}

/**
 * Add section title with styling
 */
export function addSectionTitle(doc, title) {
  doc.moveDown(PDF_CONFIG.spacing.section)

  doc
    .fontSize(PDF_CONFIG.fonts.titleSize)
    .font('Helvetica-Bold')
    .fillColor(PDF_CONFIG.colors.primary)
    .text(title)

  doc.moveDown(PDF_CONFIG.spacing.paragraph)

  // Underline
  const y = doc.y - 5
  doc
    .moveTo(PDF_CONFIG.margins.left, y)
    .lineTo(550, y)
    .strokeColor(PDF_CONFIG.colors.accent)
    .lineWidth(2)
    .stroke()

  doc.moveDown(PDF_CONFIG.spacing.paragraph)
}

/**
 * Add key-value pair
 */
export function addKeyValue(doc, key, value, inline = false) {
  if (inline) {
    doc
      .fontSize(PDF_CONFIG.fonts.bodySize)
      .font('Helvetica-Bold')
      .fillColor(PDF_CONFIG.colors.text)
      .text(`${key}: `, { continued: true })

    doc
      .font('Helvetica')
      .fillColor(PDF_CONFIG.colors.secondary)
      .text(String(value))
  } else {
    doc
      .fontSize(PDF_CONFIG.fonts.bodySize)
      .font('Helvetica-Bold')
      .fillColor(PDF_CONFIG.colors.text)
      .text(key)

    doc
      .fontSize(PDF_CONFIG.fonts.bodySize)
      .font('Helvetica')
      .fillColor(PDF_CONFIG.colors.secondary)
      .text(String(value), { lineGap: 2 })

    doc.moveDown(PDF_CONFIG.spacing.paragraph)
  }
}

/**
 * Add bullet list
 */
export function addBulletList(doc, items) {
  if (!items || items.length === 0) return

  items.forEach(item => {
    doc
      .fontSize(PDF_CONFIG.fonts.bodySize)
      .font('Helvetica')
      .fillColor(PDF_CONFIG.colors.text)
      .text(`- ${item}`, {
        lineGap: PDF_CONFIG.spacing.line,
        indent: 20
      })
  })

  doc.moveDown(PDF_CONFIG.spacing.paragraph)
}

/**
 * Add info box (highlighted section)
 */
export function addInfoBox(doc, title, content) {
  // Background box
  const startY = doc.y
  const boxHeight = 80
  const boxWidth = 450

  doc
    .rect(PDF_CONFIG.margins.left, startY, boxWidth, boxHeight)
    .fillAndStroke(PDF_CONFIG.colors.background, PDF_CONFIG.colors.border)

  // Content
  doc.moveDown(0.3)
  doc
    .fontSize(PDF_CONFIG.fonts.bodySize)
    .font('Helvetica-Bold')
    .fillColor(PDF_CONFIG.colors.primary)
    .text(title, PDF_CONFIG.margins.left + 15, startY + 15)

  doc
    .fontSize(PDF_CONFIG.fonts.bodySize)
    .font('Helvetica')
    .fillColor(PDF_CONFIG.colors.text)
    .text(content, PDF_CONFIG.margins.left + 15, startY + 35, {
      width: boxWidth - 30,
      lineGap: 2
    })

  doc.y = startY + boxHeight + 10
  doc.moveDown(PDF_CONFIG.spacing.section)
}

/**
 * Add table (simple version)
 */
export function addTable(doc, headers, rows) {
  const colWidth = 100
  const rowHeight = 30
  const startX = PDF_CONFIG.margins.left
  const startY = doc.y

  // Headers
  doc
    .fontSize(PDF_CONFIG.fonts.bodySize)
    .font('Helvetica-Bold')
    .fillColor(PDF_CONFIG.colors.accent)

  headers.forEach((header, i) => {
    doc.text(header, startX + i * colWidth, startY, {
      width: colWidth,
      align: 'center'
    })
  })

  doc.moveDown()

  // Rows
  doc.font('Helvetica').fillColor(PDF_CONFIG.colors.text)

  rows.forEach(row => {
    row.forEach((cell, i) => {
      doc.text(String(cell), startX + i * colWidth, doc.y, {
        width: colWidth,
        align: 'center'
      })
    })
    doc.moveDown()
  })

  doc.moveDown(PDF_CONFIG.spacing.section)
}

/**
 * Add disclaimer
 */
export function addDisclaimer(doc) {
  doc.moveDown()

  const disclaimerText =
    'Generated by ArogyaAI. This report is for informational purposes only and does not replace professional medical advice. Always consult a healthcare professional for personalized medical evaluation and treatment.'

  doc
    .fontSize(PDF_CONFIG.fonts.smallSize)
    .fillColor(PDF_CONFIG.colors.lightText)
    .text(disclaimerText, {
      align: 'justify',
      lineGap: 2
    })
}

/**
 * Create response headers for PDF download
 */
export function setPDFHeaders(res, filename) {
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader(
    'Content-Disposition',
    `inline; filename="${filename}"`
  )
  res.setHeader('X-Content-Type-Options', 'nosniff')
}

/**
 * Format date for PDF
 */
export function formatPDFDate(date) {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Format number with proper decimals
 */
export function formatNumber(value, decimals = 1) {
  if (value === null || value === undefined || value === '') return 'N/A'
  return parseFloat(value).toFixed(decimals)
}
