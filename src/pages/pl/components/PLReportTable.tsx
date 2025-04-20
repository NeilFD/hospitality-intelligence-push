import React, { useState, useEffect, useMemo } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { formatCurrency, formatPercentage } from '@/lib/date-utils';
import { PLTrackerBudgetItem } from '../types/PLTrackerTypes';
import { TrackerLineItem } from './tracker/TrackerLineItem';
import { TrackerSummaryRows } from './tracker/TrackerSummaryRows';

interface PLReportTableProps {
  budgetData: PLTrackerBudgetItem[];
  currentMonthName: string;
  currentYear: number;
  dayOfMonth: number;
  daysInMonth: number;
  updateManualActualAmount: (index: number, value: string) => void;
  updateForecastAmount: (index: number, value: string) => void;
  updateDailyValues: (index: number, dailyValues: any[]) => void;
}

export function PLReportTable({
  budgetData,
  currentMonthName,
  currentYear,
  dayOfMonth,
  daysInMonth,
  updateManualActualAmount,
  updateForecastAmount,
  updateDailyValues
}: PLReportTableProps) {
  const [filteredBudgetData, setFilteredBudgetData] = useState<PLTrackerBudgetItem[]>([]);
  const [showAllItems, setShowAllItems] = useState(false);

  useEffect(() => {
    if (showAllItems) {
      setFilteredBudgetData(budgetData);
    } else {
      // Filter to show only headers and highlighted items
      setFilteredBudgetData(
        budgetData.filter(item => item.isHeader || item.isHighlighted)
      );
    }
  }, [budgetData, showAllItems]);

  const calculateProRatedBudget = (item: PLTrackerBudgetItem) => {
    if (!item.budget_amount) return 0;
    return (item.budget_amount / daysInMonth) * dayOfMonth;
  };

  const getActualAmount = (item: PLTrackerBudgetItem) => {
    if (item.manual_actual_amount !== undefined && item.manual_actual_amount !== null) {
      return item.manual_actual_amount;
    }
    return item.actual_amount || 0;
  };

  // Calculate admin expenses
  const adminExpenses = useMemo(() => {
    return budgetData
      .filter(item => 
        !item.isHeader && 
        !item.name.toLowerCase().includes('turnover') &&
        !item.name.toLowerCase().includes('revenue') &&
        !item.name.toLowerCase().includes('sales') &&
        !item.name.toLowerCase().includes('cost of sales') &&
        !item.name.toLowerCase().includes('cos') &&
        !item.name.toLowerCase().includes('gross profit') &&
        !item.name.toLowerCase().includes('operating profit')
      )
      .reduce((sum, item) => sum + getActualAmount(item), 0);
  }, [budgetData]);

  // Find gross profit
  const grossProfit = useMemo(() => {
    const grossProfitItem = budgetData.find(item => 
      item.name.toLowerCase().includes('gross profit') && item.isHighlighted);
    return grossProfitItem ? getActualAmount(grossProfitItem) : 0;
  }, [budgetData]);

  // Calculate operating profit
  const operatingProfitActual = grossProfit - adminExpenses;

  // Find budget values
  const grossProfitBudget = useMemo(() => {
    const grossProfitItem = budgetData.find(item => 
      item.name.toLowerCase().includes('gross profit') && item.isHighlighted);
    return grossProfitItem ? grossProfitItem.budget_amount || 0 : 0;
  }, [budgetData]);

  const adminExpensesBudget = useMemo(() => {
    return budgetData
      .filter(item => 
        !item.isHeader && 
        !item.name.toLowerCase().includes('turnover') &&
        !item.name.toLowerCase().includes('revenue') &&
        !item.name.toLowerCase().includes('sales') &&
        !item.name.toLowerCase().includes('cost of sales') &&
        !item.name.toLowerCase().includes('cos') &&
        !item.name.toLowerCase().includes('gross profit') &&
        !item.name.toLowerCase().includes('operating profit')
      )
      .reduce((sum, item) => sum + (item.budget_amount || 0), 0);
  }, [budgetData]);

  const operatingProfitBudget = grossProfitBudget - adminExpensesBudget;

  // Find turnover for percentage calculations
  const turnoverActual = useMemo(() => {
    const turnoverItem = budgetData.find(item => 
      item.name.toLowerCase() === 'turnover' || 
      item.name.toLowerCase() === 'total revenue');
    return turnoverItem ? getActualAmount(turnoverItem) : 0;
  }, [budgetData]);

  const turnoverBudget = useMemo(() => {
    const turnoverItem = budgetData.find(item => 
      item.name.toLowerCase() === 'turnover' || 
      item.name.toLowerCase() === 'total revenue');
    return turnoverItem ? turnoverItem.budget_amount || 0 : 0;
  }, [budgetData]);

  // Calculate percentages
  const operatingProfitActualPercentage = turnoverActual ? (operatingProfitActual / turnoverActual) * 100 : 0;
  
  // Calculate forecast values
  const operatingProfitForecast = useMemo(() => {
    if (operatingProfitActual && dayOfMonth > 0) {
      return (operatingProfitActual / dayOfMonth) * daysInMonth;
    }
    return operatingProfitBudget;
  }, [operatingProfitActual, dayOfMonth, daysInMonth, operatingProfitBudget]);

  const turnoverForecast = useMemo(() => {
    const turnoverItem = budgetData.find(item => 
      item.name.toLowerCase() === 'turnover' || 
      item.name.toLowerCase() === 'total revenue');
    
    if (turnoverItem && turnoverItem.forecast_amount) {
      return turnoverItem.forecast_amount;
    }
    
    if (turnoverActual && dayOfMonth > 0) {
      return (turnoverActual / dayOfMonth) * daysInMonth;
    }
    
    return turnoverBudget;
  }, [budgetData, turnoverActual, dayOfMonth, daysInMonth, turnoverBudget]);

  const operatingProfitForecastPercentage = turnoverForecast ? (operatingProfitForecast / turnoverForecast) * 100 : 0;
  
  // Calculate variance
  const operatingProfitVariance = operatingProfitForecast - operatingProfitBudget;

  const getValueColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return '';
  };

  const renderTableContent = () => {
    return (
      <>
        {filteredBudgetData.map((item, index) => {
          const proRatedBudget = calculateProRatedBudget(item);
          const actualAmount = getActualAmount(item);
          const variance = actualAmount - proRatedBudget;
          
          return (
            <TrackerLineItem
              key={`${item.id}-${index}`}
              item={item}
              index={budgetData.findIndex(i => i.id === item.id)}
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

        {/* Updated Operating Profit row styling */}
        <TableRow className="bg-[#D6BCFA] text-[#1A1F2C] hover:bg-[#E5DEFF] transition-colors">
          <TableCell className="font-bold">
            Operating profit
          </TableCell>
          <TableCell className={`text-right font-bold ${getValueColor(operatingProfitBudget)}`}>
            {formatCurrency(operatingProfitBudget)}
          </TableCell>
          <TableCell className={`text-right font-bold ${getValueColor(operatingProfitActual)}`}>
            {formatCurrency(operatingProfitActual)}
          </TableCell>
          <TableCell className={`text-right font-bold ${getValueColor(operatingProfitActualPercentage)}`}>
            {formatPercentage(operatingProfitActualPercentage / 100)}
          </TableCell>
          <TableCell className={`text-right font-bold ${getValueColor(operatingProfitForecast)}`}>
            {formatCurrency(operatingProfitForecast)}
          </TableCell>
          <TableCell className="text-right font-bold">
            {formatPercentage(operatingProfitForecastPercentage / 100)}
          </TableCell>
          <TableCell className={`text-right font-bold ${
            operatingProfitVariance > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatCurrency(operatingProfitVariance)}
          </TableCell>
        </TableRow>
      </>
    );
  };

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[800px]">
        <TableHeader>
          <TableRow className="bg-gray-100">
            <TableHead className="w-[250px]">Item</TableHead>
            <TableHead className="text-right">Budget</TableHead>
            <TableHead className="text-right">%</TableHead>
            <TableHead className="text-right">Pro-rated Budget</TableHead>
            <TableHead className="text-right">Actual</TableHead>
            <TableHead className="text-right">Forecast</TableHead>
            <TableHead className="text-right">Variance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {renderTableContent()}
          
          <TrackerSummaryRows
            trackedBudgetData={budgetData}
            dayOfMonth={dayOfMonth}
            daysInMonth={daysInMonth}
            getActualAmount={getActualAmount}
            calculateProRatedBudget={calculateProRatedBudget}
            updateForecastAmount={updateForecastAmount}
          />
        </TableBody>
      </Table>
      
      <div className="mt-4 flex justify-end">
        <button
          onClick={() => setShowAllItems(!showAllItems)}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          {showAllItems ? 'Show Summary View' : 'Show All Items'}
        </button>
      </div>
    </div>
  );
}
