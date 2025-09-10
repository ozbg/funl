// Dynamic Layout Engine - Converts JSON layout definitions to renderable structures

import { 
  LayoutDefinition, 
  LayoutData, 
  RenderedLayout, 
  RenderedElement,
  PageSize,
  PAGE_DIMENSIONS,
  TEXT_STYLES,
  LayoutElement,
  RegionContent
} from '@/lib/types/layout'

export class LayoutEngine {
  private static parseMargin(margin: string): number {
    // Convert margin string (e.g., "10mm") to number in mm
    const match = margin.match(/^(\d+(?:\.\d+)?)mm$/)
    if (!match) {
      throw new Error(`Invalid margin format: ${margin}. Expected format: "10mm"`)
    }
    return parseFloat(match[1])
  }

  private static parseSize(size: string, containerSize: number): number {
    // Convert size string (e.g., "40%" or "30mm") to number in mm
    if (size.endsWith('%')) {
      const percentage = parseFloat(size.slice(0, -1))
      return (percentage / 100) * containerSize
    } else if (size.endsWith('mm')) {
      return parseFloat(size.slice(0, -2))
    } else {
      throw new Error(`Invalid size format: ${size}. Expected format: "40%" or "30mm"`)
    }
  }

  private static getTextStyle(styleName: string, element: LayoutElement) {
    const baseStyle = TEXT_STYLES[styleName as keyof typeof TEXT_STYLES] || TEXT_STYLES.body
    
    return {
      fontSize: (element as any).fontSize || baseStyle.fontSize,
      fontWeight: (element as any).fontWeight || baseStyle.fontWeight,
      alignment: (element as any).alignment || 'left' as const,
      color: (element as any).color || '#000000'
    }
  }

  private static calculateRegionBounds(
    region: string,
    pageWidth: number,
    pageHeight: number,
    margin: number
  ): { x: number; y: number; width: number; height: number } {
    const contentWidth = pageWidth - (2 * margin)
    const contentHeight = pageHeight - (2 * margin)

    switch (region) {
      case 'left':
        return {
          x: margin,
          y: margin,
          width: contentWidth * 0.5,
          height: contentHeight
        }
      case 'right':
        return {
          x: margin + (contentWidth * 0.5),
          y: margin,
          width: contentWidth * 0.5,
          height: contentHeight
        }
      case 'top':
        return {
          x: margin,
          y: margin,
          width: contentWidth,
          height: contentHeight * 0.33
        }
      case 'bottom':
        return {
          x: margin,
          y: margin + (contentHeight * 0.67),
          width: contentWidth,
          height: contentHeight * 0.33
        }
      case 'center':
        return {
          x: margin + (contentWidth * 0.25),
          y: margin + (contentHeight * 0.25),
          width: contentWidth * 0.5,
          height: contentHeight * 0.5
        }
      default:
        // Custom region - default to center
        return {
          x: margin,
          y: margin,
          width: contentWidth,
          height: contentHeight
        }
    }
  }

  private static processRegionContent(
    content: RegionContent,
    regionBounds: { x: number; y: number; width: number; height: number },
    data: LayoutData
  ): RenderedElement[] {
    const elements: RenderedElement[] = []

    // Process content array (multiple elements)
    if (content.content) {
      const elementHeight = regionBounds.height / content.content.length
      content.content.forEach((element, index) => {
        const elementY = regionBounds.y + (index * elementHeight)
        const renderedElement = this.processElement(
          element,
          {
            x: regionBounds.x,
            y: elementY,
            width: regionBounds.width,
            height: elementHeight
          },
          data
        )
        if (renderedElement) {
          elements.push(renderedElement)
        }
      })
    }

    // Process positioned elements (top, middle, bottom)
    if (content.top) {
      const elementY = regionBounds.y
      const elementHeight = regionBounds.height * 0.33
      const renderedElement = this.processElement(
        content.top,
        {
          x: regionBounds.x,
          y: elementY,
          width: regionBounds.width,
          height: elementHeight
        },
        data
      )
      if (renderedElement) {
        elements.push(renderedElement)
      }
    }

    if (content.middle) {
      const elementY = regionBounds.y + (regionBounds.height * 0.33)
      const elementHeight = regionBounds.height * 0.34
      const renderedElement = this.processElement(
        content.middle,
        {
          x: regionBounds.x,
          y: elementY,
          width: regionBounds.width,
          height: elementHeight
        },
        data
      )
      if (renderedElement) {
        elements.push(renderedElement)
      }
    }

    if (content.bottom) {
      const elementY = regionBounds.y + (regionBounds.height * 0.67)
      const elementHeight = regionBounds.height * 0.33
      const renderedElement = this.processElement(
        content.bottom,
        {
          x: regionBounds.x,
          y: elementY,
          width: regionBounds.width,
          height: elementHeight
        },
        data
      )
      if (renderedElement) {
        elements.push(renderedElement)
      }
    }

    return elements
  }

