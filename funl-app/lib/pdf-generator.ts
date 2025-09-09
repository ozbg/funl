import { jsPDF } from 'jspdf'
import { generateQRCode } from './qr'

interface LayoutElement {
  id: string
  type: 'qr_code' | 'text' | 'image'
  field?: string
  position: { x: number; y: number } // percentage based
  size: { width: number; height: number } // percentage based
  alignment?: 'left' | 'center' | 'right'
  fontSize?: number
  fontWeight?: string
}

interface PrintLayout {
  id: string
  name: string
  print_type: 'A4_portrait' | 'A5_portrait' | 'A5_landscape'
  layout_config: {
    elements: LayoutElement[]
  }
}

interface PrintData {
  business_name?: string
  custom_message?: string
  contact_phone?: string
  contact_email?: string
  website?: string
  funnel_name?: string
  qr_url: string
}

// Paper dimensions in mm (without bleed)
const PAPER_SIZES = {
  A4_portrait: { width: 210, height: 297 },
  A5_portrait: { width: 148, height: 210 },
  A5_landscape: { width: 210, height: 148 }
}

// 5mm bleed on all sides
const BLEED = 5

export async function generatePrintPDF(
  layout: PrintLayout,
  data: PrintData
): Promise<Blob> {
  const paperSize = PAPER_SIZES[layout.print_type]
  
  // Create PDF with bleed area
  const orientation = layout.print_type.includes('landscape') ? 'landscape' : 'portrait'
  const pdf = new jsPDF({
    orientation: orientation as 'portrait' | 'landscape',
    unit: 'mm',
    format: [
      paperSize.width + (BLEED * 2),
      paperSize.height + (BLEED * 2)
    ]
  })

  // Set 150 DPI for print quality
  const scale = 150 / 72 // Convert from default 72 DPI to 150 DPI

  // White background with bleed
  pdf.setFillColor(255, 255, 255)
  pdf.rect(0, 0, paperSize.width + (BLEED * 2), paperSize.height + (BLEED * 2), 'F')

  // Generate QR code
  const qrCodeDataUrl = await generateQRCode(data.qr_url)

  // Process each element in the layout
  for (const element of layout.layout_config.elements) {
    // Calculate actual position with bleed offset
    const x = (element.position.x / 100) * paperSize.width + BLEED
    const y = (element.position.y / 100) * paperSize.height + BLEED
    const width = (element.size.width / 100) * paperSize.width
    const height = (element.size.height / 100) * paperSize.height

    switch (element.type) {
      case 'qr_code':
        // Add QR code image
        const qrSize = Math.min(width, height)
        let qrX = x
        
        if (element.alignment === 'center') {
          qrX = x - (qrSize / 2)
        } else if (element.alignment === 'right') {
          qrX = x - qrSize
        }
        
        pdf.addImage(qrCodeDataUrl, 'PNG', qrX, y, qrSize, qrSize)
        break

      case 'text':
        const value = data[element.field as keyof PrintData] as string
        if (!value) break

        // Set font properties
        const fontSize = (element.fontSize || 14) * 0.75 // Convert to PDF points
        pdf.setFontSize(fontSize)
        
        if (element.fontWeight === 'bold') {
          pdf.setFont('helvetica', 'bold')
        } else {
          pdf.setFont('helvetica', 'normal')
        }

        // Calculate text position based on alignment
        let textX = x
        let textAlign: 'left' | 'center' | 'right' = element.alignment || 'left'
        
        if (element.alignment === 'center') {
          textX = x
          textAlign = 'center'
        } else if (element.alignment === 'right') {
          textX = x + width
          textAlign = 'right'
        }

        // Add text with word wrap
        const lines = pdf.splitTextToSize(value, width)
        pdf.text(lines, textX, y, {
          align: textAlign,
          baseline: 'top'
        })
        break
    }
  }

  // Add crop marks (optional - for professional printing)
  pdf.setDrawColor(0, 0, 0)
  pdf.setLineWidth(0.1)
  
  // Top-left corner
  pdf.line(0, BLEED, BLEED - 2, BLEED) // horizontal
  pdf.line(BLEED, 0, BLEED, BLEED - 2) // vertical
  
  // Top-right corner
  pdf.line(paperSize.width + BLEED + 2, BLEED, paperSize.width + (BLEED * 2), BLEED)
  pdf.line(paperSize.width + BLEED, 0, paperSize.width + BLEED, BLEED - 2)
  
  // Bottom-left corner
  pdf.line(0, paperSize.height + BLEED, BLEED - 2, paperSize.height + BLEED)
  pdf.line(BLEED, paperSize.height + BLEED + 2, BLEED, paperSize.height + (BLEED * 2))
  
  // Bottom-right corner
  pdf.line(paperSize.width + BLEED + 2, paperSize.height + BLEED, paperSize.width + (BLEED * 2), paperSize.height + BLEED)
  pdf.line(paperSize.width + BLEED, paperSize.height + BLEED + 2, paperSize.width + BLEED, paperSize.height + (BLEED * 2))

  // Return as blob
  return pdf.output('blob')
}

export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}