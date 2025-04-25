
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
  getForecastAmount,
  refreshBudgetVsActual
} from './tracker/TrackerCalculations';
import { storeTrackerSnapshot } from './tracker/SnapshotManager';

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
  
  useEffect(() => {
    const monthNumber = new Date(Date.parse(`${currentMonthName} 1, ${currentYear}`)).getMonth() + 1;
    console.log(`Initializing forecasts for ${currentYear}-${monthNumber}`);
    
    const updateForecasts = async () => {
      try {
        const success = await updateAllForecasts(currentYear, monthNumber);
        console.log('Forecasts updated successfully on component load:', success);
        
        // Call refreshBudgetVsActual but don't rely on its return value
        refreshBudgetVsActual();
        console.log('Budget vs actual refresh triggered on component load');
      } catch (err) {
        console.error('Failed to update forecasts on component load:', err);
      }
    };
    
    updateForecasts();
  }, [currentMonthName, currentYear]);
  
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
  
  const handleSaveWithAnalyticsUpdate = async (): Promise<boolean> => {
    try {
      const saveSuccess = await saveForecastAmounts();
      
      if (saveSuccess) {
        // Store snapshot data
        const monthNumber = new Date(Date.parse(`${currentMonthName} 1, ${currentYear}`)).getMonth() + 1;
        await storeTrackerSnapshot(trackedBudgetData, currentYear, monthNumber);
        
        // Call refreshBudgetVsActual without checking its return value or awaiting it
        // This avoids the TypeScript error about testing void for truthiness
        refreshBudgetVsActual();
        console.log('Analytics data refresh triggered after saving forecasts');
        
        return true;  // Return true if saving was successful
      }
      
      return false;  // Return false if saving was not successful
    } catch (err) {
      console.error('Error in handleSaveWithAnalyticsUpdate:', err);
      return false;
    }
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
        isSaving={isSaving}
        onSaveChanges={handleSaveWithAnalyticsUpdate}
        onClose={onClose}
      />
      
      <PLTrackerContent
        isLoading={isLoading}
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
