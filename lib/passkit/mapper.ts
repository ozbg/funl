/**
 * PassKit Content Mapper
 *
 * Maps funnel content and business data to Apple Wallet Pass fields
 * Handles different funnel types and creates appropriate pass layouts
 */

import type {
  Funnel,
  Business,
  FunnelContent,
  ApplePassJson,
  PassField,
  PropertyPassData
} from '../types'
import { PASS_TYPES, DEFAULT_PASS_FIELDS, type PassType } from './config'

export interface PassContentMapper {
  mapFunnelToPassData(funnel: Funnel, business: Business): Promise<Partial<ApplePassJson>>
  mapPropertyListingFields(content: FunnelContent, business: Business): PassField[]
  mapContactCardFields(business: Business): PassField[]
  formatPassField(key: string, label: string, value: string | number): PassField
}

export class PassContentMapperImpl implements PassContentMapper {

  /**
   * Maps a funnel and business data to Apple Pass structure
   */
  async mapFunnelToPassData(funnel: Funnel, business: Business): Promise<Partial<ApplePassJson>> {
    const passType = this.determinePassType(funnel.type)
    const baseData: Partial<ApplePassJson> = {
      description: this.generatePassDescription(funnel, business),
      organizationName: business.name,
      logoText: business.name,

      // QR code linking to funnel
      barcodes: [{
        message: `https://funl.app/f/${funnel.id}`,
        format: 'PKBarcodeFormatQR',
        messageEncoding: 'iso-8859-1',
        altText: `Scan to view ${funnel.name}`
      }],

      userInfo: {
        funnelId: funnel.id,
        funnelType: funnel.type,
        businessId: business.id,
        funnelName: funnel.name
      }
    }

    // Map fields based on funnel type
    switch (passType) {
      case PASS_TYPES.PROPERTY_LISTING:
        baseData.generic = this.mapPropertyListingStructure(funnel, business)
        break

      case PASS_TYPES.CONTACT_CARD:
        baseData.generic = this.mapContactCardStructure(funnel, business)
        break

      default:
        baseData.generic = this.mapGenericStructure(funnel, business)
        break
    }

    return baseData
  }

  /**
   * Maps property listing funnel to pass fields
   */
  mapPropertyListingFields(content: FunnelContent, business: Business): PassField[] {
    const fields: PassField[] = []

    // Property status
    if (content.state) {
      fields.push(this.formatPassField(
        'status',
        'Status',
        this.formatPropertyStatus(content.state)
      ))
    }

    // Property price
    if (content.price) {
      fields.push(this.formatPassField(
        'price',
        'Price',
        content.price
      ))
    }

    // Agent information
    fields.push(this.formatPassField(
      'agent',
      'Agent',
      `${business.vcard_data.firstName} ${business.vcard_data.lastName}`
    ))

    if (business.vcard_data.phone) {
      fields.push(this.formatPassField(
        'agent_phone',
        'Phone',
        business.vcard_data.phone
      ))
    }

    // Custom message
    if (content.custom_message) {
      fields.push(this.formatPassField(
        'message',
        'Message',
        content.custom_message
      ))
    }

    return fields
  }

  /**
   * Maps business contact data to pass fields
   */
  mapContactCardFields(business: Business): PassField[] {
    const fields: PassField[] = []
    const vcard = business.vcard_data

    // Name
    fields.push(this.formatPassField(
      'name',
      'Name',
      `${vcard.firstName} ${vcard.lastName}`
    ))

    // Organization
    fields.push(this.formatPassField(
      'organization',
      'Organization',
      vcard.organization
    ))

    // Phone
    if (vcard.phone) {
      fields.push(this.formatPassField(
        'phone',
        'Phone',
        vcard.phone
      ))
    }

    // Email
    if (vcard.email) {
      fields.push(this.formatPassField(
        'email',
        'Email',
        vcard.email
      ))
    }

    // Website
    if (vcard.website) {
      fields.push(this.formatPassField(
        'website',
        'Website',
        vcard.website
      ))
    }

    // Address
    if (vcard.address) {
      const addressString = [
        vcard.address.street,
        vcard.address.city,
        vcard.address.state,
        vcard.address.postalCode
      ].filter(Boolean).join(', ')

      if (addressString) {
        fields.push(this.formatPassField(
          'address',
          'Address',
          addressString
        ))
      }
    }

    return fields
  }

