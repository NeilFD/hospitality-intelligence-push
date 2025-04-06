
import { useState, useEffect } from 'react';
import { PLTrackerBudgetItem, DayInput } from '../types/PLTrackerTypes';
import { ProcessedBudgetItem } from '../../hooks/useBudgetData';
import { useToast } from '@/hooks/use-toast';

export function useTrackerData(processedBudgetData: ProcessedBudgetItem[]) {
  const { toast } = useToast();
  const [trackedBudgetData, setTrackedBudgetData] = useState<PLTrackerBudgetItem[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize the tracker data from the processed budget data
  useEffect(() => {
    // Only initialize if we need to
    if (processedBudgetData.length > 0 && trackedBudgetData.length === 0) {
      const trackerData: PLTrackerBudgetItem[] = processedBudgetData.map((item) => ({
        ...item,
        tracking_type: 'Pro-Rated', // Default tracking type
        daily_values: [] // Initialize empty daily values
      }));
      setTrackedBudgetData(trackerData);
    }
  }, [processedBudgetData, trackedBudgetData.length]);

  // Update forecast amount for a budget item
  const updateForecastAmount = (index: number, value: string) => {
    const newValue = value === '' ? undefined : parseFloat(value);
    const updatedData = [...trackedBudgetData];
    updatedData[index].forecast_amount = newValue;
    setTrackedBudgetData(updatedData);
    setHasUnsavedChanges(true);
  };

  // Update manual actual amount for a budget item
  const updateManualActualAmount = (index: number, value: string) => {
    const newValue = value === '' ? undefined : parseFloat(value);
    const updatedData = [...trackedBudgetData];
    updatedData[index].manually_entered_actual = newValue;
    setTrackedBudgetData(updatedData);
    setHasUnsavedChanges(true);
  };

  // Update daily values for a budget item
  const updateDailyValues = (index: number, dailyValues: DayInput[]) => {
    const updatedData = [...trackedBudgetData];
    updatedData[index].daily_values = dailyValues;
    
    // Calculate the total from daily values
    const total = dailyValues.reduce(
      (sum, day) => sum + (day.value || 0), 0
    );
    
    // Update the manually entered actual with the calculated total
    updatedData[index].manually_entered_actual = total;
    
    setTrackedBudgetData(updatedData);
    setHasUnsavedChanges(true);
  };

  // Save forecast amounts to the API/storage
  const saveForecastAmounts = async () => {
    try {
      setIsSaving(true);
      
      // Simulate API call with a timeout
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Success handling
      setHasUnsavedChanges(false);
      toast({
        title: "Success",
        description: "Forecast amounts saved successfully",
      });
    } catch (error) {
      console.error("Error saving forecast amounts:", error);
      toast({
        title: "Error",
        description: "Failed to save forecast amounts",
        variant: "destructive",
      });
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
}
