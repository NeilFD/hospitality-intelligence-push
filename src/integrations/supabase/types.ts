export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_conversations: {
        Row: {
          created_at: string
          embedding: string | null
          id: string
          payload: Json | null
          query: string
          response: string | null
          shared: boolean | null
          timestamp: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          embedding?: string | null
          id?: string
          payload?: Json | null
          query: string
          response?: string | null
          shared?: boolean | null
          timestamp?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          embedding?: string | null
          id?: string
          payload?: Json | null
          query?: string
          response?: string | null
          shared?: boolean | null
          timestamp?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      budget_item_daily_values: {
        Row: {
          budget_item_id: string
          created_at: string
          day: number
          id: string
          month: number
          updated_at: string
          value: number | null
          year: number
        }
        Insert: {
          budget_item_id: string
          created_at?: string
          day: number
          id?: string
          month: number
          updated_at?: string
          value?: number | null
          year: number
        }
        Update: {
          budget_item_id?: string
          created_at?: string
          day?: number
          id?: string
          month?: number
          updated_at?: string
          value?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "budget_item_daily_values_budget_item_id_fkey"
            columns: ["budget_item_id"]
            isOneToOne: false
            referencedRelation: "budget_items"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_item_tracking: {
        Row: {
          budget_item_id: string
          created_at: string
          id: string
          tracking_type: string
          updated_at: string
        }
        Insert: {
          budget_item_id: string
          created_at?: string
          id?: string
          tracking_type?: string
          updated_at?: string
        }
        Update: {
          budget_item_id?: string
          created_at?: string
          id?: string
          tracking_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_item_tracking_budget_item_id_fkey"
            columns: ["budget_item_id"]
            isOneToOne: false
            referencedRelation: "budget_items"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_items: {
        Row: {
          actual_amount: number | null
          budget_amount: number
          category: string
          created_at: string
          forecast_amount: number | null
          id: string
          month: number
          name: string
          updated_at: string
          year: number
        }
        Insert: {
          actual_amount?: number | null
          budget_amount: number
          category: string
          created_at?: string
          forecast_amount?: number | null
          id?: string
          month: number
          name: string
          updated_at?: string
          year: number
        }
        Update: {
          actual_amount?: number | null
          budget_amount?: number
          category?: string
          created_at?: string
          forecast_amount?: number | null
          id?: string
          month?: number
          name?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      business_targets: {
        Row: {
          beverage_gp_target: number
          created_at: string
          food_gp_target: number
          id: number
          updated_at: string
          wage_cost_target: number
        }
        Insert: {
          beverage_gp_target?: number
          created_at?: string
          food_gp_target?: number
          id: number
          updated_at?: string
          wage_cost_target?: number
        }
        Update: {
          beverage_gp_target?: number
          created_at?: string
          food_gp_target?: number
          id?: number
          updated_at?: string
          wage_cost_target?: number
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          company_name: string
          id: number
          updated_at: string
        }
        Insert: {
          company_name?: string
          id?: number
          updated_at?: string
        }
        Update: {
          company_name?: string
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      credit_notes: {
        Row: {
          amount: number | null
          created_at: string
          created_by: string | null
          daily_record_id: string
          description: string | null
          id: string
          module_type: Database["public"]["Enums"]["module_type"]
          updated_at: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          created_by?: string | null
          daily_record_id: string
          description?: string | null
          id?: string
          module_type?: Database["public"]["Enums"]["module_type"]
          updated_at?: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          created_by?: string | null
          daily_record_id?: string
          description?: string | null
          id?: string
          module_type?: Database["public"]["Enums"]["module_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_notes_daily_record_id_fkey"
            columns: ["daily_record_id"]
            isOneToOne: false
            referencedRelation: "daily_records"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_records: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          day_of_week: string
          id: string
          module_type: Database["public"]["Enums"]["module_type"]
          revenue: number | null
          staff_food_allowance: number | null
          updated_at: string
          weekly_record_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date: string
          day_of_week: string
          id?: string
          module_type?: Database["public"]["Enums"]["module_type"]
          revenue?: number | null
          staff_food_allowance?: number | null
          updated_at?: string
          weekly_record_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          day_of_week?: string
          id?: string
          module_type?: Database["public"]["Enums"]["module_type"]
          revenue?: number | null
          staff_food_allowance?: number | null
          updated_at?: string
          weekly_record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_records_weekly_record_id_fkey"
            columns: ["weekly_record_id"]
            isOneToOne: false
            referencedRelation: "weekly_records"
            referencedColumns: ["id"]
          },
        ]
      }
      hospitality_guides: {
        Row: {
          archived: boolean
          category: string
          created_at: string
          description: string | null
          detailed_procedure: string | null
          id: string
          image_url: string | null
          name: string
          posted_to_noticeboard: boolean
          required_resources: string | null
          steps: Json | null
          time_to_complete_minutes: number | null
          updated_at: string
        }
        Insert: {
          archived?: boolean
          category: string
          created_at?: string
          description?: string | null
          detailed_procedure?: string | null
          id?: string
          image_url?: string | null
          name: string
          posted_to_noticeboard?: boolean
          required_resources?: string | null
          steps?: Json | null
          time_to_complete_minutes?: number | null
          updated_at?: string
        }
        Update: {
          archived?: boolean
          category?: string
          created_at?: string
          description?: string | null
          detailed_procedure?: string | null
          id?: string
          image_url?: string | null
          name?: string
          posted_to_noticeboard?: boolean
          required_resources?: string | null
          steps?: Json | null
          time_to_complete_minutes?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      master_daily_records: {
        Row: {
          average_cover_spend: number | null
          beverage_revenue: number | null
          created_at: string
          date: string
          day_foh_manager: string | null
          day_foh_team: string | null
          day_kitchen_manager: string | null
          day_kitchen_team: string | null
          day_of_week: string
          dinner_covers: number | null
          evening_foh_manager: string | null
          evening_foh_team: string | null
          evening_kitchen_manager: string | null
          evening_kitchen_team: string | null
          food_revenue: number | null
          id: string
          local_events: string | null
          lunch_covers: number | null
          month: number
          operations_notes: string | null
          precipitation: number | null
          temperature: number | null
          total_covers: number | null
          total_revenue: number | null
          updated_at: string
          weather_description: string | null
          week_number: number
          wind_speed: number | null
          year: number
        }
        Insert: {
          average_cover_spend?: number | null
          beverage_revenue?: number | null
          created_at?: string
          date: string
          day_foh_manager?: string | null
          day_foh_team?: string | null
          day_kitchen_manager?: string | null
          day_kitchen_team?: string | null
          day_of_week: string
          dinner_covers?: number | null
          evening_foh_manager?: string | null
          evening_foh_team?: string | null
          evening_kitchen_manager?: string | null
          evening_kitchen_team?: string | null
          food_revenue?: number | null
          id?: string
          local_events?: string | null
          lunch_covers?: number | null
          month: number
          operations_notes?: string | null
          precipitation?: number | null
          temperature?: number | null
          total_covers?: number | null
          total_revenue?: number | null
          updated_at?: string
          weather_description?: string | null
          week_number: number
          wind_speed?: number | null
          year: number
        }
        Update: {
          average_cover_spend?: number | null
          beverage_revenue?: number | null
          created_at?: string
          date?: string
          day_foh_manager?: string | null
          day_foh_team?: string | null
          day_kitchen_manager?: string | null
          day_kitchen_team?: string | null
          day_of_week?: string
          dinner_covers?: number | null
          evening_foh_manager?: string | null
          evening_foh_team?: string | null
          evening_kitchen_manager?: string | null
          evening_kitchen_team?: string | null
          food_revenue?: number | null
          id?: string
          local_events?: string | null
          lunch_covers?: number | null
          month?: number
          operations_notes?: string | null
          precipitation?: number | null
          temperature?: number | null
          total_covers?: number | null
          total_revenue?: number | null
          updated_at?: string
          weather_description?: string | null
          week_number?: number
          wind_speed?: number | null
          year?: number
        }
        Relationships: []
      }
      modules: {
        Row: {
          created_at: string
          display_order: number
          enabled: boolean
          id: string
          name: string
          type: Database["public"]["Enums"]["module_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order: number
          enabled?: boolean
          id?: string
          name: string
          type: Database["public"]["Enums"]["module_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          enabled?: boolean
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["module_type"]
          updated_at?: string
        }
        Relationships: []
      }
      monthly_settings: {
        Row: {
          cost_target: number | null
          created_at: string
          created_by: string | null
          gp_target: number | null
          id: string
          module_type: Database["public"]["Enums"]["module_type"]
          month: number
          staff_food_allowance: number | null
          updated_at: string
          year: number
        }
        Insert: {
          cost_target?: number | null
          created_at?: string
          created_by?: string | null
          gp_target?: number | null
          id?: string
          module_type?: Database["public"]["Enums"]["module_type"]
          month: number
          staff_food_allowance?: number | null
          updated_at?: string
          year: number
        }
        Update: {
          cost_target?: number | null
          created_at?: string
          created_by?: string | null
          gp_target?: number | null
          id?: string
          module_type?: Database["public"]["Enums"]["module_type"]
          month?: number
          staff_food_allowance?: number | null
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      permission_access: {
        Row: {
          created_at: string
          has_access: boolean
          id: string
          module_id: string
          role_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          has_access?: boolean
          id?: string
          module_id: string
          role_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          has_access?: boolean
          id?: string
          module_id?: string
          role_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "permission_access_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "permission_modules"
            referencedColumns: ["module_id"]
          },
          {
            foreignKeyName: "permission_access_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "permission_roles"
            referencedColumns: ["role_id"]
          },
        ]
      }
      permission_modules: {
        Row: {
          created_at: string
          display_order: number
          id: string
          module_id: string
          module_name: string
          module_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          module_id: string
          module_name: string
          module_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          module_id?: string
          module_name?: string
          module_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      permission_page_access: {
        Row: {
          created_at: string
          has_access: boolean
          id: string
          page_id: string
          role_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          has_access?: boolean
          id?: string
          page_id: string
          role_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          has_access?: boolean
          id?: string
          page_id?: string
          role_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "permission_page_access_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "permission_pages"
            referencedColumns: ["page_id"]
          },
          {
            foreignKeyName: "permission_page_access_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "permission_roles"
            referencedColumns: ["role_id"]
          },
        ]
      }
      permission_pages: {
        Row: {
          created_at: string
          display_order: number
          id: string
          module_id: string
          page_id: string
          page_name: string
          page_url: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          module_id: string
          page_id: string
          page_name: string
          page_url: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          module_id?: string
          page_id?: string
          page_name?: string
          page_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "permission_pages_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "permission_modules"
            referencedColumns: ["module_id"]
          },
        ]
      }
      permission_roles: {
        Row: {
          created_at: string
          id: string
          role_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          role_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          role_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          about_me: string | null
          avatar_url: string | null
          banner_position_y: number | null
          banner_url: string | null
          birth_date: string | null
          birth_date_month: string | null
          created_at: string
          email: string | null
          favourite_dish: string | null
          favourite_drink: string | null
          first_name: string | null
          id: string
          job_title: string | null
          last_name: string | null
          password_hash: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string
        }
        Insert: {
          about_me?: string | null
          avatar_url?: string | null
          banner_position_y?: number | null
          banner_url?: string | null
          birth_date?: string | null
          birth_date_month?: string | null
          created_at?: string
          email?: string | null
          favourite_dish?: string | null
          favourite_drink?: string | null
          first_name?: string | null
          id: string
          job_title?: string | null
          last_name?: string | null
          password_hash?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
        }
        Update: {
          about_me?: string | null
          avatar_url?: string | null
          banner_position_y?: number | null
          banner_url?: string | null
          birth_date?: string | null
          birth_date_month?: string | null
          created_at?: string
          email?: string | null
          favourite_dish?: string | null
          favourite_drink?: string | null
          first_name?: string | null
          id?: string
          job_title?: string | null
          last_name?: string | null
          password_hash?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount: number | null
          created_at: string
          created_by: string | null
          daily_record_id: string
          id: string
          module_type: Database["public"]["Enums"]["module_type"]
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          created_by?: string | null
          daily_record_id: string
          id?: string
          module_type?: Database["public"]["Enums"]["module_type"]
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          created_by?: string | null
          daily_record_id?: string
          id?: string
          module_type?: Database["public"]["Enums"]["module_type"]
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_daily_record_id_fkey"
            columns: ["daily_record_id"]
            isOneToOne: false
            referencedRelation: "daily_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_ingredients: {
        Row: {
          amount: number
          cost_per_unit: number
          created_at: string
          id: string
          name: string
          recipe_id: string
          total_cost: number
          unit: string
          updated_at: string
        }
        Insert: {
          amount?: number
          cost_per_unit?: number
          created_at?: string
          id?: string
          name: string
          recipe_id: string
          total_cost?: number
          unit: string
          updated_at?: string
        }
        Update: {
          amount?: number
          cost_per_unit?: number
          created_at?: string
          id?: string
          name?: string
          recipe_id?: string
          total_cost?: number
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          actual_menu_price: number
          allergens: string[]
          archived: boolean
          category: string
          created_at: string
          gross_profit_percentage: number
          id: string
          image_url: string | null
          is_gluten_free: boolean
          is_vegan: boolean
          is_vegetarian: boolean
          method: string | null
          mise_en_place: string | null
          module_type: string
          name: string
          posted_to_noticeboard: boolean
          recommended_upsell: string | null
          suggested_selling_price: number
          time_to_table_minutes: number
          total_recipe_cost: number
          updated_at: string
        }
        Insert: {
          actual_menu_price?: number
          allergens?: string[]
          archived?: boolean
          category: string
          created_at?: string
          gross_profit_percentage?: number
          id?: string
          image_url?: string | null
          is_gluten_free?: boolean
          is_vegan?: boolean
          is_vegetarian?: boolean
          method?: string | null
          mise_en_place?: string | null
          module_type: string
          name: string
          posted_to_noticeboard?: boolean
          recommended_upsell?: string | null
          suggested_selling_price?: number
          time_to_table_minutes?: number
          total_recipe_cost?: number
          updated_at?: string
        }
        Update: {
          actual_menu_price?: number
          allergens?: string[]
          archived?: boolean
          category?: string
          created_at?: string
          gross_profit_percentage?: number
          id?: string
          image_url?: string | null
          is_gluten_free?: boolean
          is_vegan?: boolean
          is_vegetarian?: boolean
          method?: string | null
          mise_en_place?: string | null
          module_type?: string
          name?: string
          posted_to_noticeboard?: boolean
          recommended_upsell?: string | null
          suggested_selling_price?: number
          time_to_table_minutes?: number
          total_recipe_cost?: number
          updated_at?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          module_type: Database["public"]["Enums"]["module_type"]
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          module_type?: Database["public"]["Enums"]["module_type"]
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          module_type?: Database["public"]["Enums"]["module_type"]
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      team_chat_rooms: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_announcement_only: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_announcement_only?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_announcement_only?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_messages: {
        Row: {
          attachment_url: string | null
          author_id: string
          content: string
          created_at: string
          deleted: boolean
          id: string
          mentioned_users: string[] | null
          notification_state: string | null
          read_by: string[] | null
          room_id: string
          type: Database["public"]["Enums"]["message_type"]
          updated_at: string
        }
        Insert: {
          attachment_url?: string | null
          author_id: string
          content: string
          created_at?: string
          deleted?: boolean
          id?: string
          mentioned_users?: string[] | null
          notification_state?: string | null
          read_by?: string[] | null
          room_id: string
          type?: Database["public"]["Enums"]["message_type"]
          updated_at?: string
        }
        Update: {
          attachment_url?: string | null
          author_id?: string
          content?: string
          created_at?: string
          deleted?: boolean
          id?: string
          mentioned_users?: string[] | null
          notification_state?: string | null
          read_by?: string[] | null
          room_id?: string
          type?: Database["public"]["Enums"]["message_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "team_chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      team_note_replies: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          note_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          note_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          note_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_note_replies_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "team_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      team_notes: {
        Row: {
          attachment_url: string | null
          author_id: string
          color: string | null
          content: string
          created_at: string
          id: string
          mentioned_users: string[] | null
          pinned: boolean
          type: Database["public"]["Enums"]["message_type"]
          updated_at: string
        }
        Insert: {
          attachment_url?: string | null
          author_id: string
          color?: string | null
          content: string
          created_at?: string
          id?: string
          mentioned_users?: string[] | null
          pinned?: boolean
          type?: Database["public"]["Enums"]["message_type"]
          updated_at?: string
        }
        Update: {
          attachment_url?: string | null
          author_id?: string
          color?: string | null
          content?: string
          created_at?: string
          id?: string
          mentioned_users?: string[] | null
          pinned?: boolean
          type?: Database["public"]["Enums"]["message_type"]
          updated_at?: string
        }
        Relationships: []
      }
      team_poll_options: {
        Row: {
          attachment_url: string | null
          created_at: string
          id: string
          option_order: number
          option_text: string
          option_type: Database["public"]["Enums"]["poll_option_type"]
          poll_id: string
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string
          id?: string
          option_order?: number
          option_text: string
          option_type?: Database["public"]["Enums"]["poll_option_type"]
          poll_id: string
        }
        Update: {
          attachment_url?: string | null
          created_at?: string
          id?: string
          option_order?: number
          option_text?: string
          option_type?: Database["public"]["Enums"]["poll_option_type"]
          poll_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "team_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      team_poll_votes: {
        Row: {
          created_at: string
          id: string
          option_id: string
          poll_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_id: string
          poll_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_id?: string
          poll_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "team_poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "team_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      team_polls: {
        Row: {
          active: boolean
          author_id: string
          color: string | null
          created_at: string
          id: string
          multiple_choice: boolean
          question: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          author_id: string
          color?: string | null
          created_at?: string
          id?: string
          multiple_choice?: boolean
          question: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          author_id?: string
          color?: string | null
          created_at?: string
          id?: string
          multiple_choice?: boolean
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      themes: {
        Row: {
          accent_color: string
          button_color: string
          company_name: string
          created_at: string
          custom_font: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          primary_color: string
          secondary_color: string
          sidebar_color: string
          text_color: string
          updated_at: string
        }
        Insert: {
          accent_color: string
          button_color: string
          company_name?: string
          created_at?: string
          custom_font?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          primary_color: string
          secondary_color: string
          sidebar_color: string
          text_color: string
          updated_at?: string
        }
        Update: {
          accent_color?: string
          button_color?: string
          company_name?: string
          created_at?: string
          custom_font?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          primary_color?: string
          secondary_color?: string
          sidebar_color?: string
          text_color?: string
          updated_at?: string
        }
        Relationships: []
      }
      tracker_credit_notes: {
        Row: {
          amount: number
          created_at: string
          credit_index: number
          id: string
          tracker_data_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          credit_index: number
          id?: string
          tracker_data_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          credit_index?: number
          id?: string
          tracker_data_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracker_credit_notes_tracker_data_id_fkey"
            columns: ["tracker_data_id"]
            isOneToOne: false
            referencedRelation: "tracker_data"
            referencedColumns: ["id"]
          },
        ]
      }
      tracker_data: {
        Row: {
          created_at: string
          date: string
          day_of_week: string
          id: string
          module_type: Database["public"]["Enums"]["module_type"]
          month: number
          revenue: number | null
          staff_food_allowance: number | null
          updated_at: string
          week_number: number
          year: number
        }
        Insert: {
          created_at?: string
          date: string
          day_of_week: string
          id?: string
          module_type?: Database["public"]["Enums"]["module_type"]
          month: number
          revenue?: number | null
          staff_food_allowance?: number | null
          updated_at?: string
          week_number: number
          year: number
        }
        Update: {
          created_at?: string
          date?: string
          day_of_week?: string
          id?: string
          module_type?: Database["public"]["Enums"]["module_type"]
          month?: number
          revenue?: number | null
          staff_food_allowance?: number | null
          updated_at?: string
          week_number?: number
          year?: number
        }
        Relationships: []
      }
      tracker_purchases: {
        Row: {
          amount: number
          created_at: string
          id: string
          supplier_id: string
          tracker_data_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          supplier_id: string
          tracker_data_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          supplier_id?: string
          tracker_data_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracker_purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracker_purchases_tracker_data_id_fkey"
            columns: ["tracker_data_id"]
            isOneToOne: false
            referencedRelation: "tracker_data"
            referencedColumns: ["id"]
          },
        ]
      }
      user_invitations: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          expires_at: string
          first_name: string | null
          id: string
          invitation_token: string
          is_claimed: boolean
          job_title: string | null
          last_name: string | null
          role: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          expires_at?: string
          first_name?: string | null
          id?: string
          invitation_token: string
          is_claimed?: boolean
          job_title?: string | null
          last_name?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          expires_at?: string
          first_name?: string | null
          id?: string
          invitation_token?: string
          is_claimed?: boolean
          job_title?: string | null
          last_name?: string | null
          role?: string | null
        }
        Relationships: []
      }
      vector_documents: {
        Row: {
          content: string
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      wages: {
        Row: {
          bev_revenue: number
          created_at: string
          created_by: string | null
          date: string
          day: number
          day_of_week: string
          foh_wages: number
          food_revenue: number
          id: string
          kitchen_wages: number
          month: number
          updated_at: string
          year: number
        }
        Insert: {
          bev_revenue?: number
          created_at?: string
          created_by?: string | null
          date: string
          day: number
          day_of_week: string
          foh_wages?: number
          food_revenue?: number
          id?: string
          kitchen_wages?: number
          month: number
          updated_at?: string
          year: number
        }
        Update: {
          bev_revenue?: number
          created_at?: string
          created_by?: string | null
          date?: string
          day?: number
          day_of_week?: string
          foh_wages?: number
          food_revenue?: number
          id?: string
          kitchen_wages?: number
          month?: number
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      weekly_records: {
        Row: {
          created_at: string
          created_by: string | null
          end_date: string
          id: string
          module_type: Database["public"]["Enums"]["module_type"]
          month: number
          start_date: string
          updated_at: string
          week_number: number
          year: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          end_date: string
          id?: string
          module_type?: Database["public"]["Enums"]["module_type"]
          month: number
          start_date: string
          updated_at?: string
          week_number: number
          year: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          end_date?: string
          id?: string
          module_type?: Database["public"]["Enums"]["module_type"]
          month?: number
          start_date?: string
          updated_at?: string
          week_number?: number
          year?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      check_trigger_exists: {
        Args: { trigger_name: string }
        Returns: boolean
      }
      create_profile_for_user: {
        Args:
          | {
              user_id: string
              first_name_val: string
              last_name_val: string
              role_val: string
              job_title_val: string
            }
          | {
              user_id: string
              first_name_val: string
              last_name_val: string
              role_val: string
              job_title_val: string
              email_val: string
            }
        Returns: boolean
      }
      create_profile_with_auth: {
        Args: {
          first_name_val: string
          last_name_val: string
          role_val: string
          job_title_val: string
          email_val: string
        }
        Returns: string
      }
      create_profile_without_auth: {
        Args: {
          first_name_val: string
          last_name_val: string
          role_val: string
          job_title_val: string
          email_val: string
        }
        Returns: string
      }
      duplicate_database_structure: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_database_statistics: {
        Args: Record<PropertyKey, never>
        Returns: {
          schema_name: string
          total_tables: number
          total_functions: number
          total_triggers: number
        }[]
      }
      get_permission_matrix: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      handle_new_user_manual: {
        Args:
          | {
              user_id: string
              first_name_val: string
              last_name_val: string
              role_val: string
            }
          | {
              user_id: string
              first_name_val: string
              last_name_val: string
              role_val: string
              email_val?: string
            }
        Returns: boolean
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      match_documents: {
        Args: { filter: Json; match_count: number; query_embedding: string }
        Returns: {
          id: string
          query: string
          response: string
          metadata: Json
          similarity: number
        }[]
      }
      match_vector_documents: {
        Args: {
          query_embedding: string
          match_threshold?: number
          match_count?: number
        }
        Returns: {
          id: string
          content: string
          metadata: Json
          similarity: number
        }[]
      }
      set_active_theme: {
        Args: { theme_id: string }
        Returns: undefined
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      sync_conversations_to_vector_documents: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      sync_master_records_to_vectors: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      test_trigger_handle_new_user: {
        Args: {
          test_user_id: string
          test_first_name: string
          test_last_name: string
          test_role: string
        }
        Returns: boolean
      }
      update_permission_matrix: {
        Args: { matrix: Json }
        Returns: undefined
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      message_type: "text" | "image" | "voice" | "gif" | "file"
      module_type: "food" | "beverage" | "pl" | "wages" | "performance"
      poll_option_type: "text" | "image"
      user_role: "Owner" | "Manager" | "Team Member" | "GOD" | "Super User"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      message_type: ["text", "image", "voice", "gif", "file"],
      module_type: ["food", "beverage", "pl", "wages", "performance"],
      poll_option_type: ["text", "image"],
      user_role: ["Owner", "Manager", "Team Member", "GOD", "Super User"],
    },
  },
} as const
