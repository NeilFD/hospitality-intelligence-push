
import { ProcessedBudgetItem } from '../../hooks/useBudgetData';

export interface DayInput {
  date: Date;
  value: number | null;
}

export interface PLTrackerBudgetItem extends ProcessedBudgetItem {
  tracking_type: 'Discrete' | 'Pro-Rated';
  manually_entered_actual?: number;
  daily_values?: DayInput[];
  // Adding missing properties that are being used
  isHeader?: boolean;
  isGrossProfit?: boolean;
  isOperatingProfit?: boolean;
  budget_amount: number;
  name: string;
  id?: string;
}

export interface PLTrackerProps {
  isLoading: boolean;
  processedBudgetData: ProcessedBudgetItem[];
  currentMonthName: string;
  currentYear: number;
  onClose: () => void;
}
