
// If this file doesn't exist yet, we'll create it with all necessary types

export type ModuleType = 'home' | 'master' | 'pl' | 'wages' | 'food' | 'beverage' | 'team' | 'hiq';

export interface Module {
  id: string;
  type: ModuleType;
  name: string;
  enabled: boolean;
  displayOrder: number;
}

export interface Supplier {
  id: string;
  name: string;
}

export interface DailyRecord {
  date: string;
  dayOfWeek: string;
  revenue: number;
  purchases: Record<string, number>;
  creditNotes: number[];
  staffFoodAllowance: number;
}

export interface WeeklyRecord {
  weekNumber: number;
  startDate: string;
  endDate: string;
  days: DailyRecord[];
}

export interface MonthlyRecord {
  year: number;
  month: number;
  weeks: WeeklyRecord[];
  gpTarget: number;
  costTarget: number;
  staffFoodAllowance: number;
  suppliers: Supplier[];
}

export interface AnnualRecord {
  year: number;
  months: MonthlyRecord[];
}

export interface AppState {
  currentYear: number;
  currentMonth: number;
  currentModule: ModuleType;
  modules: Module[];
  annualRecord: AnnualRecord;
  setState?: (updates: Partial<AppState>) => void;
}
