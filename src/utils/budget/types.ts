
export interface BudgetItem {
  category: string;
  name: string;
  budget: number;
  actual?: number;
  forecast?: number;
  tracking_type?: 'Discrete' | 'Pro-Rated';
}
