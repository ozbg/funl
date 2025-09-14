export interface Business {
  id: string
  email: string
  name: string
  type: 'individual' | 'agency'
  phone?: string
  website?: string
  vcard_data: VCardData
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
  type: 'contact' | 'property' | 'video' | 'testimonial'
  status: 'draft' | 'active' | 'paused' | 'archived'
  template_id?: string
  qr_code_url?: string
  short_url: string
  content: FunnelContent
  print_status?: 'pending' | 'processing' | 'shipped'
  created_at: string
  updated_at: string
  expires_at?: string
}

export interface FunnelContent {
  state?: 'for_sale' | 'sold' | 'coming_soon'
  price?: string
  property_url?: string
  video_url?: string
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
  type: 'contact' | 'property' | 'video' | 'testimonial'
  content?: Partial<FunnelContent>
}

export interface UpdateFunnelData extends Partial<CreateFunnelData> {
  status?: 'draft' | 'active' | 'paused' | 'archived'
  content?: Partial<FunnelContent>
}