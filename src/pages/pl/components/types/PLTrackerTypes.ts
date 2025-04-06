
import { ProcessedBudgetItem } from '../../hooks/useBudgetData';

export interface PLTrackerBudgetItem extends ProcessedBudgetItem {
  tracking_type: 'Discrete' | 'Pro-Rated';
  manually_entered_actual?: number;
}

export interface PLTrackerProps {
  isLoading: boolean;
  processedBudgetData: ProcessedBudgetItem[];
  currentMonthName: string;
  currentYear: number;
  onClose: () => void;
}
