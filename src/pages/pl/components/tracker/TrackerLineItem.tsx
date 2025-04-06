
import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/date-utils';
import { PLTrackerBudgetItem } from '../types/PLTrackerTypes';

interface TrackerLineItemProps {
  item: PLTrackerBudgetItem;
  index: number;
  proRatedBudget: number;
  actualAmount: number;
  variance: number;
  updateManualActualAmount: (index: number, value: string) => void;
  updateForecastAmount: (index: number, value: string) => void;
}

export function TrackerLineItem({
  item,
  index,
  proRatedBudget,
  actualAmount,
  variance,
  updateManualActualAmount,
  updateForecastAmount
}: TrackerLineItemProps) {
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
               !item.name.toLowerCase().includes('beverage gross profit')) ? 'font-bold' : '';
  
  if (isOperatingProfit && !item.isHighlighted) {
    return null;
  }
  
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
        {item.tracking_type === 'Discrete' ? (
          <Input
            type="number"
            min="0"
            step="0.01"
            value={item.manually_entered_actual !== undefined ? item.manually_entered_actual : ''}
            onChange={(e) => updateManualActualAmount(index, e.target.value)}
            className="h-8 w-24 text-right ml-auto"
          />
        ) : (
          formatCurrency(actualAmount)
        )}
      </TableCell>
      <TableCell className="text-right">
        <Input
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
    </TableRow>
  );
}
