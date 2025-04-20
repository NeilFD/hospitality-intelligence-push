
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { PLTrackerBudgetItem } from './types/PLTrackerTypes';
import { ProcessedBudgetItem } from '../hooks/useBudgetData';
import { TrackerHeader } from './tracker/TrackerHeader';
import { PLTrackerContent } from './tracker/PLTrackerContent';
import { useDateCalculations } from './hooks/useDateCalculations';
import { useTrackerData } from './hooks/useTrackerData';
import { PLTrackerSettings } from './PLTrackerSettings';
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
  
  // Ensure all items have a valid tracking_type
  const enhancedTrackedBudgetData = trackedBudgetData.map(item => ({
    ...item,
    tracking_type: item.tracking_type || 'Discrete' // Default to Discrete if not defined
  }));
  
  // Filter out header items with null budget values
  const filteredBudgetData = enhancedTrackedBudgetData.filter(item => 
    !(item.isHeader && item.budget_amount === 0)
  );
  
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
            trackedBudgetData={enhancedTrackedBudgetData}
            dayOfMonth={dayOfMonth}
            daysInMonth={daysInMonth}
            updateManualActualAmount={updateManualActualAmount}
            updateForecastAmount={updateForecastAmount}
            updateDailyValues={updateDailyValues}
            getActualAmount={getActualAmount}
            calculateProRatedBudget={(item) => {
              // For summary items, use calculateSummaryProRatedBudget
              if (item.isGrossProfit || item.isOperatingProfit || 
                  item.name.toLowerCase().includes('total') ||
                  item.name.toLowerCase() === 'turnover') {
                return calculateSummaryProRatedBudget(item, daysInMonth, dayOfMonth, enhancedTrackedBudgetData);
              }
              // For regular items, use the standard calculation
              return calculateProRatedBudget(item, daysInMonth, dayOfMonth);
            }}
            currentMonthName={currentMonthName}
            currentYear={currentYear}
          />
        </>
      )}
    </Card>
  );
}
