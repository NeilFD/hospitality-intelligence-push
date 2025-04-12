
export interface Supplier {
  id: string;
  name: string;
}

export interface WeekDates {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export interface DailyPurchase {
  supplierId: string;
  amount: number;
}

export interface DailyRecord {
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  revenue: number;
  purchases: Record<string, number>; // supplierId -> amount
  creditNotes: number[];
  staffFoodAllowance: number;
}

export interface WeeklyRecord {
  id: string;
  weekNumber: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  days: DailyRecord[];
}

export interface MonthlyRecord {
  year: number;
  month: number; // 1-12
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

export type ModuleType = 'food' | 'beverage' | 'pl' | 'wages' | 'performance' | 'master' | 'team' | 'hospitality';

export interface Module {
  id: string;
  type: ModuleType;
  name: string;
  enabled: boolean;
  displayOrder: number;
}

export interface AppState {
  currentYear: number;
  currentMonth: number;
  currentModule: ModuleType;
  annualRecord: AnnualRecord;
  modules: Module[];
}
