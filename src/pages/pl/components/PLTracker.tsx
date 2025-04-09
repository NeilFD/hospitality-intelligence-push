
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { PLTrackerBudgetItem } from './types/PLTrackerTypes';
import { ProcessedBudgetItem } from '../hooks/useBudgetData';
import { TrackerHeader } from './tracker/TrackerHeader';
import { PLTrackerContent } from './tracker/PLTrackerContent';
import { useDateCalculations } from './hooks/useDateCalculations';
import { useTrackerData } from './hooks/useTrackerData';
import { PLTrackerSettings } from './PLTrackerSettings';
import { calculateProRatedBudget, getActualAmount as getBaseActualAmount } from './tracker/TrackerCalculations';

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
  const [showSettings, setShowSettings] = useState(false);
  const { yesterdayDate, daysInMonth, dayOfMonth } = useDateCalculations(currentMonthName, currentYear);
  
  // Convert ProcessedBudgetItem to PLTrackerBudgetItem to ensure tracking_type is defined
  const processedDataWithTrackingType = processedBudgetData.map(item => ({
    ...item,
    tracking_type: item.tracking_type || 'Discrete' // Default to Discrete if not defined
  })) as PLTrackerBudgetItem[];
  
  const {
    trackedBudgetData,
    setTrackedBudgetData,
    hasUnsavedChanges,
    isSaving,
    updateForecastAmount,
    updateManualActualAmount,
    updateDailyValues,
    saveForecastAmounts
  } = useTrackerData(processedDataWithTrackingType);
  
  // Filter out header items with null budget values
  const filteredBudgetData = trackedBudgetData.filter(item => 
    !(item.isHeader && item.budget_amount === 0)
  );
  
  const getActualAmount = (item: PLTrackerBudgetItem) => {
    // First check if it's a Pro-Rated item, if so return the pro-rated budget value
    if (item.tracking_type === 'Pro-Rated') {
      return calculateProRatedBudget(item, daysInMonth, dayOfMonth);
    }
    
    // For revenue, COS, and other special items, check if preloaded actual_amount exists
    if (item.name.toLowerCase().includes('food revenue') || 
        item.name.toLowerCase().includes('food sales') ||
        item.name.toLowerCase().includes('beverage revenue') || 
        item.name.toLowerCase().includes('beverage sales') || 
        item.name.toLowerCase().includes('drink sales') ||
        item.name.toLowerCase().includes('drinks revenue') ||
        item.name.toLowerCase() === 'turnover' || 
        item.name.toLowerCase().includes('total revenue') ||
        item.name.toLowerCase().includes('food cost of sales') ||
        item.name.toLowerCase().includes('food cos') ||
        item.name.toLowerCase().includes('beverage cost of sales') ||
        item.name.toLowerCase().includes('beverage cos') ||
        item.name.toLowerCase().includes('drinks cost of sales') ||
        item.name.toLowerCase().includes('drinks cos') ||
        item.name.toLowerCase().includes('food gross profit') ||
        item.name.toLowerCase().includes('beverage gross profit') || 
        item.name.toLowerCase().includes('drinks gross profit') ||
        item.name.toLowerCase() === 'gross profit' || 
        item.name.toLowerCase() === 'gross profit/(loss)' ||
        item.name.toLowerCase().includes('wages and salaries') ||
        item.name.toLowerCase() === 'wages' ||
        item.name.toLowerCase() === 'salaries') {
      return item.actual_amount || 0;
    }
    
    // For Discrete items, use either manual entry or daily values
    if (item.tracking_type === 'Discrete') {
      if (item.manually_entered_actual !== undefined) {
        return item.manually_entered_actual;
      }
      
      if (item.daily_values && item.daily_values.length > 0) {
        return item.daily_values.reduce((sum, day) => sum + (day.value || 0), 0);
      }
      
      return 0; // No values found
    }
    
    // Default fallback
    return item.actual_amount || 0;
  };
  
  const handleOpenSettings = () => {
    setShowSettings(true);
  };
  
  const handleSettingsSaved = (updatedItems: PLTrackerBudgetItem[]) => {
    setTrackedBudgetData(updatedItems);
    setShowSettings(false);
  };

  return (
    <Card className="shadow-md rounded-xl overflow-hidden">
      {showSettings ? (
        <PLTrackerSettings
          isLoading={isLoading}
          processedBudgetData={processedBudgetData}
          currentMonthName={currentMonthName}
          currentYear={currentYear}
          onBackToTracker={() => setShowSettings(false)}
          onSettingsSaved={handleSettingsSaved}
        />
      ) : (
        <>
          <TrackerHeader
            currentMonthName={currentMonthName}
            currentYear={currentYear}
            yesterdayDate={yesterdayDate}
            dayOfMonth={dayOfMonth}
            daysInMonth={daysInMonth}
            hasUnsavedChanges={hasUnsavedChanges}
            isSaving={isSaving}
            onOpenSettings={handleOpenSettings}
            onSaveChanges={saveForecastAmounts}
            onClose={onClose}
          />
          
          <PLTrackerContent
            isLoading={isLoading}
            filteredBudgetData={filteredBudgetData}
            trackedBudgetData={trackedBudgetData}
            dayOfMonth={dayOfMonth}
            daysInMonth={daysInMonth}
            updateManualActualAmount={updateManualActualAmount}
            updateForecastAmount={updateForecastAmount}
            updateDailyValues={updateDailyValues}
            getActualAmount={getActualAmount}
            calculateProRatedBudget={(item) => calculateProRatedBudget(item, daysInMonth, dayOfMonth)}
            currentMonthName={currentMonthName}
            currentYear={currentYear}
          />
        </>
      )}
    </Card>
  );
}
