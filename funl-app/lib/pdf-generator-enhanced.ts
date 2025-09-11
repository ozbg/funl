// Enhanced PDF Generator - High-quality vector PDF generation with full styling support

import { jsPDF } from 'jspdf'
import { RenderedLayout, RenderedElement, PageSize } from '@/lib/types/layout'
import { EnhancedLayoutElement, mergeSpacing, getLegacyAlignment } from '@/lib/types/layout-enhanced'
import { generateQRCodeBuffer } from '@/lib/qr'

export class EnhancedPDFGenerator {
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

  private static getFontFamily(fontFamily?: string): string {
    switch (fontFamily) {
      case 'times': return 'times'
      case 'courier': return 'courier'
      case 'helvetica':
      case 'arial':
      case 'system-ui':
      default: return 'helvetica'
    }
  }

  private static getFontStyle(fontWeight?: string, fontStyle?: string): string {
    const isBold = fontWeight === 'bold' || (fontWeight && parseInt(fontWeight) >= 600)
    const isItalic = fontStyle === 'italic'
    
    if (isBold && isItalic) return 'bolditalic'
    if (isBold) return 'bold'
    if (isItalic) return 'italic'
    return 'normal'
  }

  private static hexToRgb(hex: string): { r: number; g: number; b: number } {
    // Remove # if present
    hex = hex.replace('#', '')
    
    // Parse hex values
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    
    return { r, g, b }
  }

  private static applyTextTransform(text: string, transform?: string): string {
    switch (transform) {
      case 'uppercase': return text.toUpperCase()
      case 'lowercase': return text.toLowerCase()
      case 'capitalize': 
        return text.split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ')
      default: return text
    }
  }

  private static getOptimalFontSize(
    text: string,
    maxWidth: number,
    maxHeight: number,
    baseFontSize: number,
    pdf: jsPDF,
    letterSpacing: number = 0
  ): number {
    let fontSize = baseFontSize
    
    // Start with base font size and scale down if needed
    while (fontSize > 6) {
      pdf.setFontSize(fontSize)
      const textWidth = pdf.getTextWidth(text) + (text.length * letterSpacing * 0.352778)
      const textHeight = fontSize * 0.352778 // Convert pt to mm
      
      if (textWidth <= maxWidth && textHeight <= maxHeight) {
        return fontSize
      }
      
      fontSize -= 0.5
    }
    
    return Math.max(fontSize, 6) // Minimum readable size
  }

  private static wrapText(
    text: string, 
    maxWidth: number, 
    pdf: jsPDF,
    letterSpacing: number = 0,
    wordWrap: string = 'break-word'
  ): string[] {
    if (wordWrap === 'no-wrap') {
      return [text]
    }

    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      const testWidth = pdf.getTextWidth(testLine) + (testLine.length * letterSpacing * 0.352778)
      
      if (testWidth <= maxWidth) {
        currentLine = testLine
      } else {
        if (currentLine) {
          lines.push(currentLine)
          currentLine = word
        } else {
          // Single word is too long
          if (wordWrap === 'break-word') {
            // Break the word
            let tempWord = ''
            for (const char of word) {
              const tempTest = tempWord + char
              const tempWidth = pdf.getTextWidth(tempTest) + (tempTest.length * letterSpacing * 0.352778)
              if (tempWidth <= maxWidth) {
                tempWord = tempTest
              } else {
                if (tempWord) lines.push(tempWord)
                tempWord = char
              }
            }
            if (tempWord) currentLine = tempWord
          } else {
            lines.push(word)
          }
        }
      }
    }
    
    if (currentLine) {
      lines.push(currentLine)
    }
    
