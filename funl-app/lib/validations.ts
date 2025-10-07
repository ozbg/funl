import { z } from 'zod'

export const CreateFunnelSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  type: z.string().min(1, 'Funnel type is required'),
  code_source: z.enum(['generated', 'reserved']).optional().default('generated'),
  reserved_code_id: z.string().uuid().optional(),
  content: z.object({
    state: z.enum(['for_sale', 'sold', 'coming_soon']).optional(),
    price: z.string().max(50, 'Price too long').optional(),
    property_url: z.string().url('Invalid URL').optional().or(z.literal('')),
    video_url: z.string().url('Invalid URL').optional().or(z.literal('')),
    video_autoplay: z.boolean().optional(),
    custom_message: z.string().max(500, 'Message too long').optional(),
    cta_button_text: z.string().max(50, 'CTA text too long').optional(),
    property_address: z.string().max(200, 'Address too long').optional(),
    open_house_time: z.string().optional(),
  }).optional(),
})

export const UpdateFunnelSchema = CreateFunnelSchema.partial().extend({
  status: z.enum(['draft', 'active', 'paused', 'archived']).optional(),
  wallet_pass_enabled: z.boolean().optional(),
})

export const CallbackRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  phone: z.string().min(1, 'Phone is required').max(20, 'Phone too long'),
  preferred_time: z.string().max(100, 'Time preference too long').optional(),
  message: z.string().max(500, 'Message too long').optional(),
})

export const VCardSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  organization: z.string().min(1, 'Organization is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email'),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string(),
  }).optional(),
})

export type CreateFunnelInput = z.infer<typeof CreateFunnelSchema>
export type UpdateFunnelInput = z.infer<typeof UpdateFunnelSchema>
export type CallbackRequestInput = z.infer<typeof CallbackRequestSchema>
export type VCardInput = z.infer<typeof VCardSchema>

// Apple Wallet Pass validation schemas
export const WalletPassConfigSchema = z.object({
  enabled: z.boolean().default(false),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color').default('#ffffff'),
  foregroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color').default('#000000'),
  logoUrl: z.string().url().optional(),
  stripImageUrl: z.string().url().optional(),
  showPriceHistory: z.boolean().default(false),
  showPropertyFeatures: z.boolean().default(true),
  showOpenHouseTimes: z.boolean().default(true),
  maxDescriptionLength: z.number().min(50).max(1000).default(200),
  expirationDate: z.string().datetime().optional(),
  maxDownloads: z.number().positive().optional(),
  autoUpdateEnabled: z.boolean().default(true),
  teamIdentifier: z.string().length(10).optional(),
  passTypeIdentifier: z.string().min(1).max(255).optional(),
})

export const PassGenerationRequestSchema = z.object({
  funnelId: z.string().uuid('Invalid funnel ID'),
  customization: WalletPassConfigSchema.partial().optional(),
  forceRegenerate: z.boolean().default(false),
})

export const PassFieldSchema = z.object({
  key: z.string().min(1),
  label: z.string().optional(),
  value: z.union([z.string(), z.number()]),
  textAlignment: z.enum(['PKTextAlignmentLeft', 'PKTextAlignmentCenter', 'PKTextAlignmentRight', 'PKTextAlignmentNatural']).optional(),
  dateStyle: z.enum(['PKDateStyleNone', 'PKDateStyleShort', 'PKDateStyleMedium', 'PKDateStyleLong', 'PKDateStyleFull']).optional(),
  timeStyle: z.enum(['PKDateStyleNone', 'PKDateStyleShort', 'PKDateStyleMedium', 'PKDateStyleLong', 'PKDateStyleFull']).optional(),
  numberStyle: z.enum(['PKNumberStyleDecimal', 'PKNumberStylePercent', 'PKNumberStyleScientific', 'PKNumberStyleSpellOut']).optional(),
  currencyCode: z.string().length(3).optional(),
  changeMessage: z.string().optional(),
})

export const PassBarcodeSchema = z.object({
  message: z.string().min(1),
  format: z.enum(['PKBarcodeFormatQR', 'PKBarcodeFormatPDF417', 'PKBarcodeFormatAztec', 'PKBarcodeFormatCode128']),
  messageEncoding: z.string().default('iso-8859-1'),
  altText: z.string().optional(),
})

export const PassLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  altitude: z.number().optional(),
  relevantText: z.string().optional(),
})

export const ApplePassJsonSchema = z.object({
  formatVersion: z.number().int().positive().default(1),
  passTypeIdentifier: z.string().min(1),
  serialNumber: z.string().min(1),
  teamIdentifier: z.string().length(10),
  organizationName: z.string().min(1),
  description: z.string().min(1),
  logoText: z.string().optional(),
  backgroundColor: z.string().regex(/^rgb\(\d+,\s*\d+,\s*\d+\)$/).optional(),
  foregroundColor: z.string().regex(/^rgb\(\d+,\s*\d+,\s*\d+\)$/).optional(),
  labelColor: z.string().regex(/^rgb\(\d+,\s*\d+,\s*\d+\)$/).optional(),
  groupingIdentifier: z.string().optional(),
  suppressStripShine: z.boolean().optional(),
  authenticationToken: z.string().min(16),
  webServiceURL: z.string().url().optional(),
  generic: z.object({
    primaryFields: z.array(PassFieldSchema).optional(),
    secondaryFields: z.array(PassFieldSchema).optional(),
    auxiliaryFields: z.array(PassFieldSchema).optional(),
    backFields: z.array(PassFieldSchema).optional(),
    headerFields: z.array(PassFieldSchema).optional(),
  }).optional(),
  barcodes: z.array(PassBarcodeSchema).optional(),
  locations: z.array(PassLocationSchema).optional(),
  maxDistance: z.number().positive().optional(),
  relevantDate: z.string().datetime().optional(),
  expirationDate: z.string().datetime().optional(),
  voided: z.boolean().optional(),
  associatedStoreIdentifiers: z.array(z.number().int().positive()).optional(),
  appLaunchURL: z.string().url().optional(),
  userInfo: z.record(z.string(), z.any()).optional(),
})

export type WalletPassConfigInput = z.infer<typeof WalletPassConfigSchema>
export type PassGenerationRequestInput = z.infer<typeof PassGenerationRequestSchema>
export type PassFieldInput = z.infer<typeof PassFieldSchema>
export type PassBarcodeInput = z.infer<typeof PassBarcodeSchema>
export type PassLocationInput = z.infer<typeof PassLocationSchema>
export type ApplePassJsonInput = z.infer<typeof ApplePassJsonSchema>