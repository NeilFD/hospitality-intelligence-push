
import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { formatCurrency } from '@/lib/date-utils';
import { PLTrackerBudgetItem } from '../types/PLTrackerTypes';

interface TrackerSummaryRowsProps {
  trackedBudgetData: PLTrackerBudgetItem[];
  dayOfMonth: number;
  daysInMonth: number;
  getActualAmount: (item: PLTrackerBudgetItem) => number;
  calculateProRatedBudget: (item: PLTrackerBudgetItem) => number;
  updateForecastAmount: (index: number, value: string) => void;
}

export function TrackerSummaryRows({
  trackedBudgetData,
  dayOfMonth,
  daysInMonth,
  getActualAmount,
  calculateProRatedBudget,
  updateForecastAmount
}: TrackerSummaryRowsProps) {
  // Admin Expenses Summary Row
  const adminExpenses = trackedBudgetData
    .filter(item => 
      !item.isHeader && 
      (item.name.toLowerCase().includes('wages') || 
      item.name.toLowerCase().includes('salary') || 
      item.name.toLowerCase().includes('admin') ||
      item.name.toLowerCase().includes('marketing') ||
      item.name.toLowerCase().includes('hotel'))
    )
    .reduce((sum, item) => sum + (
      calculateProRatedBudget(item)
    ), 0);
    
  const adminActualAmount = trackedBudgetData
    .filter(item => 
      !item.isHeader && 
      (item.name.toLowerCase().includes('wages') || 
      item.name.toLowerCase().includes('salary') || 
      item.name.toLowerCase().includes('admin') ||
      item.name.toLowerCase().includes('marketing') ||
      item.name.toLowerCase().includes('hotel'))
    )
    .reduce((sum, item) => sum + getActualAmount(item), 0);
    
  const adminVariance = adminActualAmount - adminExpenses;
  
  console.log(`Admin expenses: ${adminExpenses}, Admin actual: ${adminActualAmount}, Variance: ${adminVariance}`);
  
  // Calculate admin forecast
  const adminForecast = adminActualAmount > 0 && dayOfMonth > 0
    ? (adminActualAmount / dayOfMonth) * daysInMonth
    : adminExpenses;

  // Operating Profit Summary Row
  const grossProfitItem = trackedBudgetData.find(item => 
    item.isHighlighted && item.name.toLowerCase().includes('gross profit'));
    
  const grossProfitActual = grossProfitItem ? getActualAmount(grossProfitItem) : 0;
  
  console.log(`Gross profit item: ${grossProfitItem?.name}, actual: ${grossProfitActual}`);
  
  const operatingProfit = grossProfitItem ? 
    calculateProRatedBudget(grossProfitItem) - adminExpenses : 0;
  
  const actualOperatingProfit = grossProfitActual - adminActualAmount;
  const opVariance = actualOperatingProfit - operatingProfit;
  
  console.log(`Gross profit actual: ${grossProfitActual}, Operating profit: ${operatingProfit}, Actual OP: ${actualOperatingProfit}`);
  
  // Calculate operating profit forecast
  const opForecast = actualOperatingProfit > 0 && dayOfMonth > 0
    ? (actualOperatingProfit / dayOfMonth) * daysInMonth
    : operatingProfit;
    
  // Update forecast value for operating profit in state
  React.useEffect(() => {
    const opIndex = trackedBudgetData.findIndex(i => 
      i.name.toLowerCase().includes('operating profit') && i.isHighlighted);
    
    if (opIndex >= 0 && !isNaN(opForecast)) {
      console.log(`Setting OP forecast: ${opForecast}`);
      updateForecastAmount(opIndex, opForecast.toString());
    }
  }, [opForecast, trackedBudgetData, updateForecastAmount]);

  return (
    <>
      {/* Admin Expenses Row */}
      <TableRow className="bg-purple-100/50 text-[#48495e]">
        <TableCell className="font-bold">
          ADMIN EXPENSES
        </TableCell>
        <TableCell className="text-right font-bold">
          {formatCurrency(adminExpenses * daysInMonth / dayOfMonth)}
        </TableCell>
        <TableCell className="text-right">
          {/* Percentage can be added here if needed */}
        </TableCell>
        <TableCell className="text-right font-bold">
          {formatCurrency(adminExpenses)}
        </TableCell>
        <TableCell className="text-right font-bold">
          {formatCurrency(adminActualAmount)}
        </TableCell>
        <TableCell className="text-right font-bold">
          {formatCurrency(adminForecast)}
        </TableCell>
        <TableCell className={`text-right font-bold ${
          adminVariance > 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {formatCurrency(adminVariance)}
        </TableCell>
      </TableRow>
      
      {/* Operating Profit Row */}
      <TableRow className="bg-[#8B5CF6]/90 text-white">
        <TableCell className="font-bold">
          Operating profit
        </TableCell>
        <TableCell className="text-right font-bold">
          {formatCurrency(operatingProfit * daysInMonth / dayOfMonth)}
        </TableCell>
        <TableCell className="text-right">
          {/* Percentage can be added here if needed */}
        </TableCell>
        <TableCell className="text-right font-bold">
          {formatCurrency(operatingProfit)}
        </TableCell>
        <TableCell className="text-right font-bold">
          {formatCurrency(actualOperatingProfit)}
        </TableCell>
        <TableCell className="text-right font-bold">
          {formatCurrency(opForecast)}
        </TableCell>
        <TableCell className={`text-right font-bold ${
          opVariance > 0 ? 'text-green-200' : 'text-red-300'
        }`}>
          {formatCurrency(opVariance)}
        </TableCell>
      </TableRow>
    </>
  );
}