  private static processElement(
    element: LayoutElement,
    bounds: { x: number; y: number; width: number; height: number },
    data: LayoutData
  ): RenderedElement | null {
    const fieldValue = data[element.field] || ''

    if (!fieldValue && element.type !== 'qrcode') {
      return null // Skip empty text elements
    }

    switch (element.type) {
      case 'text':
        const style = this.getTextStyle(element.style, element)
        return {
          type: 'text',
          content: fieldValue,
          position: { x: bounds.x, y: bounds.y },
          size: { width: bounds.width, height: bounds.height },
          style
        }

      case 'qrcode':
        // QR codes maintain aspect ratio
        const qrSize = element.size
        const qrDimension = this.parseSize(qrSize, Math.min(bounds.width, bounds.height))
        
        return {
          type: 'qrcode',
          content: fieldValue,
          position: { 
            x: bounds.x + ((bounds.width - qrDimension) / 2),
            y: bounds.y + ((bounds.height - qrDimension) / 2)
          },
          size: { width: qrDimension, height: qrDimension },
          style: {
            fontSize: 12,
            fontWeight: 'normal',
            alignment: 'center',
            color: '#000000'
          }
        }

      case 'image':
        // Images support custom aspect ratios
        const imgSize = element.size
        const imgWidth = this.parseSize(imgSize, bounds.width)
        const aspectRatio = element.aspectRatio || '1:1'
        const [ratioW, ratioH] = aspectRatio.split(':').map(Number)
        const imgHeight = (imgWidth * ratioH) / ratioW

        return {
          type: 'image',
          content: fieldValue,
          position: { 
            x: bounds.x + ((bounds.width - imgWidth) / 2),
            y: bounds.y + ((bounds.height - imgHeight) / 2)
          },
          size: { width: imgWidth, height: imgHeight },
          style: {
            fontSize: 12,
            fontWeight: 'normal',
            alignment: 'center',
            color: '#000000'
          }
        }

      default:
        return null
    }
  }

  static renderLayout(definition: LayoutDefinition, data: LayoutData): RenderedLayout {
    const pageSize = definition.page.size
    const dimensions = PAGE_DIMENSIONS[pageSize]
    const margin = this.parseMargin(definition.page.margin)

    const elements: RenderedElement[] = []

    // Process each region in the layout
    for (const [regionName, regionContent] of Object.entries(definition.layout)) {
      if (!regionContent) continue

      const regionBounds = this.calculateRegionBounds(
        regionName,
        dimensions.width,
        dimensions.height,
        margin
      )

      const regionElements = this.processRegionContent(regionContent, regionBounds, data)
      elements.push(...regionElements)
    }

    return {
      pageSize,
      dimensions,
      margin,
      elements
    }
  }

  static validateLayoutDefinition(definition: any): definition is LayoutDefinition {
    try {
      // Basic structure validation
      if (!definition || typeof definition !== 'object') return false
      if (!definition.page || !definition.layout) return false
      if (!definition.page.size || !definition.page.margin) return false
      
      // Validate page size
      const validPageSizes: PageSize[] = ['A4-portrait', 'A4-landscape', 'A5-landscape', 'business-card-landscape']
      if (!validPageSizes.includes(definition.page.size)) return false

      // Validate margin format
      if (!definition.page.margin.match(/^\d+(?:\.\d+)?mm$/)) return false

      // Basic layout validation - at least one region should exist
      const hasContent = Object.values(definition.layout).some(region => 
        region && typeof region === 'object'
      )
      
      return hasContent
    } catch {
      return false
    }
  }
}