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
  
  useEffect(() => {
    const initializeTrackerData = async () => {
      console.log("Initializing tracker data with", processedBudgetData.length, "items");
      
      if (processedBudgetData.length === 0) {
        return;
      }
      
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      
      const trackedData: PLTrackerBudgetItem[] = await Promise.all(processedBudgetData.map(async (item) => {
        let dailyValues: DayInput[] = [];
        
        if (item.id) {
          try {
            const dbValues = await fetchDailyValues(item.id, month, year);
            
            if (dbValues && dbValues.length > 0) {
              console.log(`Found ${dbValues.length} daily values for ${item.name}`);
              dailyValues = dbValues.map(dbValue => {
                const date = new Date(year, month - 1, dbValue.day);
                return {
                  day: dbValue.day,
                  value: dbValue.value,
                  date
                };
              });
            }
          } catch (error) {
            console.error(`Error fetching daily values for item ${item.name}:`, error);
          }
        }
        
        const isRevenueItem = item.name.toLowerCase().includes('turnover') || 
                           item.name.toLowerCase().includes('revenue') ||
                           item.name.toLowerCase().includes('sales');
                          
        const isCOSItem = item.name.toLowerCase().includes('cost of sales') || 
                        item.name.toLowerCase().includes('cos');
                          
        const isGrossProfitItem = item.name.toLowerCase().includes('gross profit') ||
                                item.isGrossProfit;
                                
        const isWagesItem = item.name.toLowerCase().includes('wages') ||
                          item.name.toLowerCase().includes('salaries');

        return {
          ...item,
          daily_values: dailyValues
        };
      }));
      
      trackedData.slice(0, 5).forEach(item => {
        console.log(`${item.name} actual amount: ${item.actual_amount}`);
      });
      
      setTrackedBudgetData(trackedData);
    };
    
    if (processedBudgetData.length > 0) {
      initializeTrackerData();
    }
  }, [processedBudgetData]);
  
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
  
  const updateManualActualAmount = useCallback((index: number, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    
    setTrackedBudgetData(prev => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = {
          ...updated[index],
          manually_entered_actual: numValue,
          actual_amount: numValue
        };
      }
      return updated;
    });
    
    setHasUnsavedChanges(true);
  }, []);
  
  const updateDailyValues = useCallback((index: number, day: number, value: string) => {
    setTrackedBudgetData(prev => {
      const updated = [...prev];
      
      if (!updated[index] || !updated[index].daily_values) {
        return prev;
      }
      
      const dailyValues = [...updated[index].daily_values];
      const dayIndex = dailyValues.findIndex(d => d.day === day);
      
      if (dayIndex >= 0) {
        dailyValues[dayIndex] = {
          ...dailyValues[dayIndex],
          value: value === '' ? null : parseFloat(value)
        };
      }
      
      updated[index] = {
        ...updated[index],
        daily_values: dailyValues
      };
      
      const total = dailyValues.reduce((sum, day) => sum + (Number(day.value) || 0), 0);
      
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
  
  const saveForecastAmounts = useCallback(async () => {
    if (!hasUnsavedChanges) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      const updatesArray = trackedBudgetData
        .filter(item => item.id && (item.forecast_amount !== undefined))
        .map(item => ({
          id: item.id,
          forecast_amount: item.forecast_amount
        }));
      
      if (updatesArray.length === 0) {
        setIsSaving(false);
        return;
      }
      
      console.log("Saving forecast amounts:", updatesArray);
      
      const { error } = await supabase
        .from('budget_items')
        .upsert(updatesArray);
      
      if (error) {
        console.error('Error saving forecast amounts:', error);
      } else {
        setHasUnsavedChanges(false);
      }
    } catch (err) {
      console.error('Unexpected error saving forecast amounts:', err);
    } finally {
      setIsSaving(false);
    }
  }, [hasUnsavedChanges, trackedBudgetData]);
  
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
