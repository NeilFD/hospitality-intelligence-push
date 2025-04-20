
import { useState, useEffect, useCallback } from 'react';
import { PLTrackerBudgetItem, DayInput } from '../types/PLTrackerTypes';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { fetchDailyValues, saveDailyValues } from '@/services/budget-service';

export function useTrackerData(processedBudgetData: PLTrackerBudgetItem[]) {
  const [trackedBudgetData, setTrackedBudgetData] = useState<PLTrackerBudgetItem[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  
  // Initialize tracker data when budget data changes
  useEffect(() => {
    const initializeTrackerData = async () => {
      console.log("Initializing tracker data with", processedBudgetData.length, "items");
      
      if (processedBudgetData.length === 0) {
        return;
      }
      
      // Get the current month and year for daily values
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1; // 1-based
      const year = currentDate.getFullYear();
      
      // Create a copy of the budget data with tracking information
      const trackedData: PLTrackerBudgetItem[] = await Promise.all(processedBudgetData.map(async (item) => {
        // Fetch daily values if the item has an ID
        let dailyValues: DayInput[] = [];
        let actualAmount = item.actual_amount !== undefined ? item.actual_amount : 0;
        
        if (item.id) {
          try {
            // Fetch daily values from Supabase
            const dbValues = await fetchDailyValues(item.id, month, year);
            
            // Convert to DayInput format
            if (dbValues && dbValues.length > 0) {
              console.log(`Found ${dbValues.length} daily values for ${item.name}`);
              dailyValues = dbValues.map(dbValue => {
                const date = new Date(year, month - 1, dbValue.day);
                return {
                  date,
                  value: dbValue.value
                };
              });
              
              // Calculate the total value from daily values
              const totalValue = dailyValues.reduce((sum, day) => sum + (Number(day.value) || 0), 0);
              
              // For non-special items, update the actual amount from daily values
              if (!item.name.toLowerCase().includes('revenue') &&
                  !item.name.toLowerCase().includes('turnover') &&
                  !item.name.toLowerCase().includes('cost of sales') &&
                  !item.name.toLowerCase().includes('cos') &&
                  !item.name.toLowerCase().includes('gross profit') &&
                  !item.name.toLowerCase().includes('operating profit') &&
                  !item.name.toLowerCase().includes('wages') &&
                  !item.name.toLowerCase().includes('salary') &&
                  actualAmount === 0) {
                actualAmount = totalValue;
              }
            }
          } catch (error) {
            console.error(`Error fetching daily values for item ${item.name}:`, error);
          }
        }
        
        return {
          ...item,
          daily_values: dailyValues,
          actual_amount: actualAmount
        };
      }));
      
      // Log the actual amounts for debugging - include first few items
      trackedData.slice(0, 5).forEach(item => {
        console.log(`${item.name} actual amount: ${item.actual_amount}`);
      });
      
      setTrackedBudgetData(trackedData);
    };
    
    if (processedBudgetData.length > 0) {
      initializeTrackerData();
    }
  }, [processedBudgetData]);
  
  // Update forecast amount
  const updateForecastAmount = useCallback((index: number, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    
    setTrackedBudgetData(prev => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = {
          ...updated[index],
          forecast_amount: numValue
        };
      }
      return updated;
    });
    
    setHasUnsavedChanges(true);
  }, []);
  
  // Update manually entered actual amount
  const updateManualActualAmount = useCallback((index: number, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    
    setTrackedBudgetData(prev => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = {
          ...updated[index],
          manually_entered_actual: numValue,
          actual_amount: numValue // Also update actual_amount for discrete items
        };
      }
      return updated;
    });
    
    setHasUnsavedChanges(true);
  }, []);
  
  // Update daily values
  const updateDailyValues = useCallback((index: number, dailyValues: DayInput[]) => {
    setTrackedBudgetData(prev => {
      const updated = [...prev];
      
      if (!updated[index]) {
        return prev;
      }
      
      // Update daily values
      updated[index] = {
        ...updated[index],
        daily_values: dailyValues
      };
      
      // Calculate total from daily values
      const total = dailyValues.reduce((sum, day) => sum + (Number(day.value) || 0), 0);
      
      // Update actual_amount for normal items if not already set by master data
      if (!updated[index].isHeader &&
          !updated[index].isGrossProfit &&
          !updated[index].isOperatingProfit &&
          !updated[index].name.toLowerCase().includes('revenue') &&
          !updated[index].name.toLowerCase().includes('turnover') &&
          !updated[index].name.toLowerCase().includes('cost of sales') &&
          !updated[index].name.toLowerCase().includes('cos')) {
        updated[index].actual_amount = total;
      }
      
      return updated;
    });
    
    setHasUnsavedChanges(true);
  }, []);
  
  // Save forecast amounts to database
  const saveForecastAmounts = useCallback(async () => {
    if (!hasUnsavedChanges) {
      toast({
        title: "No changes to save",
        description: "You haven't made any changes to save.",
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Prepare data for update
      const updatesArray = trackedBudgetData
        .filter(item => item.id && (item.forecast_amount !== undefined))
        .map(item => ({
          id: item.id,
          forecast_amount: item.forecast_amount
        }));
      
      if (updatesArray.length === 0) {
        toast({
          title: "No changes to save",
          description: "You haven't made any changes to save.",
        });
        setIsSaving(false);
        return;
      }
      
      console.log("Saving forecast amounts:", updatesArray);
      
      // Update the database
      const { error } = await supabase
        .from('budget_items')
        .upsert(updatesArray);
      
      if (error) {
        console.error('Error saving forecast amounts:', error);
        toast({
          title: "Error",
          description: "Failed to save forecast amounts.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Forecast amounts saved successfully.",
        });
        setHasUnsavedChanges(false);
      }
    } catch (err) {
      console.error('Unexpected error saving forecast amounts:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [hasUnsavedChanges, trackedBudgetData, toast]);
  
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
