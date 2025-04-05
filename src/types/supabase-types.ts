
import { Supplier, WeeklyRecord, DailyRecord, MonthlyRecord } from './kitchen-ledger';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          first_name: string | null;
          last_name: string | null;
          avatar_url: string | null;
          role: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          role?: string | null;
        };
        Update: {
          id?: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          role?: string | null;
        };
      };
      suppliers: {
        Row: {
          id: string;
          name: string;
          contact_name: string | null;
          email: string | null;
          phone: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          contact_name?: string | null;
          email?: string | null;
          phone?: string | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          contact_name?: string | null;
          email?: string | null;
          phone?: string | null;
          notes?: string | null;
        };
      };
      weekly_records: {
        Row: {
          id: string;
          week_number: number;
          year: number;
          month: number;
          start_date: string;
          end_date: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          week_number: number;
          year: number;
          month: number;
          start_date: string;
          end_date: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          week_number?: number;
          year?: number;
          month?: number;
          start_date?: string;
          end_date?: string;
          created_by?: string | null;
        };
      };
      daily_records: {
        Row: {
          id: string;
          weekly_record_id: string;
          date: string;
          day_of_week: string;
          revenue: number | null;
          staff_food_allowance: number | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          weekly_record_id: string;
          date: string;
          day_of_week: string;
          revenue?: number | null;
          staff_food_allowance?: number | null;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          weekly_record_id?: string;
          date?: string;
          day_of_week?: string;
          revenue?: number | null;
          staff_food_allowance?: number | null;
          created_by?: string | null;
        };
      };
      purchases: {
        Row: {
          id: string;
          daily_record_id: string;
          supplier_id: string | null;
          amount: number | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          daily_record_id: string;
          supplier_id?: string | null;
          amount?: number | null;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          daily_record_id?: string;
          supplier_id?: string | null;
          amount?: number | null;
          created_by?: string | null;
        };
      };
      credit_notes: {
        Row: {
          id: string;
          daily_record_id: string;
          amount: number | null;
          description: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          daily_record_id: string;
          amount?: number | null;
          description?: string | null;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          daily_record_id?: string;
          amount?: number | null;
          description?: string | null;
          created_by?: string | null;
        };
      };
      monthly_settings: {
        Row: {
          id: string;
          year: number;
          month: number;
          gp_target: number | null;
          cost_target: number | null;
          staff_food_allowance: number | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          year: number;
          month: number;
          gp_target?: number | null;
          cost_target?: number | null;
          staff_food_allowance?: number | null;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          year?: number;
          month?: number;
          gp_target?: number | null;
          cost_target?: number | null;
          staff_food_allowance?: number | null;
          created_by?: string | null;
        };
      };
    };
  };
}

// Utility types for mapping database types to frontend types
export type DbSupplier = Database['public']['Tables']['suppliers']['Row'];
export type DbDailyRecord = Database['public']['Tables']['daily_records']['Row'];
export type DbWeeklyRecord = Database['public']['Tables']['weekly_records']['Row'];
export type DbPurchase = Database['public']['Tables']['purchases']['Row'];
export type DbCreditNote = Database['public']['Tables']['credit_notes']['Row'];
export type DbMonthlySettings = Database['public']['Tables']['monthly_settings']['Row'];
export type DbProfile = Database['public']['Tables']['profiles']['Row'];

export interface UserProfile extends DbProfile {
  full_name?: string;
}
