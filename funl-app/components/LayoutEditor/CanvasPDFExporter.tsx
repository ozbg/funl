'use client'

import React from 'react'
import { jsPDF } from 'jspdf'
import Konva from 'konva'
import { EnhancedLayoutElement, mergeSpacing, getLegacyAlignment } from '@/lib/types/layout-enhanced'
import { generateQRCodeBuffer } from '@/lib/qr'

interface CanvasPDFExporterProps {
  onExport: (pdfBlob: Blob) => void
}

export class CanvasPDFExporter {
  static async exportToPDF(
    elements: EnhancedLayoutElement[],
    printType: 'A4_portrait' | 'A5_portrait' | 'A5_landscape',
    fieldValues: { [key: string]: string } = {}
  ): Promise<Blob> {
    // Get paper dimensions
    const getPaperDimensions = () => {
      switch (printType) {
        case 'A4_portrait': return { width: 210, height: 297 }
        case 'A5_portrait': return { width: 148, height: 210 }
        case 'A5_landscape': return { width: 210, height: 148 }
        default: return { width: 210, height: 297 }
      }
    }

    const dimensions = getPaperDimensions()
    const isLandscape = dimensions.width > dimensions.height

    // Create PDF
    const pdf = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [dimensions.width, dimensions.height],
      compress: true
    })

    // Set PDF properties
    pdf.setProperties({
      title: 'Layout Export',
      subject: 'Professional Layout',
      creator: 'Professional Layout Editor'
    })

    // Helper to get default values for preview
    const getDefaultFieldValue = (field: string): string => {
      const defaults = {
        business_name: 'Your Business Name',
        custom_message: 'Your custom message will appear here.',
        contact_phone: '+1 (555) 123-4567',
        contact_email: 'hello@yourbusiness.com',
        website: 'www.yourbusiness.com',
        funnel_name: 'Your Funnel Name'
      }
      return defaults[field as keyof typeof defaults] || ''
    }

    // Helper to get field value
    const getFieldValue = (field?: string): string => {
      if (!field) return ''
      return fieldValues[field] || getDefaultFieldValue(field)
    }

    // Apply text transform
    const applyTextTransform = (text: string, transform?: string): string => {
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

    // Convert hex color to RGB
    const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 0, b: 0 }
    }

    // Render each element
    for (const element of elements) {
      if (element.visible === false) continue

      // Calculate actual positions in mm
      const x = (element.position.x / 100) * dimensions.width
      const y = (element.position.y / 100) * dimensions.height
      const width = (element.size.width / 100) * dimensions.width
      const height = (element.size.height / 100) * dimensions.height

      // Apply padding
      const padding = mergeSpacing(element.padding)
      const paddedX = x + (width * padding.left / 100)
      const paddedY = y + (height * padding.top / 100)
      const paddedWidth = width * (1 - (padding.left + padding.right) / 100)
      const paddedHeight = height * (1 - (padding.top + padding.bottom) / 100)

      // Save graphics state for transforms
      pdf.saveGraphicsState()

      // Apply rotation if needed (simplified approach)
      if (element.rotation) {
        // TODO: Implement rotation using jsPDF's supported methods
        // For now, we'll skip rotation to avoid internal PDF errors
      }

      // Apply opacity
      if (element.opacity !== undefined && element.opacity < 1) {
        pdf.setGState(pdf.GState({ opacity: element.opacity }))
      }

      // Draw background
      if (element.backgroundColor && element.backgroundColor !== 'transparent') {
        const bgColor = hexToRgb(element.backgroundColor)
        pdf.setFillColor(bgColor.r, bgColor.g, bgColor.b)
        
        if (element.borderRadius && element.borderRadius > 0) {
          // Approximate rounded rectangle
          const radius = Math.min(width, height) * (element.borderRadius / 100)
          pdf.roundedRect(x, y, width, height, radius, radius, 'F')
        } else {
          pdf.rect(x, y, width, height, 'F')
        }
      }

      // Draw border
      if (element.borderWidth && element.borderWidth > 0) {
        const borderColor = hexToRgb(element.borderColor || '#000000')
        pdf.setDrawColor(borderColor.r, borderColor.g, borderColor.b)
        pdf.setLineWidth(element.borderWidth * 0.352778) // Convert px to mm
        
        if (element.borderStyle === 'dashed') {
          pdf.setLineDashPattern([2, 2], 0)
        } else if (element.borderStyle === 'dotted') {
          pdf.setLineDashPattern([1, 1], 0)
        }
        
        if (element.borderRadius && element.borderRadius > 0) {
          const radius = Math.min(width, height) * (element.borderRadius / 100)
          pdf.roundedRect(x, y, width, height, radius, radius, 'S')
        } else {
          pdf.rect(x, y, width, height, 'S')
        }
        
        pdf.setLineDashPattern([], 0) // Reset dash pattern
      }

      // Element-specific rendering
      switch (element.type) {
        case 'qr_code':
          try {
            const qrUrl = fieldValues.qr_url || 'https://example.com'
            const qrBuffer = await generateQRCodeBuffer(qrUrl)
            const qrBase64 = qrBuffer.toString('base64')
            
            pdf.addImage(
              `data:image/png;base64,${qrBase64}`,
              'PNG',
              paddedX,
              paddedY,
              paddedWidth,
              paddedHeight
            )
          } catch (error) {
            // Fallback: draw placeholder
            pdf.setFillColor(240, 240, 240)
            pdf.rect(paddedX, paddedY, paddedWidth, paddedHeight, 'F')
            pdf.setFontSize(8)
            pdf.setTextColor(100, 100, 100)
            pdf.text('QR CODE', paddedX + paddedWidth / 2, paddedY + paddedHeight / 2, { align: 'center' })
          }
          break

        case 'text':
          const textContent = getFieldValue(element.field)
          if (!textContent) break

          const transformedText = applyTextTransform(textContent, element.textTransform)
          
          // Set font
          const fontFamily = element.fontFamily === 'times' ? 'times' : 
                           element.fontFamily === 'courier' ? 'courier' : 'helvetica'
          const fontStyle = element.fontWeight === 'bold' ? 'bold' : 
                          element.fontStyle === 'italic' ? 'italic' : 'normal'
          pdf.setFont(fontFamily, fontStyle)
          
          // Set text color
          const textColor = hexToRgb(element.color || '#000000')
          pdf.setTextColor(textColor.r, textColor.g, textColor.b)
          
          // Set font size
          pdf.setFontSize(element.fontSize || 14)
          
          // Calculate text positioning
          const textAlign = element.textAlign === 'justify' ? 'left' : getLegacyAlignment(element as any)
          const lineHeight = (element.lineHeight || 1.2) * (element.fontSize || 14) * 0.352778 // Convert pt to mm
          
          // Split text into lines
          const lines = pdf.splitTextToSize(transformedText, paddedWidth)
          
          // Calculate starting Y position based on vertical alignment
          let startY = paddedY
          const totalTextHeight = lines.length * lineHeight
          
          switch (element.verticalAlign) {
            case 'middle':
              startY = paddedY + (paddedHeight - totalTextHeight) / 2 + lineHeight * 0.7
              break
            case 'bottom':
              startY = paddedY + paddedHeight - totalTextHeight + lineHeight * 0.7
              break
            default: // top
              startY = paddedY + lineHeight * 0.7
          }
          
          // Render each line
          lines.forEach((line: string, index: number) => {
            const lineY = startY + (index * lineHeight)
            let lineX = paddedX
            
            if (textAlign === 'center') {
              lineX = paddedX + paddedWidth / 2
            } else if (textAlign === 'right') {
              lineX = paddedX + paddedWidth
            }
            
            pdf.text(line, lineX, lineY, { align: textAlign })
          })
          break

        case 'image':
          // Draw placeholder for images
          pdf.setFillColor(230, 230, 230)
          pdf.rect(paddedX, paddedY, paddedWidth, paddedHeight, 'F')
          pdf.setFontSize(10)
          pdf.setTextColor(120, 120, 120)
          pdf.text('IMAGE', paddedX + paddedWidth / 2, paddedY + paddedHeight / 2, { align: 'center' })
          break
      }

      // Restore graphics state
      pdf.restoreGraphicsState()
    }

    // Return as blob
    const pdfArrayBuffer = pdf.output('arraybuffer')
    return new Blob([pdfArrayBuffer], { type: 'application/pdf' })
  }

  static async downloadPDF(
    elements: EnhancedLayoutElement[],
    printType: 'A4_portrait' | 'A5_portrait' | 'A5_landscape',
    fieldValues: { [key: string]: string } = {},
    filename: string = 'layout.pdf'
  ): Promise<void> {
    try {
      const pdfBlob = await this.exportToPDF(elements, printType, fieldValues)
      
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
}

// React component for export functionality
function CanvasPDFExporterComponent({ onExport }: CanvasPDFExporterProps) {
  return null // This is a utility class, not a visual component
}

export default CanvasPDFExporterComponent