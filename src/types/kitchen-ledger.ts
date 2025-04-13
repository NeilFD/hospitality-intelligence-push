// Existing type definitions (if any)
export type ModuleType = 'food' | 'beverage' | 'pl';

export interface TrackerSummary {
  year: number;
  month: number;
  moduleType: ModuleType;
  revenue: number;
  cost: number; // This is the required property that was missing
  purchases: number;
  creditNotes: number;
  staffAllowance: number;
  totalCost: number;
  gpAmount: number;
  gpPercentage: number;
}
