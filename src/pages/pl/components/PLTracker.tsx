
import React from 'react';
import { Card } from '@/components/ui/card';
import { PLTrackerBudgetItem } from './types/PLTrackerTypes';
import { ProcessedBudgetItem } from '../hooks/useBudgetData';
import { TrackerHeader } from './tracker/TrackerHeader';
import { PLTrackerContent } from './tracker/PLTrackerContent';
import { useDateCalculations } from './hooks/useDateCalculations';
import { useTrackerData } from './hooks/useTrackerData';
import { calculateProRatedBudget, getActualAmount, calculateSummaryProRatedBudget } from './tracker/TrackerCalculations';

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
  
  const processedDataWithActuals = processedBudgetData.map(item => {
    const isRevenueItem = 
      item.name.toLowerCase().includes('turnover') || 
      item.name.toLowerCase().includes('revenue') ||
      item.name.toLowerCase().includes('sales');
      
    const isCOSItem = 
      item.name.toLowerCase().includes('cost of sales') ||
      item.name.toLowerCase().includes('cos');
      
    const isGrossProfitItem = 
      item.name.toLowerCase().includes('gross profit') ||
      item.isGrossProfit;
      
    const isOperatingProfitItem = 
      item.name.toLowerCase().includes('operating profit') ||
      item.isOperatingProfit;
      
    const isWagesItem = 
      item.name.toLowerCase().includes('wage') ||
      item.name.toLowerCase().includes('salary');
    
    // Add actual/budget debug log for each item
    console.log(`${item.name}: budget=${item.budget_amount}, actual=${item.actual_amount}`);
    
    // Initialize expense items with a calculated actual amount if not already set
    const isExpenseItem = !isRevenueItem && !isCOSItem && !isGrossProfitItem && 
                          !isOperatingProfitItem && !isWagesItem && !item.isHeader;
    
    // Return the item with appropriate actual amount setup
    return {
      ...item,
      actual_amount: item.actual_amount // Keep the actual_amount as is - will be calculated later if needed
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
    budget_amount: item.budget_amount
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
