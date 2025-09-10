// Dynamic Layout-to-PDF Generator Types

export type PageSize = 'A4-portrait' | 'A4-landscape' | 'A5-landscape' | 'business-card-landscape'

export type ElementType = 'text' | 'qrcode' | 'image'

export type TextStyle = 'h1' | 'h2' | 'h3' | 'body' | 'caption'

export type Alignment = 'left' | 'center' | 'right'

export interface PageConfig {
  size: PageSize
  margin: string // e.g., "10mm"
}

export interface TextElement {
  type: 'text'
  field: string // Data field to bind to
  style: TextStyle
  alignment?: Alignment
  fontSize?: number // Optional override for style
  fontWeight?: 'normal' | 'bold'
  color?: string // Hex color
}

export interface QRCodeElement {
  type: 'qrcode'
  field: string // Data field containing URL/data
  size: string // e.g., "40%" or "30mm"
}

export interface ImageElement {
  type: 'image'
  field: string // Data field containing image URL/data
  size: string // e.g., "50%" or "40mm"
  aspectRatio?: string // e.g., "16:9" or "1:1"
}

export type LayoutElement = TextElement | QRCodeElement | ImageElement

export interface RegionContent {
  content?: LayoutElement[]
  top?: LayoutElement
  middle?: LayoutElement
  bottom?: LayoutElement
}

export interface LayoutDefinition {
  page: PageConfig
  layout: {
    left?: RegionContent
    right?: RegionContent
    top?: RegionContent
    bottom?: RegionContent
    center?: RegionContent
    // Support for custom regions
    [key: string]: RegionContent | undefined
  }
}

export interface LayoutTemplate {
  id: string
  name: string
  description?: string
  page_size: PageSize
  layout_definition: LayoutDefinition
  is_active: boolean
  is_default: boolean
  version: number
  created_at: string
  updated_at: string
}

// Data binding interface
export interface LayoutData {
  business_name?: string
  contact_name?: string
  phone?: string
  email?: string
  website?: string
  contact_url?: string
  funnel_name?: string
  custom_message?: string
  property_price?: string
  property_state?: string
  property_url?: string
  video_url?: string
  [key: string]: string | undefined
}

// Rendered layout for PDF generation
export interface RenderedElement {
  type: ElementType
  content: string
  position: { x: number; y: number } // in mm
  size: { width: number; height: number } // in mm
  style: {
    fontSize: number
    fontWeight: 'normal' | 'bold'
    alignment: Alignment
    color: string
  }
}

export interface RenderedLayout {
  pageSize: PageSize
  dimensions: { width: number; height: number } // in mm
  margin: number // in mm
  elements: RenderedElement[]
}

// Page dimensions in mm
export const PAGE_DIMENSIONS: Record<PageSize, { width: number; height: number }> = {
  'A4-portrait': { width: 210, height: 297 },
  'A4-landscape': { width: 297, height: 210 },
  'A5-landscape': { width: 210, height: 148 },
  'business-card-landscape': { width: 90, height: 55 }
}

// Aspect ratios for reference
export const PAGE_ASPECT_RATIOS: Record<PageSize, number> = {
  'A4-portrait': 210 / 297,    // 0.707 (1:1.414)
  'A4-landscape': 297 / 210,   // 1.414 (1.414:1)  
  'A5-landscape': 210 / 148,   // 1.419 (1.419:1)
  'business-card-landscape': 90 / 55  // 1.636 (1.636:1)
}

// Text style definitions
export const TEXT_STYLES: Record<TextStyle, { fontSize: number; fontWeight: 'normal' | 'bold' }> = {
  h1: { fontSize: 24, fontWeight: 'bold' },
  h2: { fontSize: 18, fontWeight: 'bold' },
  h3: { fontSize: 16, fontWeight: 'bold' },
  body: { fontSize: 12, fontWeight: 'normal' },
  caption: { fontSize: 10, fontWeight: 'normal' }
}