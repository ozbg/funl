export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_sessions: {
        Row: {
          action: string
          admin_id: string
          business_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_id: string
          business_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          business_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_sessions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_sessions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      admins: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          last_login: string | null
          name: string
          permissions: Json | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          name: string
          permissions?: Json | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          name?: string
          permissions?: Json | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      business_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      businesses: {
        Row: {
          accent_color: string | null
          business_category_id: string | null
          created_at: string | null
          email: string
          id: string
          is_admin: boolean | null
          name: string
          phone: string | null
          subscription_status: string | null
          subscription_tier: string | null
          type: string | null
          updated_at: string | null
          vcard_data: Json | null
          website: string | null
        }
        Insert: {
          accent_color?: string | null
          business_category_id?: string | null
          created_at?: string | null
          email: string
          id?: string
          is_admin?: boolean | null
          name: string
          phone?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          type?: string | null
          updated_at?: string | null
          vcard_data?: Json | null
          website?: string | null
        }
        Update: {
          accent_color?: string | null
          business_category_id?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_admin?: boolean | null
          name?: string
          phone?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          type?: string | null
          updated_at?: string | null
          vcard_data?: Json | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_business_category_id_fkey"
            columns: ["business_category_id"]
            isOneToOne: false
            referencedRelation: "business_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      callback_requests: {
        Row: {
          created_at: string | null
          funnel_id: string
          id: string
          message: string | null
          name: string
          phone: string
          preferred_time: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          funnel_id: string
          id?: string
          message?: string | null
          name: string
          phone: string
          preferred_time?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          funnel_id?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string
          preferred_time?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "callback_requests_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      category_funnel_types: {
        Row: {
          business_category_id: string | null
          created_at: string | null
          funnel_type_id: string | null
          id: string
          is_enabled: boolean | null
        }
        Insert: {
          business_category_id?: string | null
          created_at?: string | null
          funnel_type_id?: string | null
          id?: string
          is_enabled?: boolean | null
        }
        Update: {
          business_category_id?: string | null
          created_at?: string | null
          funnel_type_id?: string | null
          id?: string
          is_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "category_funnel_types_business_category_id_fkey"
            columns: ["business_category_id"]
            isOneToOne: false
            referencedRelation: "business_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_funnel_types_funnel_type_id_fkey"
            columns: ["funnel_type_id"]
            isOneToOne: false
            referencedRelation: "funnel_types"
            referencedColumns: ["id"]
          },
        ]
      }
      category_qr_presets: {
        Row: {
          business_category_id: string | null
          created_at: string | null
          id: string
          is_enabled: boolean | null
          qr_code_preset_id: string | null
        }
        Insert: {
          business_category_id?: string | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          qr_code_preset_id?: string | null
        }
        Update: {
          business_category_id?: string | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          qr_code_preset_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "category_qr_presets_business_category_id_fkey"
            columns: ["business_category_id"]
            isOneToOne: false
            referencedRelation: "business_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_qr_presets_qr_code_preset_id_fkey"
            columns: ["qr_code_preset_id"]
            isOneToOne: false
            referencedRelation: "qr_code_presets"
            referencedColumns: ["id"]
          },
        ]
      }
      click_events: {
        Row: {
          action: string
          created_at: string | null
          funnel_id: string
          id: string
          metadata: Json | null
          pass_serial_number: string | null
          session_id: string
          wallet_pass_related: boolean | null
        }
        Insert: {
          action: string
          created_at?: string | null
          funnel_id: string
          id?: string
          metadata?: Json | null
          pass_serial_number?: string | null
          session_id: string
          wallet_pass_related?: boolean | null
        }
        Update: {
          action?: string
          created_at?: string | null
          funnel_id?: string
          id?: string
          metadata?: Json | null
          pass_serial_number?: string | null
          session_id?: string
          wallet_pass_related?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "click_events_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_testimonial_config: {
        Row: {
          created_at: string | null
          display_count: number | null
          display_style: string | null
          enabled: boolean | null
          funnel_id: string
          id: string
          minimum_rating: number | null
          position: string | null
          show_featured_only: boolean | null
          show_share_button: boolean | null
          theme_override: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_count?: number | null
          display_style?: string | null
          enabled?: boolean | null
          funnel_id: string
          id?: string
          minimum_rating?: number | null
          position?: string | null
          show_featured_only?: boolean | null
          show_share_button?: boolean | null
          theme_override?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_count?: number | null
          display_style?: string | null
          enabled?: boolean | null
          funnel_id?: string
          id?: string
          minimum_rating?: number | null
          position?: string | null
          show_featured_only?: boolean | null
          show_share_button?: boolean | null
          theme_override?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funnel_testimonial_config_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: true
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_types: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          sort_order: number | null
          template_config: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
          template_config?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
          template_config?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      funnel_wallet_pass_config: {
        Row: {
          auto_update_enabled: boolean | null
          background_color: string | null
          created_at: string | null
          enabled: boolean | null
          expiration_date: string | null
          foreground_color: string | null
          funnel_id: string
          id: string
          logo_url: string | null
          max_description_length: number | null
          max_downloads: number | null
          pass_type_identifier: string | null
          show_open_house_times: boolean | null
          show_price_history: boolean | null
          show_property_features: boolean | null
          strip_image_url: string | null
          team_identifier: string | null
          updated_at: string | null
        }
        Insert: {
          auto_update_enabled?: boolean | null
          background_color?: string | null
          created_at?: string | null
          enabled?: boolean | null
          expiration_date?: string | null
          foreground_color?: string | null
          funnel_id: string
          id?: string
          logo_url?: string | null
          max_description_length?: number | null
          max_downloads?: number | null
          pass_type_identifier?: string | null
          show_open_house_times?: boolean | null
          show_price_history?: boolean | null
          show_property_features?: boolean | null
          strip_image_url?: string | null
          team_identifier?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_update_enabled?: boolean | null
          background_color?: string | null
          created_at?: string | null
          enabled?: boolean | null
          expiration_date?: string | null
          foreground_color?: string | null
          funnel_id?: string
          id?: string
          logo_url?: string | null
          max_description_length?: number | null
          max_downloads?: number | null
          pass_type_identifier?: string | null
          show_open_house_times?: boolean | null
          show_price_history?: boolean | null
          show_property_features?: boolean | null
          strip_image_url?: string | null
          team_identifier?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funnel_wallet_pass_config_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: true
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      funnels: {
        Row: {
          business_id: string
          code_source: string | null
          content: Json | null
          created_at: string | null
          expires_at: string | null
          funnel_type_id: string | null
          id: string
          name: string
          print_status: string | null
          qr_code_url: string | null
          qr_preset_id: string | null
          reserved_code_id: string | null
          short_url: string | null
          status: string | null
          template_id: string | null
          type: string
          updated_at: string | null
          wallet_pass_config: Json | null
          wallet_pass_download_count: number | null
          wallet_pass_enabled: boolean | null
          wallet_pass_last_updated: string | null
        }
        Insert: {
          business_id: string
          code_source?: string | null
          content?: Json | null
          created_at?: string | null
          expires_at?: string | null
          funnel_type_id?: string | null
          id?: string
          name: string
          print_status?: string | null
          qr_code_url?: string | null
          qr_preset_id?: string | null
          reserved_code_id?: string | null
          short_url?: string | null
          status?: string | null
          template_id?: string | null
          type: string
          updated_at?: string | null
          wallet_pass_config?: Json | null
          wallet_pass_download_count?: number | null
          wallet_pass_enabled?: boolean | null
          wallet_pass_last_updated?: string | null
        }
        Update: {
          business_id?: string
          code_source?: string | null
          content?: Json | null
          created_at?: string | null
          expires_at?: string | null
          funnel_type_id?: string | null
          id?: string
          name?: string
          print_status?: string | null
          qr_code_url?: string | null
          qr_preset_id?: string | null
          reserved_code_id?: string | null
          short_url?: string | null
          status?: string | null
          template_id?: string | null
          type?: string
          updated_at?: string | null
          wallet_pass_config?: Json | null
          wallet_pass_download_count?: number | null
          wallet_pass_enabled?: boolean | null
          wallet_pass_last_updated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funnels_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnels_funnel_type_id_fkey"
            columns: ["funnel_type_id"]
            isOneToOne: false
            referencedRelation: "funnel_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnels_qr_preset_id_fkey"
            columns: ["qr_preset_id"]
            isOneToOne: false
            referencedRelation: "qr_code_presets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnels_reserved_code_id_fkey"
            columns: ["reserved_code_id"]
            isOneToOne: false
            referencedRelation: "reserved_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      message_channels: {
        Row: {
          business_id: string | null
          channel_type: string
          config: Json
          created_at: string | null
          id: string
          is_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          business_id?: string | null
          channel_type: string
          config?: Json
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string | null
          channel_type?: string
          config?: Json
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_channels_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          business_id: string | null
          contact_email: string | null
          contact_name: string
          contact_phone: string | null
          created_at: string | null
          email_sent_at: string | null
          email_status: string | null
          funnel_id: string | null
          id: string
          message: string | null
          metadata: Json | null
          priority: string | null
          sms_sent_at: string | null
          sms_status: string | null
          status: string | null
          subject: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          business_id?: string | null
          contact_email?: string | null
          contact_name: string
          contact_phone?: string | null
          created_at?: string | null
          email_sent_at?: string | null
          email_status?: string | null
          funnel_id?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          priority?: string | null
          sms_sent_at?: string | null
          sms_status?: string | null
          status?: string | null
          subject?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          business_id?: string | null
          contact_email?: string | null
          contact_name?: string
          contact_phone?: string | null
          created_at?: string | null
          email_sent_at?: string | null
          email_status?: string | null
          funnel_id?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          priority?: string | null
          sms_sent_at?: string | null
          sms_status?: string | null
          status?: string | null
          subject?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          business_id: string | null
          created_at: string | null
          email_daily_summary: boolean | null
          email_new_messages: boolean | null
          email_weekly_summary: boolean | null
          id: string
          show_badge: boolean | null
          show_toast: boolean | null
          sms_urgent_only: boolean | null
          updated_at: string | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          email_daily_summary?: boolean | null
          email_new_messages?: boolean | null
          email_weekly_summary?: boolean | null
          id?: string
          show_badge?: boolean | null
          show_toast?: boolean | null
          sms_urgent_only?: boolean | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          email_daily_summary?: boolean | null
          email_new_messages?: boolean | null
          email_weekly_summary?: boolean | null
          id?: string
          show_badge?: boolean | null
          show_toast?: boolean | null
          sms_urgent_only?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_code_presets: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          preview_url: string | null
          slug: string
          sort_order: number | null
          style_config: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          preview_url?: string | null
          slug: string
          sort_order?: number | null
          style_config?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          preview_url?: string | null
          slug?: string
          sort_order?: number | null
          style_config?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      testimonial_settings: {
        Row: {
          auto_approve: boolean | null
          business_id: string
          created_at: string | null
          id: string
          max_comment_length: number | null
          min_comment_length: number | null
          notification_emails: string[] | null
          notify_on_submission: boolean | null
          profanity_filter: boolean | null
          rate_limit_minutes: number | null
          require_captcha: boolean | null
          require_email: boolean | null
          require_rating: boolean | null
          updated_at: string | null
        }
        Insert: {
          auto_approve?: boolean | null
          business_id: string
          created_at?: string | null
          id?: string
          max_comment_length?: number | null
          min_comment_length?: number | null
          notification_emails?: string[] | null
          notify_on_submission?: boolean | null
          profanity_filter?: boolean | null
          rate_limit_minutes?: number | null
          require_captcha?: boolean | null
          require_email?: boolean | null
          require_rating?: boolean | null
          updated_at?: string | null
        }
        Update: {
          auto_approve?: boolean | null
          business_id?: string
          created_at?: string | null
          id?: string
          max_comment_length?: number | null
          min_comment_length?: number | null
          notification_emails?: string[] | null
          notify_on_submission?: boolean | null
          profanity_filter?: boolean | null
          rate_limit_minutes?: number | null
          require_captcha?: boolean | null
          require_email?: boolean | null
          require_rating?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "testimonial_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          business_id: string
          comment: string
          created_at: string | null
          display_order: number | null
          edited_comment: string | null
          email: string | null
          featured: boolean | null
          funnel_id: string | null
          id: string
          internal_notes: string | null
          ip_address: unknown | null
          name: string
          phone: string | null
          rating: number | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string | null
          suburb: string
          updated_at: string | null
          user_agent: string | null
        }
        Insert: {
          business_id: string
          comment: string
          created_at?: string | null
          display_order?: number | null
          edited_comment?: string | null
          email?: string | null
          featured?: boolean | null
          funnel_id?: string | null
          id?: string
          internal_notes?: string | null
          ip_address?: unknown | null
          name: string
          phone?: string | null
          rating?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
          suburb: string
          updated_at?: string | null
          user_agent?: string | null
        }
        Update: {
          business_id?: string
          comment?: string
          created_at?: string | null
          display_order?: number | null
          edited_comment?: string | null
          email?: string | null
          featured?: boolean | null
          funnel_id?: string | null
          id?: string
          internal_notes?: string | null
          ip_address?: unknown | null
          name?: string
          phone?: string | null
          rating?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
          suburb?: string
          updated_at?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "testimonials_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_pass_analytics: {
        Row: {
          created_at: string | null
          device_type: string | null
          event_type: string
          funnel_id: string
          id: string
          ios_version: string | null
          ip_address: unknown | null
          latitude: number | null
          longitude: number | null
          metadata: Json | null
          pass_instance_id: string | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          device_type?: string | null
          event_type: string
          funnel_id: string
          id?: string
          ios_version?: string | null
          ip_address?: unknown | null
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          pass_instance_id?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          device_type?: string | null
          event_type?: string
          funnel_id?: string
          id?: string
          ios_version?: string | null
          ip_address?: unknown | null
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          pass_instance_id?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_pass_analytics_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_pass_analytics_pass_instance_id_fkey"
            columns: ["pass_instance_id"]
            isOneToOne: false
            referencedRelation: "wallet_pass_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_pass_instances: {
        Row: {
          authentication_token: string
          business_id: string
          country_code: string | null
          created_at: string | null
          device_library_identifier: string | null
          download_count: number | null
          first_downloaded_at: string | null
          funnel_id: string
          id: string
          ip_address: unknown | null
          last_downloaded_at: string | null
          last_updated_at: string | null
          pass_type_identifier: string
          push_token: string | null
          registered_at: string | null
          serial_number: string
          status: string | null
          update_tag: string | null
          user_agent: string | null
        }
        Insert: {
          authentication_token: string
          business_id: string
          country_code?: string | null
          created_at?: string | null
          device_library_identifier?: string | null
          download_count?: number | null
          first_downloaded_at?: string | null
          funnel_id: string
          id?: string
          ip_address?: unknown | null
          last_downloaded_at?: string | null
          last_updated_at?: string | null
          pass_type_identifier: string
          push_token?: string | null
          registered_at?: string | null
          serial_number: string
          status?: string | null
          update_tag?: string | null
          user_agent?: string | null
        }
        Update: {
          authentication_token?: string
          business_id?: string
          country_code?: string | null
          created_at?: string | null
          device_library_identifier?: string | null
          download_count?: number | null
          first_downloaded_at?: string | null
          funnel_id?: string
          id?: string
          ip_address?: unknown | null
          last_downloaded_at?: string | null
          last_updated_at?: string | null
          pass_type_identifier?: string
          push_token?: string | null
          registered_at?: string | null
          serial_number?: string
          status?: string | null
          update_tag?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_pass_instances_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_pass_instances_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_pass_templates: {
        Row: {
          business_category_id: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          sort_order: number | null
          template_config: Json
          updated_at: string | null
        }
        Insert: {
          business_category_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          sort_order?: number | null
          template_config?: Json
          updated_at?: string | null
        }
        Update: {
          business_category_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          sort_order?: number | null
          template_config?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_pass_templates_business_category_id_fkey"
            columns: ["business_category_id"]
            isOneToOne: false
            referencedRelation: "business_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_pass_updates: {
        Row: {
          change_description: string | null
          created_at: string | null
          id: string
          new_content: Json | null
          notification_sent: boolean | null
          notification_sent_at: string | null
          old_content: Json | null
          pass_instance_id: string
          push_response_body: string | null
          push_response_status: string | null
          update_type: string
        }
        Insert: {
          change_description?: string | null
          created_at?: string | null
          id?: string
          new_content?: Json | null
          notification_sent?: boolean | null
          notification_sent_at?: string | null
          old_content?: Json | null
          pass_instance_id: string
          push_response_body?: string | null
          push_response_status?: string | null
          update_type: string
        }
        Update: {
          change_description?: string | null
          created_at?: string | null
          id?: string
          new_content?: Json | null
          notification_sent?: boolean | null
          notification_sent_at?: string | null
          old_content?: Json | null
          pass_instance_id?: string
          push_response_body?: string | null
          push_response_status?: string | null
          update_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_pass_updates_pass_instance_id_fkey"
            columns: ["pass_instance_id"]
            isOneToOne: false
            referencedRelation: "wallet_pass_instances"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

// Additional types for testimonials
export type TestimonialStatus = 'pending' | 'approved' | 'rejected' | 'archived' | 'featured'
export type DisplayStyle = 'carousel' | 'grid' | 'list'
export type DisplayPosition = 'top' | 'bottom' | 'sidebar'

export interface TestimonialWithBusinessInfo extends Tables<'testimonials'> {
  business: {
    name: string
    email: string
  }
}