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
      cost_item_forecast_settings: {
        Row: {
          created_at: string
          discrete_values: Json | null
          id: string
          item_name: string
          method: Database["public"]["Enums"]["forecast_method"]
          month: number
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          discrete_values?: Json | null
          id?: string
          item_name: string
          method: Database["public"]["Enums"]["forecast_method"]
          month: number
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          discrete_values?: Json | null
          id?: string
          item_name?: string
          method?: Database["public"]["Enums"]["forecast_method"]
          month?: number
          updated_at?: string
          year?: number
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
      global_constraints: {
        Row: {
          created_at: string
          id: string
          location_id: string
          max_consecutive_days_worked: number
          max_shifts_per_week: number
          min_rest_hours_between_shifts: number
          updated_at: string
          wage_target_type: Database["public"]["Enums"]["wage_target_type"]
          wage_target_value: number
        }
        Insert: {
          created_at?: string
          id?: string
          location_id: string
          max_consecutive_days_worked?: number
          max_shifts_per_week?: number
          min_rest_hours_between_shifts?: number
          updated_at?: string
          wage_target_type?: Database["public"]["Enums"]["wage_target_type"]
          wage_target_value?: number
        }
        Update: {
          created_at?: string
          id?: string
          location_id?: string
          max_consecutive_days_worked?: number
          max_shifts_per_week?: number
          min_rest_hours_between_shifts?: number
          updated_at?: string
          wage_target_type?: Database["public"]["Enums"]["wage_target_type"]
          wage_target_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "global_constraints_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      hi_score_evaluations: {
        Row: {
          adaptability: number | null
          adaptability_feedback: string | null
          comments: string | null
          cooking_skills: number | null
          cooking_skills_feedback: string | null
          created_at: string
          evaluation_date: string
          evaluator_id: string
          foh_knowledge: number | null
          foh_knowledge_feedback: string | null
          food_knowledge: number | null
          food_knowledge_feedback: string | null
          friendliness: number | null
          friendliness_feedback: string | null
          hospitality: number | null
          hospitality_feedback: string | null
          id: string
          internal_team_skills: number | null
          internal_team_skills_feedback: string | null
          is_signed_off: boolean
          notes: string | null
          profile_id: string
          role_type: Database["public"]["Enums"]["role_type"]
          service_skills: number | null
          service_skills_feedback: string | null
          team_player: number | null
          team_player_feedback: string | null
          updated_at: string
          weighted_score: number
          work_ethic: number | null
          work_ethic_feedback: string | null
        }
        Insert: {
          adaptability?: number | null
          adaptability_feedback?: string | null
          comments?: string | null
          cooking_skills?: number | null
          cooking_skills_feedback?: string | null
          created_at?: string
          evaluation_date?: string
          evaluator_id: string
          foh_knowledge?: number | null
          foh_knowledge_feedback?: string | null
          food_knowledge?: number | null
          food_knowledge_feedback?: string | null
          friendliness?: number | null
          friendliness_feedback?: string | null
          hospitality?: number | null
          hospitality_feedback?: string | null
          id?: string
          internal_team_skills?: number | null
          internal_team_skills_feedback?: string | null
          is_signed_off?: boolean
          notes?: string | null
          profile_id: string
          role_type: Database["public"]["Enums"]["role_type"]
          service_skills?: number | null
          service_skills_feedback?: string | null
          team_player?: number | null
          team_player_feedback?: string | null
          updated_at?: string
          weighted_score: number
          work_ethic?: number | null
          work_ethic_feedback?: string | null
        }
        Update: {
          adaptability?: number | null
          adaptability_feedback?: string | null
          comments?: string | null
          cooking_skills?: number | null
          cooking_skills_feedback?: string | null
          created_at?: string
          evaluation_date?: string
          evaluator_id?: string
          foh_knowledge?: number | null
          foh_knowledge_feedback?: string | null
          food_knowledge?: number | null
          food_knowledge_feedback?: string | null
          friendliness?: number | null
          friendliness_feedback?: string | null
          hospitality?: number | null
          hospitality_feedback?: string | null
          id?: string
          internal_team_skills?: number | null
          internal_team_skills_feedback?: string | null
          is_signed_off?: boolean
          notes?: string | null
          profile_id?: string
          role_type?: Database["public"]["Enums"]["role_type"]
          service_skills?: number | null
          service_skills_feedback?: string | null
          team_player?: number | null
          team_player_feedback?: string | null
          updated_at?: string
          weighted_score?: number
          work_ethic?: number | null
          work_ethic_feedback?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hi_score_evaluations_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hi_score_evaluations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      job_roles: {
        Row: {
          created_at: string
          default_wage_rate: number
          id: string
          is_kitchen: boolean
          location_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_wage_rate?: number
          id?: string
          is_kitchen?: boolean
          location_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_wage_rate?: number
          id?: string
          is_kitchen?: boolean
          location_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_roles_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          created_at: string
          id: string
          name: string
          opening_hours: Json
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          opening_hours?: Json
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          opening_hours?: Json
          timezone?: string
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
      pl_analytics_snapshots: {
        Row: {
          actual_amount: number | null
          budget_amount: number
          budget_variance: number | null
          captured_at: string | null
          category: string
          created_at: string | null
          forecast_amount: number | null
          forecast_variance: number | null
          id: string
          month: number
          name: string
          updated_at: string | null
          year: number
        }
        Insert: {
          actual_amount?: number | null
          budget_amount: number
          budget_variance?: number | null
          captured_at?: string | null
          category: string
          created_at?: string | null
          forecast_amount?: number | null
          forecast_variance?: number | null
          id?: string
          month: number
          name: string
          updated_at?: string | null
          year: number
        }
        Update: {
          actual_amount?: number | null
          budget_amount?: number
          budget_variance?: number | null
          captured_at?: string | null
          category?: string
          created_at?: string | null
          forecast_amount?: number | null
          forecast_variance?: number | null
          id?: string
          month?: number
          name?: string
          updated_at?: string | null
          year?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          about_me: string | null
          annual_salary: number | null
          available_for_rota: boolean | null
          avatar_url: string | null
          banner_position_y: number | null
          banner_url: string | null
          birth_date: string | null
          birth_date_month: string | null
          contractor_rate: number | null
          created_at: string
          email: string | null
          employment_status: string | null
          employment_type: string | null
          enhanced_availability: Json | null
          favourite_dish: string | null
          favourite_drink: string | null
          first_name: string | null
          id: string
          in_ft_education: boolean | null
          job_title: string | null
          last_name: string | null
          max_hours_per_day: number | null
          max_hours_per_week: number | null
          min_hours_per_day: number | null
          min_hours_per_week: number | null
          password_hash: string | null
          performance_score: number | null
          role: Database["public"]["Enums"]["user_role"] | null
          role_type: Database["public"]["Enums"]["role_type"] | null
          secondary_job_roles: string[] | null
          updated_at: string
          wage_rate: number | null
        }
        Insert: {
          about_me?: string | null
          annual_salary?: number | null
          available_for_rota?: boolean | null
          avatar_url?: string | null
          banner_position_y?: number | null
          banner_url?: string | null
          birth_date?: string | null
          birth_date_month?: string | null
          contractor_rate?: number | null
          created_at?: string
          email?: string | null
          employment_status?: string | null
          employment_type?: string | null
          enhanced_availability?: Json | null
          favourite_dish?: string | null
          favourite_drink?: string | null
          first_name?: string | null
          id: string
          in_ft_education?: boolean | null
          job_title?: string | null
          last_name?: string | null
          max_hours_per_day?: number | null
          max_hours_per_week?: number | null
          min_hours_per_day?: number | null
          min_hours_per_week?: number | null
          password_hash?: string | null
          performance_score?: number | null
          role?: Database["public"]["Enums"]["user_role"] | null
          role_type?: Database["public"]["Enums"]["role_type"] | null
          secondary_job_roles?: string[] | null
          updated_at?: string
          wage_rate?: number | null
        }
        Update: {
          about_me?: string | null
          annual_salary?: number | null
          available_for_rota?: boolean | null
          avatar_url?: string | null
          banner_position_y?: number | null
          banner_url?: string | null
          birth_date?: string | null
          birth_date_month?: string | null
          contractor_rate?: number | null
          created_at?: string
          email?: string | null
          employment_status?: string | null
          employment_type?: string | null
          enhanced_availability?: Json | null
          favourite_dish?: string | null
          favourite_drink?: string | null
          first_name?: string | null
          id?: string
          in_ft_education?: boolean | null
          job_title?: string | null
          last_name?: string | null
          max_hours_per_day?: number | null
          max_hours_per_week?: number | null
          min_hours_per_day?: number | null
          min_hours_per_week?: number | null
          password_hash?: string | null
          performance_score?: number | null
          role?: Database["public"]["Enums"]["user_role"] | null
          role_type?: Database["public"]["Enums"]["role_type"] | null
          secondary_job_roles?: string[] | null
          updated_at?: string
          wage_rate?: number | null
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
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      revenue_tag_history: {
        Row: {
          actual_beverage_revenue_impact: number | null
          actual_food_revenue_impact: number | null
          created_at: string | null
          date: string
          id: string
          tag_id: string | null
          updated_at: string | null
        }
        Insert: {
          actual_beverage_revenue_impact?: number | null
          actual_food_revenue_impact?: number | null
          created_at?: string | null
          date: string
          id?: string
          tag_id?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_beverage_revenue_impact?: number | null
          actual_food_revenue_impact?: number | null
          created_at?: string | null
          date?: string
          id?: string
          tag_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "revenue_tag_history_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "revenue_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_tags: {
        Row: {
          created_at: string | null
          description: string | null
          historical_beverage_revenue_impact: number | null
          historical_food_revenue_impact: number | null
          id: string
          name: string
          occurrence_count: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          historical_beverage_revenue_impact?: number | null
          historical_food_revenue_impact?: number | null
          id?: string
          name: string
          occurrence_count?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          historical_beverage_revenue_impact?: number | null
          historical_food_revenue_impact?: number | null
          id?: string
          name?: string
          occurrence_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rota_forecast_factors: {
        Row: {
          created_at: string
          date: string
          id: string
          local_events: string | null
          location_id: string
          special_notes: string | null
          updated_at: string
          weather_forecast: Json | null
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          local_events?: string | null
          location_id: string
          special_notes?: string | null
          updated_at?: string
          weather_forecast?: Json | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          local_events?: string | null
          location_id?: string
          special_notes?: string | null
          updated_at?: string
          weather_forecast?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "rota_forecast_factors_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      rota_requests: {
        Row: {
          approved_by: string | null
          created_at: string
          id: string
          location_id: string
          requested_by: string
          revenue_forecast: Json | null
          staffing_cost: number | null
          staffing_cost_percentage: number | null
          status: string
          updated_at: string
          week_end_date: string
          week_start_date: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          id?: string
          location_id: string
          requested_by: string
          revenue_forecast?: Json | null
          staffing_cost?: number | null
          staffing_cost_percentage?: number | null
          status?: string
          updated_at?: string
          week_end_date: string
          week_start_date: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          id?: string
          location_id?: string
          requested_by?: string
          revenue_forecast?: Json | null
          staffing_cost?: number | null
          staffing_cost_percentage?: number | null
          status?: string
          updated_at?: string
          week_end_date?: string
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "rota_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rota_requests_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rota_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rota_revenue_thresholds: {
        Row: {
          created_at: string
          day_of_week: string | null
          foh_max_staff: number
          foh_min_staff: number
          id: string
          kitchen_max_staff: number
          kitchen_min_staff: number
          kp_max_staff: number
          kp_min_staff: number
          location_id: string
          name: string | null
          revenue_max: number
          revenue_min: number
          segment: string | null
          target_cost_percentage: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week?: string | null
          foh_max_staff?: number
          foh_min_staff?: number
          id?: string
          kitchen_max_staff?: number
          kitchen_min_staff?: number
          kp_max_staff?: number
          kp_min_staff?: number
          location_id: string
          name?: string | null
          revenue_max: number
          revenue_min: number
          segment?: string | null
          target_cost_percentage?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: string | null
          foh_max_staff?: number
          foh_min_staff?: number
          id?: string
          kitchen_max_staff?: number
          kitchen_min_staff?: number
          kp_max_staff?: number
          kp_min_staff?: number
          location_id?: string
          name?: string | null
          revenue_max?: number
          revenue_min?: number
          segment?: string | null
          target_cost_percentage?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rota_revenue_thresholds_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      rota_schedule_shifts: {
        Row: {
          break_minutes: number
          created_at: string
          date: string
          day_of_week: string
          employer_ni_cost: number
          employer_pension_cost: number
          end_time: string
          hi_score: number | null
          id: string
          is_secondary_role: boolean
          job_role_id: string
          profile_id: string
          schedule_id: string
          shift_cost: number
          start_time: string
          total_cost: number
          updated_at: string
        }
        Insert: {
          break_minutes?: number
          created_at?: string
          date: string
          day_of_week: string
          employer_ni_cost?: number
          employer_pension_cost?: number
          end_time: string
          hi_score?: number | null
          id?: string
          is_secondary_role?: boolean
          job_role_id: string
          profile_id: string
          schedule_id: string
          shift_cost: number
          start_time: string
          total_cost: number
          updated_at?: string
        }
        Update: {
          break_minutes?: number
          created_at?: string
          date?: string
          day_of_week?: string
          employer_ni_cost?: number
          employer_pension_cost?: number
          end_time?: string
          hi_score?: number | null
          id?: string
          is_secondary_role?: boolean
          job_role_id?: string
          profile_id?: string
          schedule_id?: string
          shift_cost?: number
          start_time?: string
          total_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rota_schedule_shifts_job_role_id_fkey"
            columns: ["job_role_id"]
            isOneToOne: false
            referencedRelation: "job_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rota_schedule_shifts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rota_schedule_shifts_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "rota_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      rota_schedules: {
        Row: {
          cost_percentage: number
          created_at: string
          created_by: string | null
          id: string
          location_id: string
          published_at: string | null
          published_by: string | null
          request_id: string
          revenue_forecast: number
          status: string
          total_cost: number
          updated_at: string
          week_end_date: string
          week_start_date: string
        }
        Insert: {
          cost_percentage?: number
          created_at?: string
          created_by?: string | null
          id?: string
          location_id: string
          published_at?: string | null
          published_by?: string | null
          request_id: string
          revenue_forecast?: number
          status?: string
          total_cost?: number
          updated_at?: string
          week_end_date: string
          week_start_date: string
        }
        Update: {
          cost_percentage?: number
          created_at?: string
          created_by?: string | null
          id?: string
          location_id?: string
          published_at?: string | null
          published_by?: string | null
          request_id?: string
          revenue_forecast?: number
          status?: string
          total_cost?: number
          updated_at?: string
          week_end_date?: string
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "rota_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rota_schedules_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rota_schedules_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rota_schedules_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "rota_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_rules: {
        Row: {
          archived: boolean | null
          created_at: string
          day_of_week: Database["public"]["Enums"]["day_of_week"]
          end_time: string
          id: string
          job_role_id: string
          location_id: string
          max_staff: number
          min_staff: number
          name: string | null
          priority: number
          required_skill_level: number | null
          revenue_to_staff_ratio: number | null
          start_time: string
          updated_at: string
        }
        Insert: {
          archived?: boolean | null
          created_at?: string
          day_of_week: Database["public"]["Enums"]["day_of_week"]
          end_time: string
          id?: string
          job_role_id: string
          location_id: string
          max_staff?: number
          min_staff?: number
          name?: string | null
          priority?: number
          required_skill_level?: number | null
          revenue_to_staff_ratio?: number | null
          start_time: string
          updated_at?: string
        }
        Update: {
          archived?: boolean | null
          created_at?: string
          day_of_week?: Database["public"]["Enums"]["day_of_week"]
          end_time?: string
          id?: string
          job_role_id?: string
          location_id?: string
          max_staff?: number
          min_staff?: number
          name?: string | null
          priority?: number
          required_skill_level?: number | null
          revenue_to_staff_ratio?: number | null
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_rules_job_role_id_fkey"
            columns: ["job_role_id"]
            isOneToOne: false
            referencedRelation: "job_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_rules_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_templates: {
        Row: {
          created_at: string
          day_of_week: Database["public"]["Enums"]["day_of_week"]
          id: string
          location_id: string
          name: string
          shift_blocks: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: Database["public"]["Enums"]["day_of_week"]
          id?: string
          location_id: string
          name: string
          shift_blocks?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: Database["public"]["Enums"]["day_of_week"]
          id?: string
          location_id?: string
          name?: string
          shift_blocks?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_templates_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
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
      tagged_dates: {
        Row: {
          created_at: string | null
          date: string
          id: string
          manual_beverage_revenue_impact: number | null
          manual_food_revenue_impact: number | null
          tag_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          manual_beverage_revenue_impact?: number | null
          manual_food_revenue_impact?: number | null
          tag_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          manual_beverage_revenue_impact?: number | null
          manual_food_revenue_impact?: number | null
          tag_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tagged_dates_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "revenue_tags"
            referencedColumns: ["id"]
          },
        ]
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
          reactions: Json | null
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
          reactions?: Json | null
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
          reactions?: Json | null
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
      team_welcome_messages: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          image_url: string | null
          subject: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          subject?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          subject?: string | null
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
      beverage_performance_analysis: {
        Row: {
          beverage_revenue: number | null
          covers: number | null
          date: string | null
          day_of_week: string | null
          gross_profit_percentage: number | null
          month: number | null
          staff_beverage_allowance: number | null
          total_cost: number | null
          total_credit_notes: number | null
          total_purchases: number | null
          week_number: number | null
          year: number | null
        }
        Relationships: []
      }
      budget_vs_actual: {
        Row: {
          actual_amount: number | null
          budget_achievement_percentage: number | null
          budget_amount: number | null
          budget_variance: number | null
          category: string | null
          forecast_achievement_percentage: number | null
          forecast_amount: number | null
          forecast_variance: number | null
          month: number | null
          name: string | null
          year: number | null
        }
        Insert: {
          actual_amount?: number | null
          budget_achievement_percentage?: never
          budget_amount?: number | null
          budget_variance?: never
          category?: string | null
          forecast_achievement_percentage?: never
          forecast_amount?: number | null
          forecast_variance?: never
          month?: number | null
          name?: string | null
          year?: number | null
        }
        Update: {
          actual_amount?: number | null
          budget_achievement_percentage?: never
          budget_amount?: number | null
          budget_variance?: never
          category?: string | null
          forecast_achievement_percentage?: never
          forecast_amount?: number | null
          forecast_variance?: never
          month?: number | null
          name?: string | null
          year?: number | null
        }
        Relationships: []
      }
      daily_performance_summary: {
        Row: {
          average_spend_per_cover: number | null
          beverage_revenue: number | null
          date: string | null
          day_of_week: string | null
          dinner_covers: number | null
          foh_wages: number | null
          food_revenue: number | null
          id: string | null
          kitchen_wages: number | null
          local_events: string | null
          lunch_covers: number | null
          month: number | null
          precipitation: number | null
          temperature: number | null
          total_covers: number | null
          total_revenue: number | null
          total_wages: number | null
          wage_percentage: number | null
          weather_description: string | null
          week_number: number | null
          wind_speed: number | null
          year: number | null
        }
        Relationships: []
      }
      financial_performance_analysis: {
        Row: {
          budget_achievement_percentage: number | null
          budget_amount: number | null
          budget_variance: number | null
          date: string | null
          gp_percentage: number | null
          month: number | null
          net_profit: number | null
          revenue: number | null
          total_wages: number | null
          wage_percentage: number | null
          year: number | null
        }
        Relationships: []
      }
      food_performance_analysis: {
        Row: {
          covers: number | null
          date: string | null
          day_of_week: string | null
          food_revenue: number | null
          gross_profit_percentage: number | null
          month: number | null
          staff_food_allowance: number | null
          total_cost: number | null
          total_credit_notes: number | null
          total_purchases: number | null
          week_number: number | null
          year: number | null
        }
        Relationships: []
      }
      monthly_performance_summary: {
        Row: {
          average_spend_per_cover: number | null
          days_with_records: number | null
          month: number | null
          total_beverage_revenue: number | null
          total_covers: number | null
          total_dinner_covers: number | null
          total_food_revenue: number | null
          total_lunch_covers: number | null
          total_revenue: number | null
          year: number | null
        }
        Relationships: []
      }
      revenue_tag_analysis: {
        Row: {
          date: string | null
          manual_beverage_revenue_impact: number | null
          manual_food_revenue_impact: number | null
          percentage_of_total_revenue: number | null
          tag_description: string | null
          tag_name: string | null
          total_revenue: number | null
          total_revenue_impact: number | null
        }
        Relationships: []
      }
      weather_impact_analysis: {
        Row: {
          average_spend_per_cover: number | null
          date: string | null
          day_of_week: string | null
          dinner_covers: number | null
          lunch_covers: number | null
          month: number | null
          precipitation: number | null
          temperature: number | null
          total_covers: number | null
          total_revenue: number | null
          weather_description: string | null
          wind_speed: number | null
          year: number | null
        }
        Insert: {
          average_spend_per_cover?: never
          date?: string | null
          day_of_week?: string | null
          dinner_covers?: number | null
          lunch_covers?: number | null
          month?: number | null
          precipitation?: number | null
          temperature?: number | null
          total_covers?: number | null
          total_revenue?: number | null
          weather_description?: string | null
          wind_speed?: number | null
          year?: number | null
        }
        Update: {
          average_spend_per_cover?: never
          date?: string | null
          day_of_week?: string | null
          dinner_covers?: number | null
          lunch_covers?: number | null
          month?: number | null
          precipitation?: number | null
          temperature?: number | null
          total_covers?: number | null
          total_revenue?: number | null
          weather_description?: string | null
          wind_speed?: number | null
          year?: number | null
        }
        Relationships: []
      }
      weekly_performance_summary: {
        Row: {
          average_spend_per_cover: number | null
          month: number | null
          total_beverage_revenue: number | null
          total_covers: number | null
          total_dinner_covers: number | null
          total_food_revenue: number | null
          total_lunch_covers: number | null
          total_revenue: number | null
          week_end_date: string | null
          week_number: number | null
          week_start_date: string | null
          year: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_update_user_password: {
        Args: { user_id: string; password: string }
        Returns: boolean
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      calculate_employer_costs: {
        Args: {
          wage_rate: number
          hours_worked: number
          employment_type?: string
        }
        Returns: Json
      }
      check_and_clean_auth_user: {
        Args: { email_val: string; should_delete?: boolean }
        Returns: boolean
      }
      check_trigger_exists: {
        Args: { trigger_name: string }
        Returns: boolean
      }
      create_auth_user_and_profile: {
        Args: {
          first_name_val: string
          last_name_val: string
          role_val: string
          job_title_val: string
          email_val: string
        }
        Returns: string
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
      create_user_invitation: {
        Args: {
          p_email: string
          p_first_name: string
          p_last_name: string
          p_role?: string
          p_job_title?: string
          p_created_by?: string
          p_invitation_token?: string
        }
        Returns: string
      }
      direct_password_update: {
        Args: { user_id_val: string; password_val: string }
        Returns: boolean
      }
      direct_upsert_wages: {
        Args: {
          p_year: number
          p_month: number
          p_day: number
          p_date: string
          p_day_of_week: string
          p_foh_wages: number
          p_kitchen_wages: number
          p_food_revenue: number
          p_bev_revenue: number
        }
        Returns: Json
      }
      duplicate_database_structure: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      extremely_basic_password_update: {
        Args: { user_id_input: string; password_input: string }
        Returns: boolean
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
      get_latest_pl_snapshots: {
        Args: { p_year: number; p_month: number }
        Returns: {
          category: string
          name: string
          budget_amount: number
          actual_amount: number
          forecast_amount: number
          budget_variance: number
          forecast_variance: number
          captured_at: string
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
      refresh_all_forecasts: {
        Args: { year_val: number; month_val: number }
        Returns: boolean
      }
      refresh_budget_vs_actual: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_financial_performance_analysis: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      set_active_theme: {
        Args: { theme_id: string }
        Returns: undefined
      }
      simple_password_update: {
        Args: { user_id: string; password: string }
        Returns: boolean
      }
      simple_update_password: {
        Args: { user_id: string; new_password: string }
        Returns: boolean
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
      store_pl_snapshot: {
        Args: {
          p_year: number
          p_month: number
          p_category: string
          p_name: string
          p_budget_amount: number
          p_actual_amount: number
          p_forecast_amount: number
        }
        Returns: string
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
      update_message_reaction: {
        Args: { p_message_id: string; p_user_id: string; p_emoji: string }
        Returns: Json
      }
      update_permission_matrix: {
        Args: { matrix: Json }
        Returns: undefined
      }
      update_user_password: {
        Args: { user_id: string; new_password: string }
        Returns: boolean
      }
      update_user_password_fallback: {
        Args: { user_id: string; password: string }
        Returns: boolean
      }
      upsert_master_daily_record: {
        Args: { record_data: Json }
        Returns: Json
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
      day_of_week: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"
      employment_type: "hourly" | "salary" | "contractor"
      forecast_method: "fixed" | "discrete" | "fixed_plus"
      message_type: "text" | "image" | "voice" | "gif" | "file"
      module_type:
        | "food"
        | "beverage"
        | "pl"
        | "wages"
        | "performance"
        | "home"
        | "hiq"
        | "team"
      poll_option_type: "text" | "image"
      revenue_tag_scope: "food" | "beverage" | "both"
      role_type: "foh" | "kitchen"
      user_role: "Owner" | "Manager" | "Team Member" | "GOD" | "Super User"
      wage_target_type: "percent" | "absolute" | "hours"
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
      day_of_week: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
      employment_type: ["hourly", "salary", "contractor"],
      forecast_method: ["fixed", "discrete", "fixed_plus"],
      message_type: ["text", "image", "voice", "gif", "file"],
      module_type: [
        "food",
        "beverage",
        "pl",
        "wages",
        "performance",
        "home",
        "hiq",
        "team",
      ],
      poll_option_type: ["text", "image"],
      revenue_tag_scope: ["food", "beverage", "both"],
      role_type: ["foh", "kitchen"],
      user_role: ["Owner", "Manager", "Team Member", "GOD", "Super User"],
      wage_target_type: ["percent", "absolute", "hours"],
    },
  },
} as const
