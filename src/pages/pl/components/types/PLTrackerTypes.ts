
import { ProcessedBudgetItem } from '../../hooks/useBudgetData';

export interface DayInput {
  date: Date;
  value: number | null;
}

export interface PLTrackerBudgetItem extends ProcessedBudgetItem {
  tracking_type: 'Discrete' | 'Pro-Rated';
  manually_entered_actual?: number;
  daily_values?: DayInput[];
}

export interface PLTrackerProps {
  isLoading: boolean;
  processedBudgetData: ProcessedBudgetItem[];
  currentMonthName: string;
  currentYear: number;
  onClose: () => void;
}
