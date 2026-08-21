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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activation_steps: {
        Row: {
          created_at: string
          description_ar: string | null
          device_type: string
          id: string
          image_url: string | null
          is_active: boolean
          step_order: number
          title_ar: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_ar?: string | null
          device_type: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          step_order: number
          title_ar: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_ar?: string | null
          device_type?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          step_order?: number
          title_ar?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: {
          action: string
          admin_user_id: string | null
          changes: Json
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          changes?: Json
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          changes?: Json
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          last_login_at: string | null
          permission_overrides: Json
          phone: string | null
          role: Database["public"]["Enums"]["admin_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          permission_overrides?: Json
          phone?: string | null
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          permission_overrides?: Json
          phone?: string | null
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      articles: {
        Row: {
          author: string
          category: string | null
          content_md: string
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          slug: string
          title_ar: string
          updated_at: string
          view_count: number
        }
        Insert: {
          author?: string
          category?: string | null
          content_md: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug: string
          title_ar: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          author?: string
          category?: string | null
          content_md?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug?: string
          title_ar?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          gradient_key: string | null
          icon_key: string | null
          id: string
          image_url: string | null
          name_ar: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          gradient_key?: string | null
          icon_key?: string | null
          id?: string
          image_url?: string | null
          name_ar: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          gradient_key?: string | null
          icon_key?: string | null
          id?: string
          image_url?: string | null
          name_ar?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      coupons: {
        Row: {
          applies_to_duration_min: number
          code: string
          created_at: string
          discount_percent: number
          id: string
          is_active: boolean
          valid_until: string | null
        }
        Insert: {
          applies_to_duration_min?: number
          code: string
          created_at?: string
          discount_percent?: number
          id?: string
          is_active?: boolean
          valid_until?: string | null
        }
        Update: {
          applies_to_duration_min?: number
          code?: string
          created_at?: string
          discount_percent?: number
          id?: string
          is_active?: boolean
          valid_until?: string | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string | null
          currency: string
          description: string
          expense_date: string
          id: string
          receipt_url: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description: string
          expense_date: string
          id?: string
          receipt_url?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string
          expense_date?: string
          id?: string
          receipt_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      financial_periods: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          created_at: string
          id: string
          month: number
          snapshot: Json | null
          status: string
          updated_at: string
          year: number
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          id?: string
          month: number
          snapshot?: Json | null
          status?: string
          updated_at?: string
          year: number
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          id?: string
          month?: number
          snapshot?: Json | null
          status?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      order_rate_limits: {
        Row: {
          count_24h: number
          last_order_at: string
          phone: string
        }
        Insert: {
          count_24h?: number
          last_order_at?: string
          phone: string
        }
        Update: {
          count_24h?: number
          last_order_at?: string
          phone?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          backup_subscription_id: string | null
          city: string | null
          coupon_code: string | null
          created_at: string
          credentials_sent_at: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string
          discount: number
          fulfilled_at: string | null
          fulfilled_by: string | null
          id: string
          is_test: boolean
          items: Json
          notes: string | null
          order_number: string
          payment_method: string
          primary_subscription_id: string | null
          status: string
          subscription_extra_info: Json | null
          subscription_password: string | null
          subscription_url: string | null
          subscription_username: string | null
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
          vat: number
          whatsapp_messages_sent: Json
        }
        Insert: {
          backup_subscription_id?: string | null
          city?: string | null
          coupon_code?: string | null
          created_at?: string
          credentials_sent_at?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          discount?: number
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          id?: string
          is_test?: boolean
          items?: Json
          notes?: string | null
          order_number: string
          payment_method?: string
          primary_subscription_id?: string | null
          status?: string
          subscription_extra_info?: Json | null
          subscription_password?: string | null
          subscription_url?: string | null
          subscription_username?: string | null
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
          vat?: number
          whatsapp_messages_sent?: Json
        }
        Update: {
          backup_subscription_id?: string | null
          city?: string | null
          coupon_code?: string | null
          created_at?: string
          credentials_sent_at?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          discount?: number
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          id?: string
          is_test?: boolean
          items?: Json
          notes?: string | null
          order_number?: string
          payment_method?: string
          primary_subscription_id?: string | null
          status?: string
          subscription_extra_info?: Json | null
          subscription_password?: string | null
          subscription_url?: string | null
          subscription_username?: string | null
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
          vat?: number
          whatsapp_messages_sent?: Json
        }
        Relationships: [
          {
            foreignKeyName: "orders_backup_subscription_id_fkey"
            columns: ["backup_subscription_id"]
            isOneToOne: false
            referencedRelation: "subscription_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_fulfilled_by_fkey"
            columns: ["fulfilled_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_primary_subscription_id_fkey"
            columns: ["primary_subscription_id"]
            isOneToOne: false
            referencedRelation: "subscription_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_fees: {
        Row: {
          created_at: string
          fee_amount: number
          fee_percent: number | null
          id: string
          order_id: string
          payment_transaction_id: string | null
          provider: string
        }
        Insert: {
          created_at?: string
          fee_amount: number
          fee_percent?: number | null
          id?: string
          order_id: string
          payment_transaction_id?: string | null
          provider?: string
        }
        Update: {
          created_at?: string
          fee_amount?: number
          fee_percent?: number | null
          id?: string
          order_id?: string
          payment_transaction_id?: string | null
          provider?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_fees_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_fees_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_production"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_fees_payment_transaction_id_fkey"
            columns: ["payment_transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          callback_payload: Json | null
          checkout_url: string | null
          created_at: string
          currency: string
          id: string
          last_error: string | null
          order_id: string
          order_number: string
          provider: string
          provider_order_id: string | null
          provider_trans_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          callback_payload?: Json | null
          checkout_url?: string | null
          created_at?: string
          currency?: string
          id?: string
          last_error?: string | null
          order_id: string
          order_number: string
          provider?: string
          provider_order_id?: string | null
          provider_trans_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          callback_payload?: Json | null
          checkout_url?: string | null
          created_at?: string
          currency?: string
          id?: string
          last_error?: string | null
          order_id?: string
          order_number?: string
          provider?: string
          provider_order_id?: string | null
          provider_trans_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_costs: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          effective_from: string
          effective_to: string | null
          id: string
          note: string | null
          product_slug: string
          unit_cost: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          note?: string | null
          product_slug: string
          unit_cost: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          note?: string | null
          product_slug?: string
          unit_cost?: number
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          base_price: number
          category_id: string | null
          compatibility: Json
          created_at: string
          currency: string
          description: string | null
          duration_months: number | null
          features: Json
          gradient_key: string | null
          icon_key: string | null
          id: string
          image_urls: string[]
          is_active: boolean
          is_bestseller: boolean
          is_featured: boolean
          name_ar: string
          rating: number
          sale_price: number | null
          sales_count: number
          slug: string
          sort_order: number
          stock_management_enabled: boolean
        }
        Insert: {
          base_price?: number
          category_id?: string | null
          compatibility?: Json
          created_at?: string
          currency?: string
          description?: string | null
          duration_months?: number | null
          features?: Json
          gradient_key?: string | null
          icon_key?: string | null
          id?: string
          image_urls?: string[]
          is_active?: boolean
          is_bestseller?: boolean
          is_featured?: boolean
          name_ar: string
          rating?: number
          sale_price?: number | null
          sales_count?: number
          slug: string
          sort_order?: number
          stock_management_enabled?: boolean
        }
        Update: {
          base_price?: number
          category_id?: string | null
          compatibility?: Json
          created_at?: string
          currency?: string
          description?: string | null
          duration_months?: number | null
          features?: Json
          gradient_key?: string | null
          icon_key?: string | null
          id?: string
          image_urls?: string[]
          is_active?: boolean
          is_bestseller?: boolean
          is_featured?: boolean
          name_ar?: string
          rating?: number
          sale_price?: number | null
          sales_count?: number
          slug?: string
          sort_order?: number
          stock_management_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      refunds: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          order_id: string
          reason: string | null
          refunded_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          order_id: string
          reason?: string | null
          refunded_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          order_id?: string
          reason?: string | null
          refunded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_production"
            referencedColumns: ["id"]
          },
        ]
      }
      store_reviews: {
        Row: {
          created_at: string
          customer_city: string | null
          customer_name: string
          display_order: number
          id: string
          is_active: boolean
          product_label: string | null
          rating: number
          review_text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_city?: string | null
          customer_name: string
          display_order?: number
          id?: string
          is_active?: boolean
          product_label?: string | null
          rating?: number
          review_text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_city?: string | null
          customer_name?: string
          display_order?: number
          id?: string
          is_active?: boolean
          product_label?: string | null
          rating?: number
          review_text?: string
          updated_at?: string
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          created_at: string
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Relationships: []
      }
      subscription_inventory: {
        Row: {
          claimed_at: string | null
          claimed_order_id: string | null
          claimed_role: string | null
          cogs: number | null
          cogs_currency: string | null
          created_at: string
          created_by: string | null
          device_limit: number
          duration_months: number
          expires_at: string | null
          extra_info: Json | null
          id: string
          notes: string | null
          password: string
          provider: Database["public"]["Enums"]["subscription_provider"]
          status: string
          updated_at: string
          url: string | null
          username: string
        }
        Insert: {
          claimed_at?: string | null
          claimed_order_id?: string | null
          claimed_role?: string | null
          cogs?: number | null
          cogs_currency?: string | null
          created_at?: string
          created_by?: string | null
          device_limit?: number
          duration_months: number
          expires_at?: string | null
          extra_info?: Json | null
          id?: string
          notes?: string | null
          password: string
          provider: Database["public"]["Enums"]["subscription_provider"]
          status?: string
          updated_at?: string
          url?: string | null
          username: string
        }
        Update: {
          claimed_at?: string | null
          claimed_order_id?: string | null
          claimed_role?: string | null
          cogs?: number | null
          cogs_currency?: string | null
          created_at?: string
          created_by?: string | null
          device_limit?: number
          duration_months?: number
          expires_at?: string | null
          extra_info?: Json | null
          id?: string
          notes?: string | null
          password?: string
          provider?: Database["public"]["Enums"]["subscription_provider"]
          status?: string
          updated_at?: string
          url?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_inventory_claimed_order_id_fkey"
            columns: ["claimed_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_inventory_claimed_order_id_fkey"
            columns: ["claimed_order_id"]
            isOneToOne: false
            referencedRelation: "orders_production"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
    }
    Views: {
      orders_production: {
        Row: {
          city: string | null
          coupon_code: string | null
          created_at: string | null
          credentials_sent_at: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          discount: number | null
          fulfilled_at: string | null
          fulfilled_by: string | null
          id: string | null
          is_test: boolean | null
          items: Json | null
          notes: string | null
          order_number: string | null
          payment_method: string | null
          status: string | null
          subscription_extra_info: Json | null
          subscription_password: string | null
          subscription_url: string | null
          subscription_username: string | null
          subtotal: number | null
          total: number | null
          updated_at: string | null
          user_id: string | null
          vat: number | null
          whatsapp_messages_sent: Json | null
        }
        Insert: {
          city?: string | null
          coupon_code?: string | null
          created_at?: string | null
          credentials_sent_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount?: number | null
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          id?: string | null
          is_test?: boolean | null
          items?: Json | null
          notes?: string | null
          order_number?: string | null
          payment_method?: string | null
          status?: string | null
          subscription_extra_info?: Json | null
          subscription_password?: string | null
          subscription_url?: string | null
          subscription_username?: string | null
          subtotal?: number | null
          total?: number | null
          updated_at?: string | null
          user_id?: string | null
          vat?: number | null
          whatsapp_messages_sent?: Json | null
        }
        Update: {
          city?: string | null
          coupon_code?: string | null
          created_at?: string | null
          credentials_sent_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount?: number | null
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          id?: string | null
          is_test?: boolean | null
          items?: Json | null
          notes?: string | null
          order_number?: string | null
          payment_method?: string | null
          status?: string | null
          subscription_extra_info?: Json | null
          subscription_password?: string | null
          subscription_url?: string | null
          subscription_username?: string | null
          subtotal?: number | null
          total?: number | null
          updated_at?: string | null
          user_id?: string | null
          vat?: number | null
          whatsapp_messages_sent?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_fulfilled_by_fkey"
            columns: ["fulfilled_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      bulk_insert_inventory: { Args: { _items: Json }; Returns: Json }
      can_modify_data: { Args: { _user_id: string }; Returns: boolean }
      check_inventory_duplicates: {
        Args: {
          _provider: Database["public"]["Enums"]["subscription_provider"]
          _usernames: string[]
        }
        Returns: string[]
      }
      check_stock_available: {
        Args: { _duration: number; _slug: string }
        Returns: Json
      }
      claim_orders_by_email: { Args: { _email: string }; Returns: number }
      claim_orders_by_phone: { Args: { _phone: string }; Returns: number }
      claim_subscription_for_order: {
        Args: { _order_id: string }
        Returns: Json
      }
      close_financial_period: {
        Args: { _month: number; _year: number }
        Returns: string
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_admin_role: { Args: { _user_id: string }; Returns: string }
      get_email_by_phone: { Args: { _phone: string }; Returns: string }
      get_kpi_dashboard: { Args: { _from: string; _to: string }; Returns: Json }
      get_monthly_financials: {
        Args: { _month: number; _year: number }
        Returns: Json
      }
      get_order_by_id: {
        Args: { _id: string }
        Returns: {
          created_at: string
          customer_name: string
          customer_phone: string
          id: string
          items: Json
          order_number: string
          status: string
          total: number
        }[]
      }
      get_order_by_number: {
        Args: { _order_number: string }
        Returns: {
          created_at: string
          customer_name: string
          id: string
          order_number: string
          status: string
          total: number
        }[]
      }
      get_payment_status: {
        Args: { _order_id: string }
        Returns: {
          amount: number
          order_id: string
          order_number: string
          provider: string
          status: string
          updated_at: string
        }[]
      }
      get_product_cost_at: {
        Args: { _at?: string; _slug: string }
        Returns: number
      }
      get_product_profitability: {
        Args: { _from: string; _to: string }
        Returns: Json
      }
      get_providers_from_slug: {
        Args: { _slug: string }
        Returns: Database["public"]["Enums"]["subscription_provider"][]
      }
      get_user_id_by_email: { Args: { _email: string }; Returns: string }
      increment_article_views: {
        Args: { article_slug: string }
        Returns: undefined
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      log_admin_action: {
        Args: {
          _action: string
          _changes?: Json
          _entity_id?: string
          _entity_type?: string
        }
        Returns: undefined
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      normalize_phone_to_e164: { Args: { input: string }; Returns: string }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      set_product_cost: {
        Args: { _new_cost: number; _note?: string; _slug: string }
        Returns: string
      }
    }
    Enums: {
      admin_role:
        | "super_admin"
        | "admin"
        | "staff"
        | "developer"
        | "orders_coupons_viewer"
      subscription_provider: "falcon" | "smarters" | "hulk"
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
    Enums: {
      admin_role: [
        "super_admin",
        "admin",
        "staff",
        "developer",
        "orders_coupons_viewer",
      ],
      subscription_provider: ["falcon", "smarters", "hulk"],
    },
  },
} as const
