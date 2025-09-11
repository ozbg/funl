/**
 * Layout Format Converter
 * 
 * Handles conversion between the enhanced internal format and the database JSON format
 * to maintain backward compatibility with existing layouts.
 */

import { EnhancedLayoutElement } from '@/lib/types/layout-enhanced'

// Original database format (for backward compatibility)
interface LegacyLayoutElement {
  id: string
  type: 'qr_code' | 'text' | 'image'
  field?: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  alignment?: 'left' | 'center' | 'right' | 'justify'
  fontSize?: number
  fontWeight?: string
  color?: string
}

interface DatabaseLayoutConfig {
  elements: LegacyLayoutElement[]
}

/**
 * Convert from database format to enhanced format for the editor
 */
export function importFromDatabase(databaseConfig: DatabaseLayoutConfig): EnhancedLayoutElement[] {
  return databaseConfig.elements.map(legacyElement => {
    // Create enhanced element by spreading legacy element and adding defaults
    const { alignment, ...legacyWithoutAlignment } = legacyElement
    
    const enhanced = {
      ...legacyWithoutAlignment,
      // Convert legacy alignment to textAlign
      textAlign: (alignment || 'left') as 'left' | 'center' | 'right' | 'justify',
      // Set default values for enhanced properties
      verticalAlign: 'top' as const,
      fontFamily: 'helvetica' as const,
      fontStyle: 'normal' as const,
      lineHeight: 1.2,
      letterSpacing: 0,
      textTransform: 'none' as const,
      textDecoration: 'none' as const,
      opacity: 1,
      rotation: 0,
      borderWidth: 0,
      borderStyle: 'solid' as const,
      borderRadius: 0,
      wordWrap: 'break-word' as const,
      overflow: 'visible' as const,
      visible: true,
      locked: false,
      isGroup: false
    } as EnhancedLayoutElement
    
    return enhanced
  })
}

/**
 * Convert from enhanced format back to database format for saving
 */
export function exportToDatabase(enhancedElements: EnhancedLayoutElement[]): DatabaseLayoutConfig {
  const legacyElements: LegacyLayoutElement[] = enhancedElements
    .filter(element => element.visible !== false) // Only export visible elements
    .map(element => {
      const legacy: LegacyLayoutElement = {
        id: element.id,
        type: element.type,
        position: element.position,
        size: element.size
      }

      // Include field for text elements
      if (element.field) {
        legacy.field = element.field
      }

      // Convert textAlign back to legacy alignment
      if (element.textAlign && element.textAlign !== 'justify') {
        legacy.alignment = element.textAlign
      }

      // Include basic styling properties that exist in legacy format
      if (element.fontSize) {
        legacy.fontSize = element.fontSize
      }

      if (element.fontWeight && element.fontWeight !== 'normal') {
        legacy.fontWeight = element.fontWeight
      }

      if (element.color && element.color !== '#000000') {
        legacy.color = element.color
      }

      return legacy
    })

  return {
    elements: legacyElements
  }
}

/**
 * Create a migration plan for enhancing an existing layout
 * This helps identify what enhanced features can be added
 */
export function analyzeLegacyLayout(databaseConfig: DatabaseLayoutConfig) {
  const analysis = {
    totalElements: databaseConfig.elements.length,
    elementTypes: {} as Record<string, number>,
    enhancementOpportunities: [] as string[],
    compatibilityIssues: [] as string[]
  }

  databaseConfig.elements.forEach(element => {
    // Count element types
    analysis.elementTypes[element.type] = (analysis.elementTypes[element.type] || 0) + 1

    // Check for enhancement opportunities
    if (element.type === 'text') {
      if (!element.fontSize) {
        analysis.enhancementOpportunities.push(`Text element "${element.id}" could benefit from fontSize setting`)
      }
      if (element.alignment === 'justify') {
        analysis.compatibilityIssues.push(`Element "${element.id}" uses justify alignment which needs enhanced handling`)
      }
    }

    // Check positioning
    const right = element.position.x + element.size.width
    const bottom = element.position.y + element.size.height
    if (right > 100) {
      analysis.compatibilityIssues.push(`Element "${element.id}" extends beyond right edge (${right}%)`)
    }
    if (bottom > 100) {
      analysis.compatibilityIssues.push(`Element "${element.id}" extends beyond bottom edge (${bottom}%)`)
    }
  })

  return analysis
}

/**
 * Validate that enhanced elements can be safely converted to legacy format
 */
export function validateForExport(enhancedElements: EnhancedLayoutElement[]): {
  isValid: boolean
  warnings: string[]
  errors: string[]
} {
  const warnings: string[] = []
  const errors: string[] = []

  enhancedElements.forEach(element => {
    // Check for unsupported features that will be lost
    if (element.padding && Object.values(element.padding).some(p => p && p > 0)) {
      warnings.push(`Element "${element.id}" has padding which will be lost in legacy format`)
    }

    if (element.margin && Object.values(element.margin).some(m => m && m > 0)) {
      warnings.push(`Element "${element.id}" has margins which will be lost in legacy format`)
    }

    if (element.borderWidth && element.borderWidth > 0) {
      warnings.push(`Element "${element.id}" has borders which will be lost in legacy format`)
    }

    if (element.textAlign === 'justify') {
      warnings.push(`Element "${element.id}" uses justify alignment which may not render correctly in legacy viewers`)
    }

    if (element.rotation && element.rotation !== 0) {
      warnings.push(`Element "${element.id}" has rotation which will be lost in legacy format`)
    }

    // Check for errors
    if (!element.id) {
      errors.push('Element missing required ID')
    }

    if (!element.type) {
      errors.push(`Element "${element.id}" missing required type`)
    }

    const right = element.position.x + element.size.width
    const bottom = element.position.y + element.size.height
    if (right > 100) {
      errors.push(`Element "${element.id}" extends beyond page bounds`)
    }
    if (bottom > 100) {
      errors.push(`Element "${element.id}" extends beyond page bounds`)
    }
  })

  return {
    isValid: errors.length === 0,
    warnings,
    errors
  }
}