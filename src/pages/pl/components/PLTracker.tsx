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
  
  // Force day of month to be 19 for April 2025 as specified
  const actualDayOfMonth = currentMonthName === 'April' && currentYear === 2025 ? 19 : dayOfMonth;
  
  console.log(`Using day of month: ${actualDayOfMonth} for ${currentMonthName} ${currentYear}`);
  console.log(`Days in month: ${daysInMonth}`);
  
  // Debug log for all processed budget data
  console.log("Processed budget data count:", processedBudgetData.length);
  
  // Initialize forecasts when component loads - CRITICAL to ensure forecasts exist
  useEffect(() => {
    const monthNumber = new Date(Date.parse(`${currentMonthName} 1, ${currentYear}`)).getMonth() + 1;
    console.log(`Initializing forecasts for ${currentYear}-${monthNumber}`);
    
    // Force update of all forecasts in the database
    const updateForecasts = async () => {
      try {
        const success = await updateAllForecasts(currentYear, monthNumber);
        console.log('Forecasts updated successfully on component load:', success);
      } catch (err) {
        console.error('Failed to update forecasts on component load:', err);
      }
    };
    
    updateForecasts();
  }, [currentMonthName, currentYear]);
  
  // Pre-calculate forecast values for all items
  useEffect(() => {
    if (processedBudgetData && processedBudgetData.length > 0) {
      console.log('Pre-calculating forecast values for all items');
      
      const monthNumber = new Date(Date.parse(`${currentMonthName} 1, ${currentYear}`)).getMonth() + 1;
      
      processedBudgetData.forEach(item => {
        // Only process items with IDs
        if (item.id) {
          const forecast = getForecastAmount(item, currentYear, monthNumber, daysInMonth, actualDayOfMonth);
          console.log(`Pre-calculated forecast for ${item.name}: ${forecast}`);
        }
      });
    }
  }, [processedBudgetData, currentMonthName, currentYear, daysInMonth, actualDayOfMonth]);
  
  // Keep original actual_amount values intact for special items like revenue, COS, wages
  const processedDataWithActuals = processedBudgetData.map(item => {
    // Log each item's budget and actual amount for debugging
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
  
  // Debug log for top few actual amounts
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
        onSaveChanges={saveForecastAmounts}
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
