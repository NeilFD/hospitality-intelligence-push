
import React, { useState } from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { formatCurrency } from '@/lib/date-utils';
import { PLTrackerBudgetItem, DayInput } from '../types/PLTrackerTypes';
import { DailyInputDrawer } from './DailyInputDrawer';
import { CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TrackerLineItemProps {
  item: PLTrackerBudgetItem;
  index: number;
  proRatedBudget: number;
  actualAmount: number;
  variance: number;
  updateManualActualAmount: (index: number, value: string) => void;
  updateForecastAmount: (index: number, value: string) => void;
  updateDailyValues: (index: number, dailyValues: DayInput[]) => void;
  currentMonthName: string;
  currentYear: number;
}

export function TrackerLineItem({
  item,
  index,
  proRatedBudget,
  actualAmount,
  variance,
  updateManualActualAmount,
  updateForecastAmount,
  updateDailyValues,
  currentMonthName,
  currentYear
}: TrackerLineItemProps) {
  const [isDailyInputOpen, setIsDailyInputOpen] = useState(false);
  
  // Handle header items
  if (item.isHeader) {
    return (
      <TableRow className='bg-[#48495e]/90 text-white'>
        <TableCell 
          colSpan={7} 
          className="font-bold text-sm tracking-wider py-2"
        >
          {item.name}
        </TableCell>
      </TableRow>
    );
  }
  
  // Define item types for styling and display logic
  const isGrossProfit = item.isGrossProfit || 
                      item.name.toLowerCase().includes('gross profit') || 
                      item.name.toLowerCase().includes('profit/(loss)');
  
  const isOperatingProfit = item.isOperatingProfit || 
                          item.name.toLowerCase().includes('operating profit');
  
  const isTurnover = item.name.toLowerCase().includes('turnover') || 
                    item.name.toLowerCase() === 'turnover';
                    
  const isRevenue = item.name.toLowerCase().includes('revenue') || 
                   item.name.toLowerCase().includes('sales') ||
                   isTurnover;
                   
  const isCOS = item.name.toLowerCase().includes('cost of sales') || 
               item.name.toLowerCase().includes('cos');
               
  const isWages = item.name.toLowerCase().includes('wages and salaries') ||
                 item.name.toLowerCase() === 'wages' ||
                 item.name.toLowerCase() === 'salaries';
                 
  const isTotalItem = item.name.toLowerCase().includes('total');
                 
  const isHighlightedItem = item.isHighlighted;
  
  // Determine styling
  let rowClassName = '';
  let fontClass = '';
  
  if (item.isHighlighted && !item.name.toLowerCase().includes('total admin')) {
    rowClassName = 'bg-[#48495e]/90 text-white font-bold';
  } else if ((isGrossProfit) || isTurnover) {
    rowClassName = 'font-semibold bg-purple-50/50';
  }
  
  fontClass = item.isHighlighted || 
              item.name.toLowerCase().includes('total admin') || 
              item.name.toLowerCase().includes('turnover') || 
              item.name.toLowerCase().includes('cost of sales') || 
              isGrossProfit ? 'font-bold' : '';
  
  // Skip operating profit items that aren't highlighted
  if (isOperatingProfit && !item.isHighlighted) {
    return null;
  }
  
  // Handle daily input functionality
  const handleOpenDailyInput = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDailyInputOpen(true);
  };
  
  const handleCloseDailyInput = () => {
    setIsDailyInputOpen(false);
  };
  
  const handleSaveDailyValues = (dailyValues: DayInput[]) => {
    updateDailyValues(index, dailyValues);
    handleCloseDailyInput();
  };

  // Calculate percentage for gross profit items
  let percentageDisplay = '';
  if (isGrossProfit && item.name.toLowerCase().includes('food')) {
    // Get the food sales item
    const foodRevenue = actualAmount > 0 && typeof actualAmount === 'number' ? 
      ((actualAmount / (item.actual_amount || 1)) * 100).toFixed(2) : '0.00';
    percentageDisplay = `${foodRevenue}%`;
  } else if (isGrossProfit && (item.name.toLowerCase().includes('beverage') || item.name.toLowerCase().includes('drink'))) {
    // Get the beverage sales item
    const beverageRevenue = actualAmount > 0 && typeof actualAmount === 'number' ? 
      ((actualAmount / (item.actual_amount || 1)) * 100).toFixed(2) : '0.00';
    percentageDisplay = `${beverageRevenue}%`;
  } else if (item.budget_percentage !== undefined) {
    percentageDisplay = `${(item.budget_percentage * 100).toFixed(2)}%`;
  }

  // Determine if this is a regular cost item (not revenue or special item)
  const isCostItem = !isRevenue && 
                   !isTurnover && 
                   !item.isHeader && 
                   !isGrossProfit && 
                   !isOperatingProfit && 
                   !isHighlightedItem && 
                   !isTotalItem && 
                   !isWages && 
                   !isCOS;

  // Show calendar ONLY for DISCRETE cost items
  const showCalendarIcon = isCostItem && item.tracking_type === 'Discrete';

  return (
    <TableRow className={rowClassName}>
      <TableCell className={fontClass}>
        {item.name}
      </TableCell>
      <TableCell className={`text-right ${fontClass}`}>
        {formatCurrency(item.budget_amount)}
      </TableCell>
      <TableCell className="text-right">
        {percentageDisplay}
      </TableCell>
      <TableCell className={`text-right ${fontClass}`}>
        {formatCurrency(proRatedBudget)}
      </TableCell>
      
      <TableCell className={`text-right ${fontClass}`}>
        <div className="flex items-center justify-end gap-2">
          {showCalendarIcon && (
            <Button 
              variant="outline"
              size="icon"
              onClick={handleOpenDailyInput}
              className="h-9 w-9 rounded-full border border-purple-500 bg-purple-50 text-purple-700 hover:bg-purple-100 pointer-events-auto z-10"
              type="button"
              tabIndex={0}
            >
              <CalendarDays className="h-5 w-5" />
            </Button>
          )}
          <span className="text-right">
            {formatCurrency(actualAmount)}
          </span>
        </div>
      </TableCell>
      
      <TableCell className="text-right">
        <input
          type="number"
          min="0"
          step="0.01"
          value={item.forecast_amount !== undefined ? item.forecast_amount : ''}
          onChange={(e) => updateForecastAmount(index, e.target.value)}
          className="h-8 w-24 text-right ml-auto pointer-events-auto"
          onClick={e => e.stopPropagation()}
        />
      </TableCell>
      <TableCell className={`text-right ${fontClass} ${
        variance > 0 ? 'text-green-600' : variance < 0 ? 'text-red-600' : ''
      }`}>
        {formatCurrency(variance)}
      </TableCell>
      
      {isDailyInputOpen && showCalendarIcon && (
        <DailyInputDrawer
          isOpen={isDailyInputOpen}
          onClose={handleCloseDailyInput}
          onSave={handleSaveDailyValues}
          initialValues={item.daily_values || []}
          itemName={item.name}
          monthName={currentMonthName}
          year={currentYear}
          budgetItemId={item.id}
        />
      )}
    </TableRow>
  );
}
