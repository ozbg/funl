// PDF Generator - High-quality vector PDF generation from rendered layouts

import { jsPDF } from 'jspdf'
import { RenderedLayout, RenderedElement, PageSize } from '@/lib/types/layout'
import { generateQRCodeBuffer } from '@/lib/qr'

export class PDFGenerator {
  private static getJsPDFFormat(pageSize: PageSize): [number, number] {
    // jsPDF expects dimensions in mm
    switch (pageSize) {
      case 'A4-portrait':
        return [210, 297]
      case 'A4-landscape':
        return [297, 210]
      case 'A5-landscape':
        return [210, 148]
      case 'business-card-landscape':
        return [90, 55]
      default:
        return [210, 297]
    }
  }

  private static getOptimalFontSize(
    text: string,
    maxWidth: number,
    maxHeight: number,
    baseFontSize: number,
    pdf: jsPDF
  ): number {
    let fontSize = baseFontSize
    
    // Start with base font size and scale down if needed
    while (fontSize > 6) {
      pdf.setFontSize(fontSize)
      const textWidth = pdf.getTextWidth(text)
      const textHeight = fontSize * 0.352778 // Convert pt to mm
      
      if (textWidth <= maxWidth && textHeight <= maxHeight) {
        return fontSize
      }
      
      fontSize -= 0.5
    }
    
    return Math.max(fontSize, 6) // Minimum readable size
  }

  private static wrapText(text: string, maxWidth: number, pdf: jsPDF): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      const testWidth = pdf.getTextWidth(testLine)
      
      if (testWidth <= maxWidth) {
        currentLine = testLine
      } else {
        if (currentLine) {
          lines.push(currentLine)
          currentLine = word
        } else {
          // Single word is too long, force break
          lines.push(word)
        }
      }
    }
    
    if (currentLine) {
      lines.push(currentLine)
    }
    
    return lines
  }

  private static async renderElement(
    element: RenderedElement,
    pdf: jsPDF
  ): Promise<void> {
    const { position, size, style, content, type } = element

    switch (type) {
      case 'text':
        if (!content.trim()) return

        // Set font properties
        pdf.setFont('helvetica', style.fontWeight === 'bold' ? 'bold' : 'normal')
        pdf.setTextColor(style.color)
        
        // Calculate optimal font size
        const optimalFontSize = this.getOptimalFontSize(
          content,
          size.width,
          size.height,
          style.fontSize,
          pdf
        )
        
        pdf.setFontSize(optimalFontSize)
        
        // Wrap text if needed
        const lines = this.wrapText(content, size.width, pdf)
        const lineHeight = optimalFontSize * 0.352778 * 1.2 // Convert pt to mm with line spacing
        
        // Calculate starting Y position based on alignment
        let startY = position.y
        const totalTextHeight = lines.length * lineHeight
        
        if (lines.length > 1) {
          // Vertical centering for multi-line text
          startY = position.y + (size.height - totalTextHeight) / 2 + lineHeight
        } else {
          // Single line vertical centering
          startY = position.y + (size.height / 2) + (optimalFontSize * 0.352778 / 2)
        }

        // Render each line
        lines.forEach((line, index) => {
          const lineY = startY + (index * lineHeight)
          let lineX = position.x

          // Horizontal alignment
          if (style.alignment === 'center') {
            lineX = position.x + (size.width - pdf.getTextWidth(line)) / 2
          } else if (style.alignment === 'right') {
            lineX = position.x + size.width - pdf.getTextWidth(line)
          }

          pdf.text(line, lineX, lineY)
        })
        break

      case 'qrcode':
        if (!content.trim()) return

        try {
          // Generate QR code as buffer
          const qrBuffer = await generateQRCodeBuffer(content)
          
          // Convert buffer to base64 for jsPDF
          const qrBase64 = qrBuffer.toString('base64')
          
          // Add QR code image to PDF
          pdf.addImage(
            `data:image/png;base64,${qrBase64}`,
            'PNG',
            position.x,
            position.y,
            size.width,
            size.height
          )
        } catch (error) {
          console.error('Failed to generate QR code for PDF:', error)
          // Fallback: render as text
          pdf.setFont('helvetica', 'normal')
          pdf.setFontSize(8)
          pdf.setTextColor('#666666')
          pdf.text('QR Code', position.x, position.y + size.height / 2)
        }
        break

      case 'image':
        // For now, render placeholder for images
        // In future versions, this would load and embed actual images
        pdf.setFillColor(240, 240, 240)
        pdf.rect(position.x, position.y, size.width, size.height, 'F')
        
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(10)
        pdf.setTextColor('#666666')
        
        const imgText = 'Image'
        const imgTextWidth = pdf.getTextWidth(imgText)
        const imgTextX = position.x + (size.width - imgTextWidth) / 2
        const imgTextY = position.y + size.height / 2
        
        pdf.text(imgText, imgTextX, imgTextY)
        break

      default:
        console.warn(`Unknown element type: ${type}`)
    }
  }

  static async generatePDF(layout: RenderedLayout): Promise<Uint8Array> {
    const [width, height] = this.getJsPDFFormat(layout.pageSize)
    
    // Create new PDF document
    const pdf = new jsPDF({
      orientation: width > height ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [width, height],
      putOnlyUsedFonts: true,
      compress: true
    })

    // Set high quality rendering
    pdf.setProperties({
      title: 'Generated Layout',
      subject: 'Print Layout',
      creator: 'FunL Dynamic Layout Generator'
    })

    // Optional: Add margin guides for debugging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      pdf.setDrawColor(200, 200, 200)
      pdf.setLineWidth(0.1)
      const margin = layout.margin
      pdf.rect(margin, margin, width - 2 * margin, height - 2 * margin)
    }

    // Render all elements
    for (const element of layout.elements) {
      await this.renderElement(element, pdf)
    }

    // Return PDF as Uint8Array for download
    return new Uint8Array(pdf.output('arraybuffer'))
  }

  static async generatePDFBlob(layout: RenderedLayout): Promise<Blob> {
    const pdfData = await this.generatePDF(layout)
    return new Blob([new Uint8Array(pdfData)], { type: 'application/pdf' })
  }

  static async downloadPDF(layout: RenderedLayout, filename: string = 'layout.pdf'): Promise<void> {
    try {
      const pdfBlob = await this.generatePDFBlob(layout)
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download PDF:', error)
      throw new Error('Failed to generate PDF for download')
    }
  }

  // Utility method for preview generation (returns data URL)
  static async generatePDFDataURL(layout: RenderedLayout): Promise<string> {
    const pdfData = await this.generatePDF(layout)
    const base64 = btoa(String.fromCharCode(...new Uint8Array(pdfData)))
    return `data:application/pdf;base64,${base64}`
  }
}