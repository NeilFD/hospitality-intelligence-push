
export interface PLTrackerBudgetItem {
  id: string;
  name: string;
  category?: string;
  isHeader?: boolean;
  isGrossProfit?: boolean;
  isOperatingProfit?: boolean;
  isHighlighted?: boolean;
  budget_amount: number;
  actual_amount?: number;
  budget_percentage?: number;
  forecast_amount?: number;
  manual_actual_amount?: number;
  daily_values?: DayInput[];
  forecast_settings?: {
    method: 'fixed' | 'discrete' | 'fixed_plus';
    discrete_values?: Record<string, number>;
  };
  manually_entered_actual?: number;
}

export interface DayInput {
  day: number;
  value: number;
  id?: string;
  date?: Date; // Optional date property to support existing code
}
