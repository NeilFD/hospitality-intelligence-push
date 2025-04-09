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
        // Ensure tracking_type is defined
        const trackingType = item.tracking_type || 'Discrete';
        
        // Fetch daily values if the item has an ID and is a discrete tracking item
        let dailyValues: DayInput[] = [];
        let actualAmount = item.actual_amount || 0;
        
        if (item.id && trackingType === 'Discrete') {
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
              const totalValue = dailyValues.reduce((sum, day) => sum + (day.value || 0), 0);
              
              // Update actual_amount for Discrete tracking items
              if (trackingType === 'Discrete') {
                actualAmount = totalValue;
              }
            }
          } catch (error) {
            console.error(`Error fetching daily values for item ${item.name}:`, error);
          }
        }
        
        return {
          ...item,
          tracking_type: trackingType,
          daily_values: dailyValues,
          actual_amount: actualAmount
        };
      }));
      
      setTrackedBudgetData(trackedData);
    };
    
    if (processedBudgetData.length > 0) {
      initializeTrackerData();
    }
  }, [processedBudgetData]);
  
  // Update forecast amount
  const updateForecastAmount = (index: number, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    
    setTrackedBudgetData(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        forecast_amount: numValue
      };
      return updated;
    });
    
    setHasUnsavedChanges(true);
  };
  
  // Update manually entered actual amount
  const updateManualActualAmount = (index: number, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    
    setTrackedBudgetData(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        manually_entered_actual: numValue
      };
      return updated;
    });
    
    setHasUnsavedChanges(true);
  };
  
  // Update daily values
  const updateDailyValues = (index: number, dailyValues: DayInput[]) => {
    setTrackedBudgetData(prev => {
      const updated = [...prev];
      
      // Update daily values
      updated[index] = {
        ...updated[index],
        daily_values: dailyValues
      };
      
      // Calculate total from daily values
      const total = dailyValues.reduce((sum, day) => sum + (day.value || 0), 0);
      
      // Store total as actual amount if this is a revenue or expense item
      if (!updated[index].isHeader && !updated[index].isGrossProfit && !updated[index].isOperatingProfit) {
        updated[index].actual_amount = total;
      }
      
      return updated;
    });
    
    setHasUnsavedChanges(true);
  };
  
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
