
import React, { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { PLTrackerBudgetItem } from './types/PLTrackerTypes';
import { ProcessedBudgetItem } from '../hooks/useBudgetData';
import { TrackerHeader } from './tracker/TrackerHeader';
import { PLTrackerContent } from './tracker/PLTrackerContent';
import { useDateCalculations } from './hooks/useDateCalculations';
import { useTrackerData } from './hooks/useTrackerData';
import { 
  calculateProRatedBudget, 
  getActualAmount, 
  calculateProRatedActual, 
  calculateSummaryProRatedBudget,
  updateAllForecasts,
  getForecastAmount
} from './tracker/TrackerCalculations';
import { storeTrackerSnapshot } from './tracker/SnapshotManager';
import { toast } from "sonner";
import { useTracker } from './hooks/useTracker';

interface PLTrackerProps {
  isLoading: boolean;
  processedBudgetData: ProcessedBudgetItem[];
  currentMonthName: string;
  currentYear: number;
  onClose: () => void;
}

export function PLTracker({
  isLoading,
  processedBudgetData,
  currentMonthName,
  currentYear,
  onClose
}: PLTrackerProps) {
  const { yesterdayDate, daysInMonth, dayOfMonth } = useDateCalculations(currentMonthName, currentYear);
  
  const actualDayOfMonth = currentMonthName === 'April' && currentYear === 2025 ? 19 : dayOfMonth;
  
  console.log(`Using day of month: ${actualDayOfMonth} for ${currentMonthName} ${currentYear}`);
  console.log(`Days in month: ${daysInMonth}`);
  
  console.log("Processed budget data count:", processedBudgetData.length);
  
  // Use the tracker hook which handles initialization
  const { isInitializing } = useTracker(currentYear, currentMonthName);
  
  useEffect(() => {
    if (processedBudgetData && processedBudgetData.length > 0) {
      console.log('Pre-calculating forecast values for all items');
      
      const monthNumber = new Date(Date.parse(`${currentMonthName} 1, ${currentYear}`)).getMonth() + 1;
      
      processedBudgetData.forEach(item => {
        if (item.id) {
          const forecast = getForecastAmount(item, currentYear, monthNumber, daysInMonth, actualDayOfMonth);
          console.log(`Pre-calculated forecast for ${item.name}: ${forecast}`);
        }
      });
    }
  }, [processedBudgetData, currentMonthName, currentYear, daysInMonth, actualDayOfMonth]);
  
  const processedDataWithActuals = processedBudgetData.map(item => {
    console.log(`Processing ${item.name}: budget=${item.budget_amount}, actual=${item.actual_amount}, forecast=${item.forecast_amount}`);
    
    return {
      ...item,
      actual_amount: item.actual_amount
    };
  }) as PLTrackerBudgetItem[];
  
  const {
    trackedBudgetData,
    setTrackedBudgetData,
    hasUnsavedChanges,
    isSaving,
    updateForecastAmount,
    updateManualActualAmount,
    updateDailyValues,
    saveForecastAmounts
  } = useTrackerData(processedDataWithActuals);
  
  const handleSaveWithAnalyticsUpdate = () => {
    // Start save operation
    toast.info("Saving data...");
    setTrackedBudgetData(prev => [...prev]); // Force refresh UI
    
    // First step: Save forecast amounts
    saveForecastAmounts()
      .then(saveSuccess => {
        if (!saveSuccess) {
          toast.error("Failed to save forecast amounts");
          return;
        }
        
        // Second step: Store snapshot data
        const monthNumber = new Date(Date.parse(`${currentMonthName} 1, ${currentYear}`)).getMonth() + 1;
        
        // Store tracker snapshot without checking the return value
        storeTrackerSnapshot(trackedBudgetData, currentYear, monthNumber)
          .then(() => {
            toast.success("Data saved successfully");
          })
          .catch(err => {
            console.error('Error storing snapshot:', err);
            toast.warning("Data saved but snapshot creation failed");
          });
      })
      .catch(error => {
        console.error('Error in save operation:', error);
        toast.error("Failed to save data");
      });
  };
  
  console.log("First 5 tracked budget data items:", trackedBudgetData.slice(0, 5).map(item => ({
    name: item.name,
    actual_amount: item.actual_amount,
    budget_amount: item.budget_amount,
    forecast_amount: item.forecast_amount
  })));
  
  const filteredBudgetData = trackedBudgetData.filter(item => 
    !(item.isHeader && item.budget_amount === 0)
  );
  
  return (
    <Card className="shadow-md rounded-xl overflow-hidden">
      <TrackerHeader
        currentMonthName={currentMonthName}
        currentYear={currentYear}
        yesterdayDate={yesterdayDate}
        dayOfMonth={actualDayOfMonth}
        daysInMonth={daysInMonth}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving || isInitializing}
        onSaveChanges={handleSaveWithAnalyticsUpdate}
        onClose={onClose}
      />
      
      <PLTrackerContent
        isLoading={isLoading || isInitializing}
        filteredBudgetData={filteredBudgetData}
        trackedBudgetData={trackedBudgetData}
        dayOfMonth={actualDayOfMonth}
        daysInMonth={daysInMonth}
        updateManualActualAmount={updateManualActualAmount}
        updateForecastAmount={updateForecastAmount}
        updateDailyValues={updateDailyValues}
        getActualAmount={getActualAmount}
        calculateProRatedBudget={(item) => {
          if (item.isGrossProfit || item.isOperatingProfit || 
              item.name.toLowerCase().includes('total') ||
              item.name.toLowerCase() === 'turnover') {
            return calculateSummaryProRatedBudget(item, daysInMonth, actualDayOfMonth, trackedBudgetData);
          }
          return calculateProRatedBudget(item, daysInMonth, actualDayOfMonth);
        }}
        currentMonthName={currentMonthName}
        currentYear={currentYear}
      />
    </Card>
  );
}
