
// Add or fix types to include year and month properties

export interface DayInput {
  day: number;  // Add the required 'day' property
  value: number;
}

export interface PLTrackerBudgetItem {
  id: string;
  name: string;
  category: string;
  budget_amount: number;
  actual_amount?: number;
  forecast_amount?: number;
  budget_percentage?: number;
  isHeader?: boolean;
  isHighlighted?: boolean;
  isGrossProfit?: boolean;
  isOperatingProfit?: boolean;
  tracking_type?: string;
  daily_values?: DayInput[];
  year: number;  // Add the required 'year' property
  month: number; // Add the required 'month' property
}
