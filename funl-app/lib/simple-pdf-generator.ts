import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'

export interface PDFGeneratorOptions {
  pageSize: string
  data: any
  template: any
}

// Page dimensions in mm
const PAGE_DIMENSIONS = {
  'A4-portrait': { width: 210, height: 297 },
  'A5-portrait': { width: 148, height: 210 },
  'A5-landscape': { width: 210, height: 148 },
}

export async function generatePDF({ pageSize, data, template }: PDFGeneratorOptions): Promise<Uint8Array> {
  // Get page dimensions
  const dimensions = PAGE_DIMENSIONS[pageSize as keyof typeof PAGE_DIMENSIONS] || PAGE_DIMENSIONS['A4-portrait']
  
  // Create PDF with correct orientation
  const orientation = pageSize.includes('landscape') ? 'landscape' : 'portrait'
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: [dimensions.width, dimensions.height]
  })

  // Process each element in the layout
  const elements = template.layout_config?.elements || []
  
  for (const element of elements) {
    const x = (element.position.x / 100) * dimensions.width
    const y = (element.position.y / 100) * dimensions.height
    const width = (element.size.width / 100) * dimensions.width
    const height = (element.size.height / 100) * dimensions.height

    if (element.type === 'text') {
      // Get the field value from data
      const text = data[element.field] || ''
      if (text) {
        const fontSize = element.fontSize || 12
        pdf.setFontSize(fontSize)
        
        // Set font weight
        const fontStyle = element.fontWeight === 'bold' ? 'bold' : 'normal'
        pdf.setFont('helvetica', fontStyle)
        
        // Handle rotation - simplified for now, render all text normally
        // TODO: Implement proper rotation once basic layout works
        {
          // Normal text rendering without rotation
          let textX = x
          const textY = y + height / 2
          
          if (element.alignment === 'center' || element.textAlign === 'center') {
            textX = x + width / 2
            pdf.text(text, textX, textY, { align: 'center', maxWidth: width })
          } else if (element.alignment === 'right') {
            pdf.text(text, x + width, textY, { align: 'right', maxWidth: width })
          } else {
            pdf.text(text, x, textY, { maxWidth: width })
          }
        }
      }
    } else if (element.type === 'qr_code') {
      // Generate QR code
      const qrData = data.contact_url || data.qr_data || 'https://example.com'
      try {
        const qrDataUrl = await QRCode.toDataURL(qrData, {
          width: Math.min(width * 3.78, 400), // Convert mm to pixels (assuming 96 DPI)
          margin: 0
        })
        
        // Center the QR code if alignment is center
        let qrX = x
        if (element.alignment === 'center') {
          qrX = x - width / 2
        }
        
        // Add QR code to PDF
        pdf.addImage(qrDataUrl, 'PNG', qrX, y - height, width, height)
      } catch (error) {
        console.error('Error generating QR code:', error)
      }
    }
  }

  // Generate PDF output
  const pdfOutput = pdf.output('arraybuffer')
  return new Uint8Array(pdfOutput)
}