
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { PLTrackerBudgetItem } from './types/PLTrackerTypes';
import { ProcessedBudgetItem } from '../hooks/useBudgetData';
import { TrackerHeader } from './tracker/TrackerHeader';
import { PLTrackerContent } from './tracker/PLTrackerContent';
import { useDateCalculations } from './hooks/useDateCalculations';
import { useTrackerData } from './hooks/useTrackerData';
import { PLTrackerSettings } from './PLTrackerSettings';

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
  // The processedBudgetData now already includes the actual revenue, COS and wages values
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
    // First priority: Check if it's a revenue or COS or wages item that should get data from other trackers
    if (item.name.toLowerCase().includes('food revenue') || 
        item.name.toLowerCase().includes('food sales')) {
      // Use the actual amount from master records for food revenue
      return item.actual_amount || 0;
    }
    
    if (item.name.toLowerCase().includes('beverage revenue') || 
        item.name.toLowerCase().includes('beverage sales') || 
        item.name.toLowerCase().includes('drink sales') ||
        item.name.toLowerCase().includes('drinks revenue')) {
      // Use the actual amount from master records for beverage revenue
      return item.actual_amount || 0;
    }
    
    if (item.name.toLowerCase() === 'turnover' || 
        item.name.toLowerCase().includes('total revenue')) {
      // Use the actual amount from master records for total revenue
      return item.actual_amount || 0;
    }
    
    // For food and beverage COS
    if (item.name.toLowerCase().includes('food cost of sales') ||
        item.name.toLowerCase().includes('food cos') ||
        (item.name.toLowerCase().includes('food') && 
         item.category.toLowerCase().includes('cost of sales'))) {
      return item.actual_amount || 0;
    }
    
    if (item.name.toLowerCase().includes('beverage cost of sales') ||
        item.name.toLowerCase().includes('beverage cos') ||
        item.name.toLowerCase().includes('drinks cost of sales') ||
        item.name.toLowerCase().includes('drinks cos') ||
        ((item.name.toLowerCase().includes('beverage') || 
          item.name.toLowerCase().includes('drink')) &&
         item.category.toLowerCase().includes('cost of sales'))) {
      return item.actual_amount || 0;
    }
    
    if ((item.name.toLowerCase() === 'cost of sales' || 
         item.name.toLowerCase() === 'cos') && 
        !item.name.toLowerCase().includes('food') &&
        !item.name.toLowerCase().includes('beverage') &&
        !item.name.toLowerCase().includes('drink')) {
      return item.actual_amount || 0;
    }
    
    // For wages
    if (item.name.toLowerCase().includes('wages and salaries') ||
        item.name.toLowerCase() === 'wages' ||
        item.name.toLowerCase() === 'salaries') {
      return item.actual_amount || 0;
    }
    
    // For other items, use manual entry or tracking type logic
    if (item.manually_entered_actual !== undefined) {
      return item.manually_entered_actual;
    }
    
    if (item.tracking_type === 'Pro-Rated') {
      return calculateProRatedBudget(item);
    }
    
    return item.actual_amount || 0;
  };
  
  const calculateProRatedBudget = (item: PLTrackerBudgetItem) => {
    const budgetPerDay = item.budget_amount / daysInMonth;
    return budgetPerDay * dayOfMonth;
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
            calculateProRatedBudget={calculateProRatedBudget}
            currentMonthName={currentMonthName}
            currentYear={currentYear}
          />
        </>
      )}
    </Card>
  );
}
