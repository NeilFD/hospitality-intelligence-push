import React, { useState } from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { DailyInputDrawer } from './DailyInputDrawer';
import { PLTrackerBudgetItem, DayInput } from '../types/PLTrackerTypes';
import { formatCurrency } from '@/lib/date-utils';

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
                  Actual<br /><span className="text-xs">({dayOfMonth} days so far)</span>
                </TableHead>
                <TableHead className="text-right font-semibold text-slate-700">
                  Pro-Rated Budget<br /><span className="text-xs">(Day {dayOfMonth} of {daysInMonth})</span>
                </TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Variance</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Forecast</TableHead>
                <TableHead className="text-center font-semibold text-slate-700">Daily Input</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBudgetData.map((item, index) => {
                const itemIndex = trackedBudgetData.findIndex(i => i.id === item.id);
                const actualAmount = getActualAmount(item);
                const proRatedBudget = calculateProRatedBudget(item);
                const variance = actualAmount - proRatedBudget;
                
                if (item.isHeader) {
                  return (
                    <TableRow key={item.id} className="bg-gray-50 border-t border-gray-200">
                      <TableCell colSpan={7} className="py-2 font-bold text-slate-800">
                        {item.name}
                      </TableCell>
                    </TableRow>
                  );
                } else {
                  return (
                    <TableRow key={item.id} className="border-t border-gray-100">
                      <TableCell className="text-left text-slate-800">{item.name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.budget_amount)}</TableCell>
                      <TableCell className="text-right">
                        <Input 
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.manually_entered_actual !== undefined ? item.manually_entered_actual : ''}
                          onChange={(e) => updateManualActualAmount(itemIndex, e.target.value)}
                          className="w-24 ml-auto text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(proRatedBudget)}</TableCell>
                      <TableCell className={`text-right ${variance > 0 ? 'text-green-600' : variance < 0 ? 'text-red-600' : ''}`}>
                        {formatCurrency(variance)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Input 
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.forecast_amount !== undefined ? item.forecast_amount : ''}
                          onChange={(e) => updateForecastAmount(itemIndex, e.target.value)}
                          className="w-24 ml-auto text-right"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleOpenDailyInput(itemIndex)}
                          title="Open Daily Input"
                        >
                          <Calendar className="h-4 w-4 text-purple-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                }
              })}
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
