import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { formatCurrency } from '@/lib/date-utils';
import { PLTrackerBudgetItem } from './types/PLTrackerTypes';

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
  
  // Calculate the variance between forecast and budget for admin expenses
  const adminBudgetVariance = adminForecast - adminTotalBudget;

  // Find Turnover item for percentage calculations
  const turnoverItem = trackedBudgetData.find(item => 
    item.name.toLowerCase() === 'turnover' || 
    item.name.toLowerCase() === 'total revenue'
  );
  
  // Log turnover item for debugging
  console.log('Turnover item found:', turnoverItem);
  
  const turnoverActual = turnoverItem ? getActualAmount(turnoverItem) : 0;
  const turnoverBudget = turnoverItem ? turnoverItem.budget_amount || 0 : 0;
  
  // IMPORTANT FIX: Direct access to forecast_amount and ensure it's used
  const turnoverForecast = turnoverItem?.forecast_amount || 0;
  console.log(`Direct turnover forecast from item: ${turnoverForecast}`);
  
  // Make sure we have a valid turnover forecast value to use for percentages
  // If turnover has a forecast_amount, use it directly
  let effectiveTurnoverForecast = turnoverForecast;
  
  // If the direct forecast is zero or undefined, calculate from actuals
  if ((!effectiveTurnoverForecast || effectiveTurnoverForecast === 0) && turnoverItem && dayOfMonth > 0) {
    const turnoverActualAmount = getActualAmount(turnoverItem);
    console.log(`No forecast found, calculating from actual: ${turnoverActualAmount}`);
    
    if (turnoverActualAmount > 0) {
      effectiveTurnoverForecast = (turnoverActualAmount / dayOfMonth) * daysInMonth;
      console.log(`Calculated turnover forecast from actual: ${effectiveTurnoverForecast}`);
    } else {
      // Fallback to budget
      effectiveTurnoverForecast = turnoverBudget;
      console.log(`Using budget as turnover forecast: ${effectiveTurnoverForecast}`);
    }
  }
  
  // Final fallback if we still don't have a value
  if (!effectiveTurnoverForecast || effectiveTurnoverForecast === 0) {
    // Find revenue items
    const revenueItems = trackedBudgetData.filter(item =>
      item.name.toLowerCase().includes('revenue') ||
      item.name.toLowerCase().includes('sales')
    );
    
    console.log(`Looking at ${revenueItems.length} revenue items for forecast`);
    
    // Sum up revenue forecasts
    let revenueForecastSum = 0;
    for (const item of revenueItems) {
      if (item.forecast_amount && item.forecast_amount > 0) {
        revenueForecastSum += item.forecast_amount;
      } else {
        const itemActual = getActualAmount(item);
        if (itemActual > 0 && dayOfMonth > 0) {
          revenueForecastSum += (itemActual / dayOfMonth) * daysInMonth;
        } else {
          revenueForecastSum += item.budget_amount || 0;
        }
      }
    }
    
    if (revenueForecastSum > 0) {
      effectiveTurnoverForecast = revenueForecastSum;
      console.log(`Calculated turnover forecast from revenue items: ${effectiveTurnoverForecast}`);
    } else {
      // Last resort
      effectiveTurnoverForecast = turnoverBudget;
      console.log(`Using budget as final fallback for forecast: ${effectiveTurnoverForecast}`);
    }
  }
  
  console.log(`FINAL turnover forecast value for percentages: ${effectiveTurnoverForecast}`);
  
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
  const opForecastVariance = opForecast - operatingProfitBudget;
  
  // Calculate percentages - using turnover values
  const adminActualPercentage = turnoverActual > 0 ? (adminActualAmount / turnoverActual) * 100 : 0;
  const adminBudgetPercentage = turnoverBudget > 0 ? (adminTotalBudget / turnoverBudget) * 100 : 0;
  
  // FIXED: Make sure we're using the effective turnover forecast for percentages
  // Ensure we don't divide by zero
  const adminForecastPercentage = effectiveTurnoverForecast > 0 
    ? (adminForecast / effectiveTurnoverForecast) * 100 
    : 0;
  
  const opActualPercentage = turnoverActual > 0 ? (actualOperatingProfit / turnoverActual) * 100 : 0;
  const opBudgetPercentage = turnoverBudget > 0 ? (operatingProfitBudget / turnoverBudget) * 100 : 0;
  
  // FIXED: Make sure we're using the effective turnover forecast for operating profit percentage
  const opForecastPercentage = effectiveTurnoverForecast > 0 
    ? (opForecast / effectiveTurnoverForecast) * 100 
    : 0;

  console.log(`Admin Forecast: ${adminForecast}, Turnover Forecast: ${effectiveTurnoverForecast}`);
  console.log(`Admin Forecast %: ${adminForecastPercentage.toFixed(1)}%`);
  console.log(`OP Forecast: ${opForecast}, Turnover Forecast: ${effectiveTurnoverForecast}`);
  console.log(`OP Forecast %: ${opForecastPercentage.toFixed(1)}%`);
  
  // Update forecast value for operating profit in state
  React.useEffect(() => {
    const opIndex = trackedBudgetData.findIndex(i => 
      i.name.toLowerCase().includes('operating profit') && i.isHighlighted);
    
    if (opIndex >= 0 && !isNaN(opForecast)) {
      console.log(`Setting OP forecast: ${opForecast}`);
      updateForecastAmount(opIndex, opForecast.toString());
    }
    
    // Also update the admin expenses forecast
    const adminIndex = trackedBudgetData.findIndex(i => 
      i.name.toLowerCase().includes('total admin'));
      
    if (adminIndex >= 0 && !isNaN(adminForecast)) {
      console.log(`Setting Admin forecast: ${adminForecast}`);
      updateForecastAmount(adminIndex, adminForecast.toString());
    }
    
    // Also update turnover forecast if we calculated a better value
    if (turnoverItem && effectiveTurnoverForecast && effectiveTurnoverForecast !== turnoverForecast) {
      const turnoverIndex = trackedBudgetData.findIndex(i => 
        i.name.toLowerCase() === 'turnover' || i.name.toLowerCase() === 'total revenue');
        
      if (turnoverIndex >= 0) {
        console.log(`Setting Turnover forecast: ${effectiveTurnoverForecast}`);
        updateForecastAmount(turnoverIndex, effectiveTurnoverForecast.toString());
      }
    }
  }, [adminForecast, opForecast, effectiveTurnoverForecast, turnoverForecast, trackedBudgetData, updateForecastAmount]);

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
          {adminBudgetPercentage.toFixed(1)}%
        </TableCell>
        <TableCell className="text-right font-bold">
          {formatCurrency(adminExpenses)}
        </TableCell>
        <TableCell className="text-right font-bold">
          {formatCurrency(adminActualAmount)}
        </TableCell>
        <TableCell className="text-right font-bold">
          {formatCurrency(adminForecast)} ({adminForecastPercentage.toFixed(1)}%)
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
          {opBudgetPercentage.toFixed(1)}%
        </TableCell>
        <TableCell className="text-right font-bold">
          {formatCurrency(operatingProfit)}
        </TableCell>
        <TableCell className="text-right font-bold">
          {formatCurrency(actualOperatingProfit)}
        </TableCell>
        <TableCell className="text-right font-bold">
          {formatCurrency(opForecast)} ({opForecastPercentage.toFixed(1)}%)
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
