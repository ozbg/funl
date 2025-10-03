export interface Business {
  id: string
  email: string
  name: string
  type: 'individual' | 'agency'
  phone?: string
  website?: string
  vcard_data: VCardData
  accent_color?: string
  subscription_status: 'trial' | 'active' | 'cancelled'
  subscription_tier: 'basic' | 'pro' | 'enterprise'
  created_at: string
  updated_at: string
}

export interface VCardData {
  firstName: string
  lastName: string
  organization: string
  phone: string
  email: string
  website?: string
  address?: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
}

export interface Funnel {
  id: string
  business_id: string
  name: string
  type: 'contact' | 'property' | 'property-listing' | 'video' | 'testimonial' | 'contact-card' | 'video-showcase' | 'service-callback'
  status: 'draft' | 'active' | 'paused' | 'archived'
  template_id?: string
  qr_code_url?: string
  short_url: string
  content: FunnelContent
  print_status?: 'pending' | 'processing' | 'shipped'
  reserved_code_id?: string
  code_source?: 'generated' | 'reserved'
  wallet_pass_enabled?: boolean
  wallet_pass_config?: Record<string, any>
  wallet_pass_download_count?: number
  wallet_pass_last_updated?: string
  created_at: string
  updated_at: string
  expires_at?: string
}

export interface FunnelContent {
  state?: 'for_sale' | 'sold' | 'coming_soon'
  price?: string
  property_url?: string
  video_url?: string
  video_autoplay?: boolean
  custom_message?: string
  cta_button_text?: string
}

export interface ClickEvent {
  id: string
  funnel_id: string
  session_id: string
  action: 'view' | 'vcard_download' | 'callback_request' | 'link_click'
  metadata: {
    user_agent: string
    ip_country?: string
    referrer?: string
    device_type: 'mobile' | 'desktop'
  }
  created_at: string
}

export interface CallbackRequest {
  id: string
  funnel_id: string
  name: string
  phone: string
  preferred_time?: string
  message?: string
  status: 'pending' | 'contacted' | 'completed'
  created_at: string
}

// Form types
export interface CreateFunnelData {
  name: string
  type: 'contact' | 'property' | 'property-listing' | 'video' | 'testimonial' | 'contact-card' | 'video-showcase' | 'service-callback'
  content?: Partial<FunnelContent>
}

export interface UpdateFunnelData extends Partial<CreateFunnelData> {
  status?: 'draft' | 'active' | 'paused' | 'archived'
  content?: Partial<FunnelContent>
  wallet_pass_enabled?: boolean
}

// Apple Wallet Pass Types
export interface WalletPassConfig {
  enabled: boolean
  backgroundColor: string
  foregroundColor: string
  logoUrl?: string
  stripImageUrl?: string
  showPriceHistory: boolean
  showPropertyFeatures: boolean
  showOpenHouseTimes: boolean
  maxDescriptionLength: number
  expirationDate?: string
  maxDownloads?: number
  autoUpdateEnabled: boolean
  teamIdentifier?: string
  passTypeIdentifier?: string
}

export interface WalletPassInstance {
  id: string
  funnelId: string
  businessId: string
  serialNumber: string
  passTypeIdentifier: string
  authenticationToken: string
  downloadCount: number
  firstDownloadedAt?: string
  lastDownloadedAt?: string
  lastUpdatedAt?: string
  updateTag: string
  deviceLibraryIdentifier?: string
  pushToken?: string
  registeredAt?: string
  status: 'active' | 'expired' | 'revoked'
  userAgent?: string
  ipAddress?: string
  countryCode?: string
  createdAt: string
}

export interface WalletPassUpdate {
  id: string
  passInstanceId: string
  updateType: 'price_change' | 'status_update' | 'content_change' | 'configuration_change'
  oldContent?: Record<string, any>
  newContent?: Record<string, any>
  changeDescription?: string
  notificationSent: boolean
  notificationSentAt?: string
  pushResponseStatus?: string
  pushResponseBody?: string
  createdAt: string
}

