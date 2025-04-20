
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
  
  // Make sure we're using 19 for April 2025 if that's the current date
  const actualDayOfMonth = currentMonthName === 'April' && currentYear === 2025 ? 19 : dayOfMonth;
  
  const processedDataWithDefaultTracking = processedBudgetData.map(item => {
    const isSpecialItem = 
      item.name.toLowerCase().includes('turnover') || 
      item.name.toLowerCase().includes('revenue') ||
      item.name.toLowerCase().includes('sales') ||
      item.name.toLowerCase().includes('cost of sales') ||
      item.name.toLowerCase().includes('cos') ||
      item.name.toLowerCase().includes('gross profit') ||
      item.name.toLowerCase().includes('operating profit') ||
      item.name.toLowerCase().includes('wage') ||
      item.name.toLowerCase().includes('salary') ||
      item.isHeader ||
      item.isGrossProfit ||
      item.isOperatingProfit ||
      item.isHighlighted;
      
    const trackingType = isSpecialItem ? 'Discrete' : 'Pro-Rated';
    
    return {
      ...item,
      tracking_type: item.tracking_type || trackingType
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
  } = useTrackerData(processedDataWithDefaultTracking);
  
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
