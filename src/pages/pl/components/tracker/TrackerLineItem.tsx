
import React, { useState } from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { formatCurrency } from '@/lib/date-utils';
import { PLTrackerBudgetItem, DayInput } from '../types/PLTrackerTypes';
import { DailyInputDrawer } from './DailyInputDrawer';
import { CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchDailyValues } from '@/services/budget-service';

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
  
  let rowClassName = '';
  let fontClass = '';
  
  if (item.isHighlighted && !item.name.toLowerCase().includes('total admin')) {
    rowClassName = 'bg-[#48495e]/90 text-white font-bold';
  } else if ((isGrossProfit && !item.name.toLowerCase().includes('food gross profit') && !item.name.toLowerCase().includes('beverage gross profit')) || isTurnover) {
    rowClassName = 'font-semibold bg-purple-50/50';
  }
  
  fontClass = item.isHighlighted || 
              item.name.toLowerCase().includes('total admin') || 
              isTurnover || 
              item.name.toLowerCase().includes('cost of sales') || 
              (isGrossProfit && !item.name.toLowerCase().includes('food gross profit') && 
               !item.name.toLowerCase().includes('beverage profit')) ? 'font-bold' : '';
  
  if (isOperatingProfit && !item.isHighlighted) {
    return null;
  }
  
  const handleOpenDailyInput = (e: React.MouseEvent) => {
    // Stop the event from propagating to prevent drawer issues
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

  return (
    <TableRow className={rowClassName}>
      <TableCell className={fontClass}>
        {item.name}
      </TableCell>
      <TableCell className={`text-right ${fontClass}`}>
        {formatCurrency(item.budget_amount)}
      </TableCell>
      <TableCell className="text-right">
        {item.budget_percentage !== undefined ? `${(item.budget_percentage * 100).toFixed(2)}%` : ''}
      </TableCell>
      <TableCell className={`text-right ${fontClass}`}>
        {formatCurrency(proRatedBudget)}
      </TableCell>
      <TableCell className={`text-right ${fontClass}`}>
        <div className="flex items-center justify-end gap-2">
          <Button 
            variant="outline"
            size="icon"
            onClick={handleOpenDailyInput}
            className="h-9 w-9 rounded-full border border-purple-500 bg-purple-50 text-purple-700 hover:bg-purple-100"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <CalendarDays className="h-5 w-5" />
          </Button>
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
          className="h-8 w-24 text-right ml-auto"
        />
      </TableCell>
      <TableCell className={`text-right ${fontClass} ${
        variance > 0 ? 'text-green-600' : variance < 0 ? 'text-red-600' : ''
      }`}>
        {formatCurrency(variance)}
      </TableCell>
      
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
    </TableRow>
  );
}
