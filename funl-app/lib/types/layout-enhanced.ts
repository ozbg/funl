// Enhanced Layout Types with full styling capabilities

export interface Spacing {
  top: number
  right: number
  bottom: number
  left: number
}

export interface EnhancedLayoutElement {
  id: string
  type: 'qr_code' | 'text' | 'image'
  field?: string
  position: { x: number; y: number } // percentage based
  size: { width: number; height: number } // percentage based
  
  // Text alignment
  alignment?: 'left' | 'center' | 'right' // Horizontal alignment (legacy, kept for compatibility)
  textAlign?: 'left' | 'center' | 'right' | 'justify' // Enhanced horizontal alignment
  verticalAlign?: 'top' | 'middle' | 'bottom'
  
  // Typography
  fontSize?: number // in points
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'
  fontFamily?: 'helvetica' | 'times' | 'courier' | 'system-ui' | 'arial' | 'georgia'
  lineHeight?: number // multiplier (e.g., 1.5 = 150%)
  letterSpacing?: number // in pixels
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  
  // Spacing
  padding?: Partial<Spacing> // in percentage
  margin?: Partial<Spacing> // in percentage
  
  // Colors
  color?: string // hex color or rgba
  backgroundColor?: string // hex color or rgba
  
  // Borders
  borderWidth?: number // in pixels
  borderColor?: string // hex color or rgba
  borderStyle?: 'solid' | 'dashed' | 'dotted'
  borderRadius?: number // in percentage of element size
  
  // Effects
  opacity?: number // 0-1
  rotation?: number // in degrees
  shadow?: {
    offsetX: number // in pixels
    offsetY: number // in pixels
    blur: number // in pixels
    color: string // hex color or rgba
  }
  
  // Advanced text options
  textDecoration?: 'none' | 'underline' | 'overline' | 'line-through'
  fontStyle?: 'normal' | 'italic'
  wordWrap?: 'normal' | 'break-word' | 'no-wrap'
  overflow?: 'visible' | 'hidden' | 'ellipsis'
  maxLines?: number // Maximum number of lines before truncation
  
  // Element state properties
  visible?: boolean // Element visibility
  locked?: boolean // Prevent editing
  isGroup?: boolean // Whether this element is a group
  groupedElements?: EnhancedLayoutElement[] // Elements within this group
}

export interface EnhancedPrintLayout {
  id: string
  name: string
  print_type: 'A4_portrait' | 'A5_portrait' | 'A5_landscape'
  is_active: boolean
  is_default: boolean
  layout_config: {
    elements: EnhancedLayoutElement[]
    // Global layout settings
    pageMargin?: Partial<Spacing> // Page margins in mm
    backgroundColor?: string // Page background color
    gridSize?: number // Grid snap size for editor
  }
  created_at?: string
  updated_at?: string
}

// Helper function to get default spacing
export const defaultSpacing = (): Spacing => ({
  top: 0,
  right: 0,
  bottom: 0,
  left: 0
})

// Helper function to merge partial spacing with defaults
export const mergeSpacing = (partial?: Partial<Spacing>): Spacing => ({
  ...defaultSpacing(),
  ...partial
})

// Helper to convert legacy alignment to textAlign
export const getLegacyAlignment = (element: EnhancedLayoutElement): 'left' | 'center' | 'right' => {
  const align = element.textAlign || element.alignment || 'left'
  // Handle 'justify' by converting to 'left' for legacy compatibility
  return align === 'justify' ? 'left' : align
}

// Default element properties
export const defaultElementStyle: Partial<EnhancedLayoutElement> = {
  fontSize: 14,
  fontWeight: 'normal',
  fontFamily: 'helvetica',
  lineHeight: 1.2,
  letterSpacing: 0,
  textTransform: 'none',
  color: '#000000',
  opacity: 1,
  rotation: 0,
  borderWidth: 0,
  borderStyle: 'solid',
  borderRadius: 0,
  textDecoration: 'none',
  fontStyle: 'normal',
  wordWrap: 'break-word',
  overflow: 'visible',
  verticalAlign: 'top',
  textAlign: 'left'
}

// Merge element with defaults
export const mergeElementWithDefaults = (element: Partial<EnhancedLayoutElement>): EnhancedLayoutElement => {
  return {
    ...defaultElementStyle,
    ...element,
    padding: mergeSpacing(element.padding),
    margin: mergeSpacing(element.margin),
  } as EnhancedLayoutElement
}