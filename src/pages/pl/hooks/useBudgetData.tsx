
import { useEffect, useState } from 'react';
import { PLTrackerBudgetItem, DayInput } from '../components/types/PLTrackerTypes';
import { fetchBudgetItems, upsertBudgetItems } from '@/utils/budget/api';
import { fetchBudgetDailyValues, upsertBudgetDailyValues } from '@/services/kitchen-service';

// Export this interface so it can be used in other files
export interface ProcessedBudgetItem {
  id?: string;
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
  tracking_type?: 'Discrete' | 'Pro-Rated';
  daily_values?: DayInput[];
  manually_entered_actual?: number;
}

export const useBudgetData = (currentYear: number, currentMonth: number) => {
  const [budgetData, setBudgetData] = useState<ProcessedBudgetItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const fetchedData = await fetchBudgetItems(currentYear, currentMonth);
        setBudgetData(fetchedData);
      } catch (e: any) {
        setError(e.message || "Failed to fetch budget items");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [currentMonth, currentYear]);
  
  return {
    budgetData,
    isLoading,
    error
  };
};

export const useTrackerData = (initialData: PLTrackerBudgetItem[]) => {
  const [trackedBudgetData, setTrackedBudgetData] = useState<PLTrackerBudgetItem[]>(initialData);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    setTrackedBudgetData(initialData);
  }, [initialData]);
  
  const updateForecastAmount = (index: number, value: string) => {
    const updatedData = [...trackedBudgetData];
    
    if (updatedData[index]) {
      updatedData[index] = {
        ...updatedData[index],
        forecast_amount: parseFloat(value) || 0
      };
      setTrackedBudgetData(updatedData);
      setHasUnsavedChanges(true);
    }
  };
  
  const updateManualActualAmount = (index: number, value: string) => {
    const updatedData = [...trackedBudgetData];
    
    if (updatedData[index]) {
      updatedData[index] = {
        ...updatedData[index],
        manually_entered_actual: parseFloat(value) || 0
      };
      setTrackedBudgetData(updatedData);
      setHasUnsavedChanges(true);
    }
  };
  
  const updateDailyValues = async (index: number, dailyValues: DayInput[]) => {
    const updatedData = [...trackedBudgetData];
    
    if (updatedData[index]) {
      updatedData[index] = {
        ...updatedData[index],
        daily_values: dailyValues
      };
      setTrackedBudgetData(updatedData);
      setHasUnsavedChanges(true);
    }
  };
  
  const saveForecastAmounts = async () => {
    setIsSaving(true);
    
    try {
      const budgetItemsToUpdate = trackedBudgetData.filter(item => item.id && item.forecast_amount !== undefined);
      
      if (budgetItemsToUpdate.length > 0) {
        await upsertBudgetItems(budgetItemsToUpdate);
      }
      
      const dailyValuesToUpdate = trackedBudgetData.filter(item => item.id && item.daily_values);
      
      if (dailyValuesToUpdate.length > 0) {
        await upsertBudgetDailyValues(dailyValuesToUpdate);
      }
      
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error saving forecast amounts:", error);
    } finally {
      setIsSaving(false);
    }
  };
  
  return {
    trackedBudgetData,
    setTrackedBudgetData,
    hasUnsavedChanges,
    isSaving,
    updateForecastAmount,
    updateManualActualAmount,
    updateDailyValues,
    saveForecastAmounts
  };
};
