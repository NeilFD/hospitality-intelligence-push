
import React from 'react';
import { TableBody, Table, TableStickyHeader } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { PLTrackerBudgetItem } from '../types/PLTrackerTypes';
import { TrackerTableHeader } from './TrackerTableHeader';
import { TrackerLineItem } from './TrackerLineItem';
import { TrackerSummaryRows } from './TrackerSummaryRows';
import { calculateSummaryProRatedBudget } from './TrackerCalculations';

interface PLTrackerContentProps {
  isLoading: boolean;
  filteredBudgetData: PLTrackerBudgetItem[];
  trackedBudgetData: PLTrackerBudgetItem[];
  dayOfMonth: number;
  daysInMonth: number;
  updateManualActualAmount: (index: number, value: string) => void;
  updateForecastAmount: (index: number, value: string) => void;
  getActualAmount: (item: PLTrackerBudgetItem) => number;
  calculateProRatedBudget: (item: PLTrackerBudgetItem) => number;
}

export function PLTrackerContent({
  isLoading,
  filteredBudgetData,
  trackedBudgetData,
  dayOfMonth,
  daysInMonth,
  updateManualActualAmount,
  updateForecastAmount,
  getActualAmount,
  calculateProRatedBudget
}: PLTrackerContentProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (filteredBudgetData.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        <p>No budget data available.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto max-h-[calc(100vh-200px)]">
      <Table>
        <TableStickyHeader>
          <TrackerTableHeader />
        </TableStickyHeader>
        <TableBody>
          {filteredBudgetData.map((item, i) => {
            const proRatedBudget = calculateSummaryProRatedBudget(
              item, 
              daysInMonth, 
              dayOfMonth, 
              trackedBudgetData
            );
            const actualAmount = getActualAmount(item);
            const variance = actualAmount - proRatedBudget;
            
            return (
              <TrackerLineItem
                key={i}
                item={item}
                index={i}
                proRatedBudget={proRatedBudget}
                actualAmount={actualAmount}
                variance={variance}
                updateManualActualAmount={updateManualActualAmount}
                updateForecastAmount={updateForecastAmount}
              />
            );
          })}
          
          <TrackerSummaryRows
            trackedBudgetData={trackedBudgetData}
            dayOfMonth={dayOfMonth}
            daysInMonth={daysInMonth}
            getActualAmount={getActualAmount}
            calculateProRatedBudget={calculateProRatedBudget}
            updateForecastAmount={updateForecastAmount}
          />
        </TableBody>
      </Table>
    </div>
  );
}
