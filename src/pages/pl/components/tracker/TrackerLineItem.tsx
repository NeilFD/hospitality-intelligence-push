
import React, { useState, useEffect } from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { formatCurrency } from '@/lib/date-utils';
import { PLTrackerBudgetItem, DayInput } from '../types/PLTrackerTypes';
import { DailyInputDrawer } from './DailyInputDrawer';

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
  dayOfMonth: number;
  daysInMonth: number;
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
  currentYear,
  dayOfMonth,
  daysInMonth
}: TrackerLineItemProps) {
  const [isDailyInputOpen, setIsDailyInputOpen] = useState(false);
  
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
               
  const isWagesItem = item.name.toLowerCase().includes('wages and salaries') ||
                 item.name.toLowerCase() === 'wages' ||
                 item.name.toLowerCase() === 'salaries';
                 
  const isTotalItem = item.name.toLowerCase().includes('total');
  
  const isAdminExpense = !isRevenue && !isCOS && !isGrossProfit && !isOperatingProfit && 
                        !isWagesItem && !item.isHeader && !isTotalItem;
                 
  const isHighlightedItem = item.isHighlighted;
  
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
  
  if (isOperatingProfit && !item.isHighlighted) {
    return null;
  }

  const handleCloseDailyInput = () => {
    setIsDailyInputOpen(false);
  };

  let percentageDisplay = '';
  if (isGrossProfit && item.name.toLowerCase().includes('food')) {
    const foodRevenue = actualAmount > 0 && typeof actualAmount === 'number' ? 
      ((actualAmount / (item.actual_amount || 1)) * 100).toFixed(2) : '0.00';
    percentageDisplay = `${foodRevenue}%`;
  } else if (isGrossProfit && (item.name.toLowerCase().includes('beverage') || item.name.toLowerCase().includes('drink'))) {
    const beverageRevenue = actualAmount > 0 && typeof actualAmount === 'number' ? 
      ((actualAmount / (item.actual_amount || 1)) * 100).toFixed(2) : '0.00';
    percentageDisplay = `${beverageRevenue}%`;
  } else if (item.budget_percentage !== undefined) {
    percentageDisplay = `${(item.budget_percentage * 100).toFixed(2)}%`;
  }

  // Calculate forecast amount - improved to always have a value
  let forecastAmount = item.forecast_amount || 0;
  
  if (forecastAmount === 0 && actualAmount > 0 && dayOfMonth > 0) {
    // If no forecast amount is set but we have actuals, calculate a projection
    forecastAmount = (actualAmount / dayOfMonth) * daysInMonth;
  } else if (forecastAmount === 0) {
    // Default to budget amount if no forecast or actuals
    forecastAmount = item.budget_amount || 0;
  }
    
  useEffect(() => {
    if (!isNaN(forecastAmount) && index >= 0) {
      console.log(`Setting forecast for ${item.name}: ${forecastAmount}`);
      updateForecastAmount(index, forecastAmount.toString());
    }
  }, [forecastAmount, index, updateForecastAmount, item.name]);

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
        {formatCurrency(actualAmount)}
      </TableCell>
      <TableCell className={`text-right ${fontClass}`}>
        {formatCurrency(forecastAmount)}
      </TableCell>
      <TableCell className={`text-right ${fontClass} ${
        variance > 0 ? 'text-green-600' : variance < 0 ? 'text-red-600' : ''
      }`}>
        {formatCurrency(variance)}
      </TableCell>

      {isDailyInputOpen && (
        <DailyInputDrawer
          isOpen={isDailyInputOpen}
          onClose={handleCloseDailyInput}
          onSave={(dailyValues) => {
            updateDailyValues(index, dailyValues);
            setIsDailyInputOpen(false);
          }}
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
