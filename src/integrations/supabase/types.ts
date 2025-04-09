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
      master_daily_records: {
        Row: {
          beverage_revenue: number | null
          created_at: string
          date: string
          day_of_week: string
          dinner_covers: number | null
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
          beverage_revenue?: number | null
          created_at?: string
          date: string
          day_of_week: string
          dinner_covers?: number | null
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
          beverage_revenue?: number | null
          created_at?: string
          date?: string
          day_of_week?: string
          dinner_covers?: number | null
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
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
      module_type: "food" | "beverage" | "pl" | "wages" | "performance"
      user_role: "Owner" | "Head Chef" | "Staff"
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
      module_type: ["food", "beverage", "pl", "wages", "performance"],
      user_role: ["Owner", "Head Chef", "Staff"],
    },
  },
} as const