    return lines
  }

  private static async renderEnhancedElement(
    element: EnhancedLayoutElement & { content: string },
    pdf: jsPDF,
    pageWidth: number,
    pageHeight: number
  ): Promise<void> {
    const padding = mergeSpacing(element.padding)
    const margin = mergeSpacing(element.margin)
    
    // Calculate actual dimensions in mm
    const xPos = (pageWidth * (element.position.x + margin.left)) / 100
    const yPos = (pageHeight * (element.position.y + margin.top)) / 100
    const width = (pageWidth * (element.size.width - margin.left - margin.right)) / 100
    const height = (pageHeight * (element.size.height - margin.top - margin.bottom)) / 100
    
    // Apply rotation if needed
    if (element.rotation) {
      pdf.saveGraphicsState()
      const centerX = xPos + width / 2
      const centerY = yPos + height / 2
      // @ts-ignore - internal API
      pdf.internal.write(
        `q`,
        `1 0 0 1 ${centerX} ${centerY} cm`,
        `${Math.cos(element.rotation * Math.PI / 180)} ${Math.sin(element.rotation * Math.PI / 180)} ${-Math.sin(element.rotation * Math.PI / 180)} ${Math.cos(element.rotation * Math.PI / 180)} 0 0 cm`,
        `1 0 0 1 ${-centerX} ${-centerY} cm`
      )
    }

    // Apply opacity
    if (element.opacity !== undefined && element.opacity < 1) {
      pdf.setGState(pdf.GState({ opacity: element.opacity }))
    }

    // Draw background if specified
    if (element.backgroundColor && element.backgroundColor !== 'transparent') {
      const bgColor = this.hexToRgb(element.backgroundColor)
      pdf.setFillColor(bgColor.r, bgColor.g, bgColor.b)
      
      if (element.borderRadius) {
        // Rounded rectangle (approximation)
        const radius = Math.min(width, height) * (element.borderRadius / 100)
        pdf.roundedRect(xPos, yPos, width, height, radius, radius, 'F')
      } else {
        pdf.rect(xPos, yPos, width, height, 'F')
      }
    }

    // Draw border if specified
    if (element.borderWidth && element.borderWidth > 0) {
      const borderColor = this.hexToRgb(element.borderColor || '#000000')
      pdf.setDrawColor(borderColor.r, borderColor.g, borderColor.b)
      pdf.setLineWidth(element.borderWidth * 0.352778) // Convert px to mm
      
      // Set border style
      if (element.borderStyle === 'dashed') {
        pdf.setLineDashPattern([2, 2], 0)
      } else if (element.borderStyle === 'dotted') {
        pdf.setLineDashPattern([1, 1], 0)
      }
      
      if (element.borderRadius) {
        const radius = Math.min(width, height) * (element.borderRadius / 100)
        pdf.roundedRect(xPos, yPos, width, height, radius, radius, 'S')
      } else {
        pdf.rect(xPos, yPos, width, height, 'S')
      }
      
      // Reset dash pattern
      pdf.setLineDashPattern([], 0)
    }

    switch (element.type) {
      case 'text':
        if (!element.content.trim()) break

        // Apply padding
        const contentX = xPos + (width * padding.left / 100)
        const contentY = yPos + (height * padding.top / 100)
        const contentWidth = width * (1 - (padding.left + padding.right) / 100)
        const contentHeight = height * (1 - (padding.top + padding.bottom) / 100)

        // Set font properties
        const fontFamily = this.getFontFamily(element.fontFamily)
        const fontStyle = this.getFontStyle(element.fontWeight, element.fontStyle)
        pdf.setFont(fontFamily, fontStyle)
        
        // Set text color
        const textColor = this.hexToRgb(element.color || '#000000')
        pdf.setTextColor(textColor.r, textColor.g, textColor.b)
        
        // Apply text transform
        const transformedText = this.applyTextTransform(element.content, element.textTransform)
        
        // Calculate optimal font size
        const optimalFontSize = this.getOptimalFontSize(
          transformedText,
          contentWidth,
          contentHeight,
          element.fontSize || 14,
          pdf,
          element.letterSpacing || 0
        )
        
        pdf.setFontSize(optimalFontSize)
        
        // Wrap text if needed
        const lines = this.wrapText(
          transformedText, 
          contentWidth, 
          pdf,
          element.letterSpacing || 0,
          element.wordWrap
        )
        
        // Calculate line height
        const lineHeight = optimalFontSize * 0.352778 * (element.lineHeight || 1.2)
        const totalTextHeight = lines.length * lineHeight
        
        // Calculate starting Y position based on vertical alignment
        let startY = contentY
        switch (element.verticalAlign) {
          case 'middle':
            startY = contentY + (contentHeight - totalTextHeight) / 2 + lineHeight * 0.7
            break
          case 'bottom':
            startY = contentY + contentHeight - totalTextHeight + lineHeight * 0.7
            break
          default: // top
            startY = contentY + lineHeight * 0.7
        }

        // Apply text decoration if needed
        const hasUnderline = element.textDecoration === 'underline'
        const hasStrikethrough = element.textDecoration === 'line-through'
        
        // Render each line
        lines.forEach((line, index) => {
          if (element.maxLines && index >= element.maxLines) {
            if (index === element.maxLines - 1 && element.overflow === 'ellipsis') {
              line = line.substring(0, line.length - 3) + '...'
            } else {
              return
            }
          }

          const lineY = startY + (index * lineHeight)
          let lineX = contentX
          
          // Handle text alignment
          const textWidth = pdf.getTextWidth(line) + (line.length * (element.letterSpacing || 0) * 0.352778)
          const textAlign = getLegacyAlignment(element as any)
          
          if (textAlign === 'center') {
            lineX = contentX + (contentWidth - textWidth) / 2
          } else if (textAlign === 'right') {
            lineX = contentX + contentWidth - textWidth
          } else if (element.textAlign === 'justify' && index < lines.length - 1) {
            // Justify text (except last line)
            const words = line.split(' ')
            if (words.length > 1) {
              const wordWidth = words.reduce((sum, word) => sum + pdf.getTextWidth(word), 0)
              const spaceWidth = (contentWidth - wordWidth) / (words.length - 1)
              let currentX = contentX
              
              words.forEach((word, wordIndex) => {
                pdf.text(word, currentX, lineY)
                currentX += pdf.getTextWidth(word) + (wordIndex < words.length - 1 ? spaceWidth : 0)
              })
              return
            }
          }

          // Apply letter spacing if specified
          if (element.letterSpacing && element.letterSpacing !== 0) {
            let charX = lineX
            for (const char of line) {
              pdf.text(char, charX, lineY)
              charX += pdf.getTextWidth(char) + (element.letterSpacing * 0.352778)
            }
          } else {
            pdf.text(line, lineX, lineY)
          }

          // Add text decorations
          if (hasUnderline || hasStrikethrough) {
            const decorY = hasUnderline ? lineY + 1 : lineY - (optimalFontSize * 0.352778 * 0.3)
            pdf.setDrawColor(textColor.r, textColor.g, textColor.b)
            pdf.setLineWidth(0.1)
            pdf.line(lineX, decorY, lineX + textWidth, decorY)
          }
        })
        break

      case 'qr_code':
        if (!element.content.trim()) break

        try {
          // Generate QR code as buffer
          const qrBuffer = await generateQRCodeBuffer(element.content)
          
          // Convert buffer to base64 for jsPDF
          const qrBase64 = qrBuffer.toString('base64')
          
          // Add QR code image to PDF
          pdf.addImage(
            `data:image/png;base64,${qrBase64}`,
            'PNG',
            xPos,
            yPos,
            width,
            height
          )
        } catch (error) {
          console.error('Failed to generate QR code for PDF:', error)
          // Fallback: render as text
          pdf.setFont('helvetica', 'normal')
          pdf.setFontSize(8)
          pdf.setTextColor(102, 102, 102)
          pdf.text('QR Code', xPos + width / 2, yPos + height / 2, { align: 'center' })
        }
        break

      case 'image':
        // For now, render placeholder for images
        pdf.setFillColor(240, 240, 240)
        pdf.rect(xPos, yPos, width, height, 'F')
        
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(10)
        pdf.setTextColor(102, 102, 102)
        
        pdf.text('Image', xPos + width / 2, yPos + height / 2, { align: 'center' })
        break
    }

    // Restore graphics state if rotation was applied
    if (element.rotation) {
      pdf.restoreGraphicsState()
    }

    // Reset opacity
    if (element.opacity !== undefined && element.opacity < 1) {
      pdf.setGState(pdf.GState({ opacity: 1 }))
    }
  }

  static async generateEnhancedPDF(
    layout: RenderedLayout & { elements: (EnhancedLayoutElement & { content: string })[] }
  ): Promise<Uint8Array> {
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
      creator: 'FunL Enhanced Layout Generator'
    })

    // Set page background if specified
    // @ts-ignore - backgroundColor may be on layout
    if ((layout as any).backgroundColor) {
      const bgColor = this.hexToRgb((layout as any).backgroundColor)
      pdf.setFillColor(bgColor.r, bgColor.g, bgColor.b)
      pdf.rect(0, 0, width, height, 'F')
    }

    // Optional: Add margin guides for debugging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      pdf.setDrawColor(200, 200, 200)
      pdf.setLineWidth(0.1)
      const margin = layout.margin || 10
      pdf.rect(margin, margin, width - 2 * margin, height - 2 * margin)
    }

    // Render all elements
    for (const element of layout.elements) {
      await this.renderEnhancedElement(element, pdf, width, height)
    }

    // Return PDF as Uint8Array for download
    return new Uint8Array(pdf.output('arraybuffer'))
  }

  static async generatePDFBlob(layout: RenderedLayout): Promise<Blob> {
    const pdfData = await this.generateEnhancedPDF(layout as any)
    return new Blob([pdfData], { type: 'application/pdf' })
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
    const pdfData = await this.generateEnhancedPDF(layout as any)
    const base64 = btoa(String.fromCharCode(...pdfData))
    return `data:application/pdf;base64,${base64}`
  }
}