import React, { useState } from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { DailyInputDrawer } from './DailyInputDrawer';
import { PLTrackerBudgetItem, DayInput } from '../types/PLTrackerTypes';
import { formatCurrency } from '@/lib/date-utils';
import { TrackerSummaryRows } from './TrackerSummaryRows';
import { TrackerLineItem } from './TrackerLineItem';

interface PLTrackerContentProps {
  isLoading: boolean;
  filteredBudgetData: PLTrackerBudgetItem[];
  trackedBudgetData: PLTrackerBudgetItem[];
  dayOfMonth: number;
  daysInMonth: number;
  updateManualActualAmount: (index: number, value: string) => void;
  updateForecastAmount: (index: number, value: string) => void;
  updateDailyValues: (index: number, dailyValues: DayInput[]) => void;
  getActualAmount: (item: PLTrackerBudgetItem) => number;
  calculateProRatedBudget: (item: PLTrackerBudgetItem) => number;
  currentMonthName: string;
  currentYear: number;
}

export function PLTrackerContent({
  isLoading,
  filteredBudgetData,
  trackedBudgetData,
  dayOfMonth,
  daysInMonth,
  updateManualActualAmount,
  updateForecastAmount,
  updateDailyValues,
  getActualAmount,
  calculateProRatedBudget,
  currentMonthName,
  currentYear
}: PLTrackerContentProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);

  const handleOpenDailyInput = (index: number) => {
    setSelectedItemIndex(index);
    setDrawerOpen(true);
  };

  const handleCloseDailyInput = () => {
    setDrawerOpen(false);
    setSelectedItemIndex(null);
  };

  const handleSaveDailyValues = (dailyValues: DayInput[]) => {
    if (selectedItemIndex !== null) {
      updateDailyValues(selectedItemIndex, dailyValues);
    }
  };
  
  // Helper function to check if an item is a revenue or COS item
  const isRevenueItem = (item: PLTrackerBudgetItem) => {
    return item.name.toLowerCase().includes('revenue') ||
           item.name.toLowerCase().includes('sales') ||
           item.name.toLowerCase() === 'turnover';
  };

  const isCOSItem = (item: PLTrackerBudgetItem) => {
    return item.name.toLowerCase().includes('cost of sales') ||
           item.name.toLowerCase().includes('cos');
  };

  const isWagesItem = (item: PLTrackerBudgetItem) => {
    return item.name.toLowerCase().includes('wages and salaries') ||
           item.name.toLowerCase() === 'wages' ||
           item.name.toLowerCase() === 'salaries';
  };

  const isGrossProfitItem = (item: PLTrackerBudgetItem) => {
    return item.name.toLowerCase().includes('gross profit');
  };

  return (
    <>
      <div className="p-4 overflow-x-auto">
        {isLoading ? (
          <div className="py-10 text-center text-muted-foreground">Loading budget data...</div>
        ) : (
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow className="border-b border-purple-200">
                <TableHead className="text-left font-bold text-slate-800">Line Item</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Budget</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">
                  %
                </TableHead>
                <TableHead className="text-right font-semibold text-slate-700">
                  Pro-Rated Budget<br /><span className="text-xs">(Day {dayOfMonth} of {daysInMonth})</span>
                </TableHead>
                <TableHead className="text-right font-semibold text-slate-700">
                  Actual<br /><span className="text-xs">({dayOfMonth} days so far)</span>
                </TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Forecast</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Variance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBudgetData.map((item, index) => {
                const itemIndex = trackedBudgetData.findIndex(i => i.id === item.id);
                const proRatedBudget = calculateProRatedBudget(item);
                
                // Make sure we're getting the actual amount correctly for all item types
                // For pro-rated items, this will be the pro-rated calculation
                const actualAmount = getActualAmount(item);
                const variance = actualAmount - proRatedBudget;
                
                return (
                  <TrackerLineItem
                    key={item.id || index}
                    item={item}
                    index={itemIndex}
                    proRatedBudget={proRatedBudget}
                    actualAmount={actualAmount}
                    variance={variance}
                    updateManualActualAmount={updateManualActualAmount}
                    updateForecastAmount={updateForecastAmount}
                    updateDailyValues={updateDailyValues}
                    currentMonthName={currentMonthName}
                    currentYear={currentYear}
                    dayOfMonth={dayOfMonth}
                    daysInMonth={daysInMonth}
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
        )}
      </div>

      {/* Daily Input Drawer */}
      {selectedItemIndex !== null && (
        <DailyInputDrawer 
          isOpen={drawerOpen}
          onClose={handleCloseDailyInput}
          onSave={handleSaveDailyValues}
          initialValues={trackedBudgetData[selectedItemIndex]?.daily_values || []}
          itemName={trackedBudgetData[selectedItemIndex]?.name || ''}
          monthName={currentMonthName}
          year={currentYear}
          budgetItemId={trackedBudgetData[selectedItemIndex]?.id}
        />
      )}
    </>
  );
}
