
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { ProcessedBudgetItem } from '../../hooks/useBudgetData';
import { PLTrackerBudgetItem } from '../types/PLTrackerTypes';
import { fetchBudgetItemTracking } from '@/services/kitchen-service';

export function useTrackerData(processedBudgetData: ProcessedBudgetItem[]) {
  const [trackedBudgetData, setTrackedBudgetData] = useState<PLTrackerBudgetItem[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (processedBudgetData.length > 0) {
      setTrackedBudgetData(prevData => {
        if (prevData.length > 0) {
          const trackingTypeMap = new Map<string, 'Discrete' | 'Pro-Rated'>();
          const manualActualsMap = new Map<string, number | undefined>();
          
          prevData.forEach(item => {
            if (item.id) {
              trackingTypeMap.set(item.id, item.tracking_type);
              manualActualsMap.set(item.id, item.manually_entered_actual);
            }
          });
          
          return processedBudgetData.map(item => ({
            ...item,
            tracking_type: (item.id && trackingTypeMap.has(item.id))
              ? trackingTypeMap.get(item.id)!
              : 'Pro-Rated', // Default to Pro-Rated for all items
            manually_entered_actual: (item.id && manualActualsMap.has(item.id))
              ? manualActualsMap.get(item.id)
              : undefined
          }));
        }
        
        return processedBudgetData.map(item => ({
          ...item,
          tracking_type: 'Pro-Rated' // Default to Pro-Rated for all items
        }));
      });
      
      // Load tracking data from backend
      const loadTrackingData = async () => {
        try {
          const itemIds = processedBudgetData
            .filter(item => item.id)
            .map(item => item.id as string);
            
          if (itemIds.length === 0) return;
          
          const trackingData = await fetchBudgetItemTracking(itemIds);
          
          if (trackingData && trackingData.length > 0) {
            const trackingMap = new Map<string, string>();
            
            trackingData.forEach(item => {
              trackingMap.set(item.budget_item_id, item.tracking_type);
            });
            
            setTrackedBudgetData(prevData => prevData.map(item => {
              if (item.id && trackingMap.has(item.id)) {
                return {
                  ...item,
                  tracking_type: trackingMap.get(item.id) as 'Discrete' | 'Pro-Rated'
                };
              }
              return item;
            }));
          }
        } catch (error) {
          console.error('Error loading tracking data:', error);
        }
      };
      
      loadTrackingData();
      setHasUnsavedChanges(false);
    }
  }, [processedBudgetData]);

  const updateForecastAmount = (index: number, value: string) => {
    const numericValue = value === '' ? undefined : parseFloat(value);
    
    const updatedData = [...trackedBudgetData];
    updatedData[index] = {
      ...updatedData[index],
      forecast_amount: numericValue
    };
    setTrackedBudgetData(updatedData);
    setHasUnsavedChanges(true);
  };

  const updateManualActualAmount = (index: number, value: string) => {
    const numericValue = value === '' ? undefined : parseFloat(value);
    
    const updatedData = [...trackedBudgetData];
    updatedData[index] = {
      ...updatedData[index],
      manually_entered_actual: numericValue
    };
    setTrackedBudgetData(updatedData);
    setHasUnsavedChanges(true);
  };

  const saveForecastAmounts = async () => {
    if (!hasUnsavedChanges) return;
    
    setIsSaving(true);
    
    try {
      const itemsWithId = trackedBudgetData.filter(item => item.id);
      
      const forecastUpdates = itemsWithId
        .filter(item => item.forecast_amount !== undefined)
        .map(item => ({
          id: item.id,
          forecast_amount: item.forecast_amount
        }));
      
      if (forecastUpdates.length > 0) {
        for (const update of forecastUpdates) {
          if (update.id) {
            await supabase
              .from('budget_items')
              .update({ forecast_amount: update.forecast_amount })
              .eq('id', update.id);
          }
        }
      }
      
      toast({
        title: "Forecast amounts saved",
        description: "Your forecast amounts have been saved.",
      });
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error in saveForecastAmounts:', error);
      toast({
        title: "Error saving forecast",
        description: "An unexpected error occurred while saving forecast amounts.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    trackedBudgetData,
    setTrackedBudgetData,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    isSaving,
    setIsSaving,
    updateForecastAmount,
    updateManualActualAmount,
    saveForecastAmounts
  };
}