export interface WalletPassAnalytics {
  id: string
  funnelId: string
  passInstanceId?: string
  eventType: 'download_requested' | 'download_completed' | 'add_to_wallet' | 'view_in_wallet' | 'remove_from_wallet' | 'registration' | 'unregistration'
  deviceType?: 'iPhone' | 'iPad' | 'iPod' | 'unknown'
  iosVersion?: string
  latitude?: number
  longitude?: number
  sessionId?: string
  userAgent?: string
  ipAddress?: string
  referrer?: string
  metadata?: Record<string, any>
  createdAt: string
}

export interface WalletPassTemplate {
  id: string
  name: string
  description?: string
  templateConfig: Record<string, any>
  category: 'property' | 'contact' | 'event' | 'general'
  businessCategoryId?: string
  isActive: boolean
  isDefault: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

// Apple Pass.json structure types
export interface PassField {
  key: string
  label?: string
  value: string | number
  textAlignment?: 'PKTextAlignmentLeft' | 'PKTextAlignmentCenter' | 'PKTextAlignmentRight' | 'PKTextAlignmentNatural'
  dateStyle?: 'PKDateStyleNone' | 'PKDateStyleShort' | 'PKDateStyleMedium' | 'PKDateStyleLong' | 'PKDateStyleFull'
  timeStyle?: 'PKDateStyleNone' | 'PKDateStyleShort' | 'PKDateStyleMedium' | 'PKDateStyleLong' | 'PKDateStyleFull'
  numberStyle?: 'PKNumberStyleDecimal' | 'PKNumberStylePercent' | 'PKNumberStyleScientific' | 'PKNumberStyleSpellOut'
  currencyCode?: string
  changeMessage?: string
}

export interface PassBarcode {
  message: string
  format: 'PKBarcodeFormatQR' | 'PKBarcodeFormatPDF417' | 'PKBarcodeFormatAztec' | 'PKBarcodeFormatCode128'
  messageEncoding: string
  altText?: string
}

export interface PassLocation {
  latitude: number
  longitude: number
  altitude?: number
  relevantText?: string
}

export interface PassBeacon {
  proximityUUID: string
  major?: number
  minor?: number
  relevantText?: string
}

export interface ApplePassJson {
  formatVersion: number
  passTypeIdentifier: string
  serialNumber: string
  teamIdentifier: string
  organizationName: string
  description: string
  logoText?: string
  backgroundColor?: string
  foregroundColor?: string
  labelColor?: string
  groupingIdentifier?: string
  suppressStripShine?: boolean
  authenticationToken: string
  webServiceURL?: string

  // Pass type specific structure
  generic?: {
    primaryFields?: PassField[]
    secondaryFields?: PassField[]
    auxiliaryFields?: PassField[]
    backFields?: PassField[]
    headerFields?: PassField[]
  }

  // Additional features
  barcodes?: PassBarcode[]
  locations?: PassLocation[]
  beacons?: PassBeacon[]
  maxDistance?: number
  relevantDate?: string
  expirationDate?: string
  voided?: boolean

  // Associated app
  associatedStoreIdentifiers?: number[]
  appLaunchURL?: string

  // User info
  userInfo?: Record<string, any>
}

// Pass generation types
export interface PassGenerationRequest {
  funnelId: string
  customization?: Partial<WalletPassConfig>
  forceRegenerate?: boolean
  passData?: Partial<ApplePassJson>  // Optional pre-mapped pass data from mapper
}

export interface PassGenerationResponse {
  success: boolean
  passUrl?: string
  serialNumber?: string
  passBuffer?: Buffer
  error?: string
}

export interface PropertyPassData {
  // Property Information
  address: string
  price?: string
  priceHistory?: Array<{ date: string; price: string }>
  bedrooms?: number
  bathrooms?: number
  landSize?: string
  propertyType?: 'house' | 'apartment' | 'townhouse' | 'land'
  status: 'for_sale' | 'sold' | 'under_contract' | 'coming_soon'

  // Property Features
  features?: string[]
  description?: string

  // Agent Information
  agentName: string
  agentPhone: string
  agentEmail: string
  agencyName: string
  agencyLogo?: string

  // Marketing Information
  openHouseTimes?: Array<{ date: string; startTime: string; endTime: string }>
  virtualTourUrl?: string
  propertyImages?: string[]

  // Technical
  funnelUrl: string
  qrCodeData: string
}