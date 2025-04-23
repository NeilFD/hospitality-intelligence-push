import React, { useState } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PLTrackerBudgetItem } from '../types/PLTrackerTypes';
import { formatCurrency } from '@/lib/date-utils';
import { TrackerSummaryRows } from '../TrackerSummaryRows';
import { calculateProRatedActual } from './TrackerCalculations';

interface PLTrackerContentProps {
  isLoading: boolean;
  filteredBudgetData: PLTrackerBudgetItem[];
  trackedBudgetData: PLTrackerBudgetItem[];
  dayOfMonth: number;
  daysInMonth: number;
  updateManualActualAmount: (index: number, value: string) => void;
  updateForecastAmount: (index: number, value: string) => void;
  updateDailyValues: (index: number, day: number, value: string) => void;
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
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [showDailyBreakdown, setShowDailyBreakdown] = useState(false);
  
  // Function to determine if an item should use pro-rated actuals
  const shouldUseProRatedActual = (item: PLTrackerBudgetItem): boolean => {
    const isExpenseItem = !item.name.toLowerCase().includes('turnover') &&
                        !item.name.toLowerCase().includes('revenue') &&
                        !item.name.toLowerCase().includes('sales') &&
                        !item.name.toLowerCase().includes('cost of sales') &&
                        !item.name.toLowerCase().includes('cos') &&
                        !item.name.toLowerCase().includes('gross profit') &&
                        !item.name.toLowerCase().includes('wages') &&
                        !item.name.toLowerCase().includes('salaries') &&
                        !item.isHeader &&
                        !item.isOperatingProfit &&
                        !item.isGrossProfit;
    
    // Check for specific expense item categories to apply pro-rating
    const isAdminExpense = item.category && [
      'Marketing',
      'Utilities',
      'Rent and Rates',
      'Equipment',
      'General Admin',
      'Maintenance',
      'Professional Fees',
      'IT and Communications',
      'Travel'
    ].some(category => item.category.includes(category));
    
    return isExpenseItem && isAdminExpense;
  };
  
  // Get the effective actual amount considering pro-rating for expense items
  const getEffectiveActualAmount = (item: PLTrackerBudgetItem): number => {
    if (shouldUseProRatedActual(item)) {
      return calculateProRatedActual(item, daysInMonth, dayOfMonth);
    }
    return getActualAmount(item);
  };

  if (isLoading) {
    return <div className="p-6 text-center">
      <p>Loading tracker data...</p>
    </div>;
  }
  
  const toggleDailyBreakdown = (index: number) => {
    setSelectedItem(selectedItem === index ? null : index);
    setShowDailyBreakdown(selectedItem !== index);
  };

