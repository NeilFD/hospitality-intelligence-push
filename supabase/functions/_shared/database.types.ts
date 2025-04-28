
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      wages: {
        Row: {
          id: string
          year: number
          month: number
          day: number
          date: string
          day_of_week: string
          foh_wages: number
          kitchen_wages: number
          food_revenue: number
          bev_revenue: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id?: string
          year: number
          month: number
          day: number
          date: string
          day_of_week: string
          foh_wages: number
          kitchen_wages: number
          food_revenue: number
          bev_revenue: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          year?: number
          month?: number
          day?: number
          date?: string
          day_of_week?: string
          foh_wages?: number
          kitchen_wages?: number
          food_revenue?: number
          bev_revenue?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
