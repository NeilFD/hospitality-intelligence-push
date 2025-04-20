
export interface BudgetItem {
  id?: string;
  category: string;
  name: string;
  budget: number;
  budget_amount?: number;
  actual?: number;
  actual_amount?: number;
  forecast?: number;
  forecast_amount?: number;
  budget_percentage?: number;
  isHeader?: boolean;
  isAdminHeader?: boolean;
  isHighlighted?: boolean;
  isGrossProfit?: boolean;
  isOperatingProfit?: boolean;
  tracking_type?: 'Discrete' | 'Pro-Rated';
  forecast_settings?: {
    method: 'fixed' | 'discrete' | 'fixed_plus';
    discrete_values?: Record<string, number>;
  };
}