  const renderDailyBreakdown = (item: PLTrackerBudgetItem, index: number) => {
    if (!item.daily_values) {
      return <p>No daily breakdown available for this item.</p>;
    }

    return (
      <div className="grid grid-cols-7 gap-2">
        {item.daily_values.map((day, dayIndex) => (
          <div key={dayIndex} className="text-center">
            <Badge variant="secondary" className="mb-1">{dayIndex + 1}</Badge>
            <Input
              type="number"
              value={day.value || ''}
              onChange={(e) => updateDailyValues(index, dayIndex, e.target.value)}
              className="h-8 text-center"
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-gray-50 sticky top-0 z-10">
          <TableRow>
            <TableHead className="w-[250px]">Line Item</TableHead>
            <TableHead className="text-right">Budget</TableHead>
            <TableHead className="text-right">Budget %</TableHead>
            <TableHead className="text-right">
              Pro-Rated Budget <span className="text-xs text-gray-500">({dayOfMonth}/{daysInMonth})</span>
            </TableHead>
            <TableHead className="text-right">
              Actual MTD <span className="text-xs text-gray-500">({dayOfMonth}/{daysInMonth})</span>
            </TableHead>
            <TableHead className="text-right">Forecast</TableHead>
            <TableHead className="text-right">Variance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredBudgetData.map((item, index) => {
            const proRatedBudget = calculateProRatedBudget(item);
            const actualAmount = getEffectiveActualAmount(item);
            const forecastAmount = parseFloat(item.forecast_amount?.toString() || "0");
            const forecastVariance = forecastAmount - item.budget_amount;
            
            const turnoverItem = trackedBudgetData.find(i => i.name === 'Turnover' || i.name === 'Total Revenue');
            const turnoverBudget = turnoverItem ? turnoverItem.budget_amount || 0 : 0;
            
            let budgetPercentage = 0;
            if (!item.isHeader && turnoverBudget > 0) {
              budgetPercentage = (item.budget_amount / turnoverBudget) * 100;
            }
            
            return (
              <TableRow 
                key={index}
                className={`${item.isHeader ? 'bg-gray-100 font-bold text-[#48495e]' : ''} ${
                  item.isHighlighted ? 'bg-purple-50/50' : ''
                } ${
                  item.isGrossProfit ? 'bg-green-50/50 font-medium' : ''
                } ${
                  item.isOperatingProfit ? 'bg-[#8B5CF6]/10 font-medium' : ''
                }`}
              >
                <TableCell className={`${item.isHeader ? 'pl-2' : 'pl-4'} ${selectedItem === index ? 'bg-blue-50' : ''}`}>
                  {item.isHeader ? item.name : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-normal justify-start hover:bg-transparent hover:underline w-full text-left"
                      onClick={() => setSelectedItem(selectedItem === index ? null : index)}
                    >
                      {item.name}
                    </Button>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {item.isHeader ? '' : formatCurrency(item.budget_amount || 0)}
                </TableCell>
                <TableCell className="text-right">
                  {item.isHeader ? '' : budgetPercentage.toFixed(1) + '%'}
                </TableCell>
                <TableCell className="text-right">
                  {item.isHeader ? '' : formatCurrency(proRatedBudget)}
                </TableCell>
                <TableCell className={`text-right ${selectedItem === index ? 'bg-blue-50' : ''}`}>
                  {item.isHeader ? '' : (
                    selectedItem === index ? (
                      <Input 
                        type="number"
                        value={item.manually_entered_actual || ''}
                        onChange={(e) => updateManualActualAmount(index, e.target.value)}
                        className="h-8 text-right w-24 inline-block"
                      />
                    ) : (
                      formatCurrency(actualAmount)
                    )
                  )}
                </TableCell>
                <TableCell className={`text-right ${selectedItem === index ? 'bg-blue-50' : ''}`}>
                  {item.isHeader ? '' : (
                    selectedItem === index ? (
                      <Input 
                        type="number"
                        value={item.forecast_amount || ''}
                        onChange={(e) => updateForecastAmount(index, e.target.value)}
                        className="h-8 text-right w-24 inline-block"
                      />
                    ) : (
                      formatCurrency(forecastAmount)
                    )
                  )}
                </TableCell>
                <TableCell className={`text-right ${
                  forecastVariance > 0 ? 'text-green-600' : forecastVariance < 0 ? 'text-red-600' : ''
                }`}>
                  {item.isHeader ? '' : formatCurrency(forecastVariance)}
                </TableCell>
              </TableRow>
            );
          })}
          
          <TrackerSummaryRows
            trackedBudgetData={trackedBudgetData}
            dayOfMonth={dayOfMonth}
            daysInMonth={daysInMonth}
            getActualAmount={getEffectiveActualAmount}
            calculateProRatedBudget={calculateProRatedBudget}
            updateForecastAmount={(index, value) => updateForecastAmount(index, value)}
          />
        </TableBody>
      </Table>
      
      {showDailyBreakdown && selectedItem !== null && (
        <div className="p-4 bg-gray-50 border-t">
          {renderDailyBreakdown(filteredBudgetData[selectedItem], selectedItem)}
        </div>
      )}
    </div>
  );
}