  /**
   * Creates a properly formatted pass field
   */
  formatPassField(key: string, label: string, value: string | number): PassField {
    return {
      key,
      label,
      value,
      textAlignment: 'PKTextAlignmentLeft'
    }
  }

  /**
   * Maps property listing to pass structure
   */
  private mapPropertyListingStructure(funnel: Funnel, business: Business) {
    const content = funnel.content
    const fields = this.mapPropertyListingFields(content, business)

    return {
      headerFields: this.selectFieldsForSection(fields, ['organization']),
      primaryFields: this.selectFieldsForSection(fields, ['price', 'status']),
      secondaryFields: this.selectFieldsForSection(fields, ['agent']),
      auxiliaryFields: this.selectFieldsForSection(fields, ['agent_phone']),
      backFields: this.selectFieldsForSection(fields, ['message', 'email', 'website', 'address'])
    }
  }

  /**
   * Maps contact card to pass structure
   */
  private mapContactCardStructure(funnel: Funnel, business: Business) {
    const fields = this.mapContactCardFields(business)

    return {
      headerFields: this.selectFieldsForSection(fields, ['organization']),
      primaryFields: this.selectFieldsForSection(fields, ['name']),
      secondaryFields: this.selectFieldsForSection(fields, ['phone']),
      auxiliaryFields: this.selectFieldsForSection(fields, ['email']),
      backFields: this.selectFieldsForSection(fields, ['website', 'address'])
    }
  }

  /**
   * Maps generic funnel to pass structure
   */
  private mapGenericStructure(funnel: Funnel, business: Business) {
    const fields: PassField[] = []

    // Funnel name
    fields.push(this.formatPassField(
      'funnel_name',
      'Campaign',
      funnel.name
    ))

    // Business info
    fields.push(this.formatPassField(
      'business',
      'Business',
      business.name
    ))

    if (business.vcard_data.phone) {
      fields.push(this.formatPassField(
        'phone',
        'Phone',
        business.vcard_data.phone
      ))
    }

    return {
      headerFields: this.selectFieldsForSection(fields, ['business']),
      primaryFields: this.selectFieldsForSection(fields, ['funnel_name']),
      secondaryFields: this.selectFieldsForSection(fields, ['phone']),
      auxiliaryFields: [],
      backFields: []
    }
  }

  /**
   * Selects specific fields for a pass section
   */
  private selectFieldsForSection(fields: PassField[], keys: string[]): PassField[] {
    return fields.filter(field => keys.includes(field.key))
  }

  /**
   * Determines the appropriate pass type for a funnel
   */
  private determinePassType(funnelType: string): PassType {
    switch (funnelType) {
      case 'property':
      case 'property-listing':
        return PASS_TYPES.PROPERTY_LISTING

      case 'contact':
      case 'contact-card':
        return PASS_TYPES.CONTACT_CARD

      default:
        return PASS_TYPES.GENERIC
    }
  }

  /**
   * Generates a descriptive pass description
   */
  private generatePassDescription(funnel: Funnel, business: Business): string {
    switch (funnel.type) {
      case 'property':
      case 'property-listing':
        return `Property listing information from ${business.name}`

      case 'contact':
      case 'contact-card':
        return `Contact information for ${business.name}`

      case 'video':
        return `Video content from ${business.name}`

      case 'testimonial':
        return `Customer testimonial from ${business.name}`

      default:
        return `${funnel.name} from ${business.name}`
    }
  }

  /**
   * Formats property status for display
   */
  private formatPropertyStatus(status: string): string {
    switch (status) {
      case 'for_sale':
        return 'For Sale'
      case 'sold':
        return 'Sold'
      case 'coming_soon':
        return 'Coming Soon'
      default:
        return status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  /**
   * Creates location data for properties (if address available)
   */
  createPropertyLocation(address?: string): { latitude: number; longitude: number } | undefined {
    // In production, this would geocode the address
    // For now, return undefined to skip location features
    return undefined
  }

  /**
   * Generates relevant date for pass (e.g., open house times)
   */
  generateRelevantDate(content: FunnelContent): string | undefined {
    // In production, this could parse open house times or other relevant dates
    return undefined
  }
}

/**
 * Factory function to create a content mapper instance
 */
export const createPassContentMapper = (): PassContentMapper => {
  return new PassContentMapperImpl()
}