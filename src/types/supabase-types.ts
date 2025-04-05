
import type { WeeklyRecord, DailyRecord, MonthlyRecord } from './kitchen-ledger';
import { ModuleType } from './kitchen-ledger';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: UserProfile;
        Insert: {
          id: string;
          first_name?: string | null;
          last_name?: string | null;
          role?: 'Owner' | 'Head Chef' | 'Staff' | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string | null;
          last_name?: string | null;
          role?: 'Owner' | 'Head Chef' | 'Staff' | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      suppliers: {
        Row: DBSupplier;
        Insert: {
          id?: string;
          name: string;
          contact_name?: string | null;
          email?: string | null;
          phone?: string | null;
          notes?: string | null;
          module_type?: ModuleType;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          contact_name?: string | null;
          email?: string | null;
          phone?: string | null;
          notes?: string | null;
          module_type?: ModuleType;
          created_at?: string;
          updated_at?: string;
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
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

export type DbSupplier = Database['public']['Tables']['suppliers']['Row'];
export type DbDailyRecord = Database['public']['Tables']['daily_records']['Row'];
export type DbWeeklyRecord = Database['public']['Tables']['weekly_records']['Row'];
export type DbPurchase = Database['public']['Tables']['purchases']['Row'];
export type DbCreditNote = Database['public']['Tables']['credit_notes']['Row'];
export type DbMonthlySettings = Database['public']['Tables']['monthly_settings']['Row'];
export type DbProfile = Database['public']['Tables']['profiles']['Row'];

export interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: 'Owner' | 'Head Chef' | 'Staff' | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  email?: string;
}

export interface DBSupplier {
  id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  module_type: ModuleType;
  created_at: string;
  updated_at: string;
}

// Re-export the supplier type from kitchen-ledger to avoid conflicts
export type { Supplier } from './kitchen-ledger';
