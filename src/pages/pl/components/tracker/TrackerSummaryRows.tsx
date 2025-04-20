
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
  // Filter items that should be included in admin expenses - exclude revenue, COS, gross profit, etc.
  const adminItems = trackedBudgetData.filter(item => 
    !item.isHeader && 
    !item.name.toLowerCase().includes('turnover') &&
    !item.name.toLowerCase().includes('revenue') &&
    !item.name.toLowerCase().includes('sales') &&
    !item.name.toLowerCase().includes('cost of sales') &&
    !item.name.toLowerCase().includes('cos') &&
    !item.name.toLowerCase().includes('gross profit') &&
    !item.name.toLowerCase().includes('operating profit')
  );

  // Logging for debugging
  console.log('Admin items count for summary:', adminItems.length);
  
  // Calculate admin expenses - both pro-rated budget and actual amounts
  const adminTotalBudget = adminItems.reduce((sum, item) => sum + (item.budget_amount || 0), 0);
  
  const adminExpenses = adminItems.reduce((sum, item) => 
    sum + calculateProRatedBudget(item), 0);
    
  const adminActualAmount = adminItems.reduce((sum, item) => 
    sum + getActualAmount(item), 0);
    
  const adminVariance = adminActualAmount - adminExpenses;
  
  console.log(`Admin expenses: ${adminExpenses}, Admin actual: ${adminActualAmount}, Variance: ${adminVariance}`);
  console.log(`Admin total budget: ${adminTotalBudget}`);
  
  // Calculate admin forecast based on actual amounts so far - scale the actuals to full month
  let adminForecast = 0;
  if (adminActualAmount > 0 && dayOfMonth > 0) {
    // Project the actual admin expenses to the full month
    adminForecast = (adminActualAmount / dayOfMonth) * daysInMonth;
  } else {
    // Fallback to budget if no actuals
    adminForecast = adminTotalBudget;
  }

  console.log(`Admin forecast (projected from actuals): ${adminForecast}`);

  // Find Gross Profit item
  const grossProfitItem = trackedBudgetData.find(item => 
    (item.name.toLowerCase() === 'gross profit' || 
     item.name.toLowerCase() === 'gross profit/(loss)') &&
    item.isHighlighted);
    
  const grossProfitActual = grossProfitItem ? getActualAmount(grossProfitItem) : 0;
  const grossProfitBudget = grossProfitItem ? grossProfitItem.budget_amount || 0 : 0;
  const grossProfitProRated = grossProfitItem ? calculateProRatedBudget(grossProfitItem) : 0;
  
  // Find the gross profit forecast amount
  const grossProfitForecast = grossProfitItem && grossProfitItem.forecast_amount 
    ? grossProfitItem.forecast_amount 
    : (grossProfitActual > 0 && dayOfMonth > 0) 
      ? (grossProfitActual / dayOfMonth) * daysInMonth 
      : grossProfitBudget;
  
  console.log(`Gross profit item found: ${grossProfitItem?.name}, budget: ${grossProfitBudget}, actual: ${grossProfitActual}, forecast: ${grossProfitForecast}`);
  
  // Calculate Operating Profit
  const operatingProfitBudget = grossProfitBudget - adminTotalBudget;
  const operatingProfit = grossProfitProRated - adminExpenses;
  const actualOperatingProfit = grossProfitActual - adminActualAmount;
  
  // Calculate operating profit forecast - use the forecasted values
  const opForecast = grossProfitForecast - adminForecast;
  
  // Correctly calculate the variances - compare forecast to budget
  const adminBudgetVariance = adminForecast - adminTotalBudget;
  const opForecastVariance = opForecast - operatingProfitBudget;
  
  console.log(`Admin budget: ${adminTotalBudget}, Admin forecast: ${adminForecast}, Admin variance: ${adminBudgetVariance}`);
  console.log(`Operating profit budget: ${operatingProfitBudget}, Actual OP: ${actualOperatingProfit}, Forecast OP: ${opForecast}, OP variance: ${opForecastVariance}`);
  
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
          {formatCurrency(adminTotalBudget)}
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
          adminBudgetVariance < 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {formatCurrency(adminBudgetVariance)}
        </TableCell>
      </TableRow>
      
      {/* Operating Profit Row */}
      <TableRow className="bg-[#8B5CF6]/90 text-white">
        <TableCell className="font-bold">
          Operating profit
        </TableCell>
        <TableCell className="text-right font-bold">
          {formatCurrency(operatingProfitBudget)}
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
          opForecastVariance > 0 ? 'text-green-200' : 'text-red-300'
        }`}>
          {formatCurrency(opForecastVariance)}
        </TableCell>
      </TableRow>
    </>
  );
}
