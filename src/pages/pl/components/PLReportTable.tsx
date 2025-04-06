
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, FileUp, LineChart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatPercentage } from '@/lib/date-utils';
import { PLTracker } from './PLTracker';

interface BudgetItem {
  id?: string;
  category: string;
  name: string;
  budget_amount: number;
  actual_amount?: number;
  forecast_amount?: number;
  budget_percentage?: number;
  isHeader?: boolean;
  isHighlighted?: boolean;
  isGrossProfit?: boolean;
  isOperatingProfit?: boolean;
}

interface PLReportTableProps {
  isLoading: boolean;
  processedBudgetData: BudgetItem[];
  currentMonthName: string;
  currentYear: number;
}

export function PLReportTable({ 
  isLoading, 
  processedBudgetData, 
  currentMonthName, 
  currentYear 
}: PLReportTableProps) {
  const [showTracker, setShowTracker] = useState(false);

  // Toggle the tracker view
  const handleToggleTracker = () => {
    setShowTracker(!showTracker);
  };

  if (showTracker) {
    return (
      <PLTracker 
        isLoading={isLoading}
        processedBudgetData={processedBudgetData}
        currentMonthName={currentMonthName}
        currentYear={currentYear}
        onClose={handleToggleTracker}
      />
    );
  }

  return (
    <Card className="shadow-md rounded-xl overflow-hidden">
      <CardHeader className="bg-white/40 border-b flex flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          <CardTitle>P&L Flash Report - {currentMonthName} {currentYear}</CardTitle>
          <Button 
            onClick={handleToggleTracker} 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2"
          >
            <LineChart className="h-4 w-4" />
            Update Tracker
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : processedBudgetData.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-purple-50">
                  <TableHead className="w-[250px]">Line Item</TableHead>
                  <TableHead className="text-right">Monthly Budget</TableHead>
                  <TableHead className="text-right">MTD Actual</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead className="text-right">Forecast</TableHead>
                  <TableHead className="text-right">Forecast Variance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedBudgetData.map((item, i) => {
                  if (item.isHeader) {
                    // Handle section headers
                    return (
                      <TableRow key={i} className={'bg-[#48495e]/90 text-white'}>
                        <TableCell 
                          colSpan={6} 
                          className="font-bold text-sm tracking-wider py-2"
                        >
                          {item.name}
                        </TableCell>
                      </TableRow>
                    );
                  }
                  
                  const variance = item.actual_amount - item.budget_amount;
                  const variancePercent = item.budget_amount !== 0 ? variance / item.budget_amount * 100 : 0;
                  const forecastVariance = item.forecast_amount - item.budget_amount;
                  const forecastVariancePercent = item.budget_amount !== 0 ? forecastVariance / item.budget_amount * 100 : 0;
                  
                  // Determine if variance is positive (good) based on category
                  const isPositiveVariance = item.category === 'Food Revenue' || 
                                           item.category === 'Beverage Revenue' || 
                                           item.category.includes('Profit') ? variance > 0 : variance < 0;
                  
                  const isPositiveForecast = item.category === 'Food Revenue' || 
                                           item.category === 'Beverage Revenue' || 
                                           item.category.includes('Profit') ? forecastVariance > 0 : forecastVariance < 0;
                  
                  // Special styling for gross profit rows
                  const isGrossProfit = item.isGrossProfit || 
                                      item.name.toLowerCase().includes('gross profit') || 
                                      item.name.toLowerCase().includes('profit/(loss)');
                  
                  // Special handling for Operating Profit row
                  const isOperatingProfit = item.isOperatingProfit || 
                                          item.name.toLowerCase().includes('operating profit');
                  
                  // Special handling for highlighted rows (Total Admin and Operating Profit)
                  const isHighlighted = item.isHighlighted;
                  const isTotalAdmin = item.name.toLowerCase().includes('total admin');
                  
                  // Add special handling for Turnover, Cost of Sales, and Gross Profit/(Loss) rows
                  const isTurnover = item.name.toLowerCase().includes('turnover') || 
                                    item.name.toLowerCase() === 'turnover';
                  const isCostOfSales = item.name.toLowerCase().includes('cost of sales') || 
                                      item.name.toLowerCase() === 'cost of sales';
                  const isGrossProfitLoss = item.name.toLowerCase().includes('gross profit/(loss)');
                  
                  // Check if this is Food or Beverage specific Gross Profit
                  const isFoodGrossProfit = item.name.toLowerCase() === 'food gross profit';
                  const isBeverageGrossProfit = item.name.toLowerCase() === 'beverage gross profit';
                  
                  // Apply bold styling to specified rows, but not Food/Beverage Gross Profit
                  const shouldBeBold = (isHighlighted || isTotalAdmin || isTurnover || 
                                      isCostOfSales || isGrossProfitLoss) &&
                                      !isFoodGrossProfit && !isBeverageGrossProfit;
                  
                  const fontClass = shouldBeBold ? 'font-bold' : '';
                  
                  // Determine row styling
                  let rowClassName = '';
                  if (isHighlighted && !isTotalAdmin) {
                    rowClassName = 'bg-[#48495e]/90 text-white font-bold';
                  } else if (isGrossProfit && !isFoodGrossProfit && !isBeverageGrossProfit) {
                    // Only apply special styling to main gross profit rows, not Food/Beverage specific ones
                    rowClassName = 'font-semibold bg-purple-50/50';
                  } else if (isTurnover) {
                    // Add similar styling to Gross Profit for Turnover
                    rowClassName = 'font-semibold bg-purple-50/50';
                  } else if (isFoodGrossProfit || isBeverageGrossProfit) {
                    // Apply lighter styling to Food/Beverage Gross Profit rows
                    rowClassName = 'bg-purple-50/30';
                  }
                  
                  return (
                    <TableRow key={i} className={rowClassName}>
                      <TableCell className={fontClass}>
                        {item.name}
                        {isGrossProfit && item.budget_percentage && !isHighlighted && (
                          <span className="ml-2 text-xs text-gray-500">
                            ({formatPercentage(item.budget_percentage)})
                          </span>
                        )}
                      </TableCell>
                      <TableCell className={`text-right ${fontClass} ${
                        isHighlighted ? '' : 
                        (isOperatingProfit && item.budget_amount < 0 ? 'text-red-600' : 
                         isOperatingProfit && item.budget_amount > 0 ? 'text-green-600' : '')
                      }`}>
                        {formatCurrency(item.budget_amount)}
                      </TableCell>
                      <TableCell className={`text-right ${fontClass} ${
                        isHighlighted ? '' : 
                        (isOperatingProfit && (item.actual_amount || 0) < 0 ? 'text-red-600' : 
                         isOperatingProfit && (item.actual_amount || 0) > 0 ? 'text-green-600' : '')
                      }`}>
                        {formatCurrency(item.actual_amount || 0)}
                      </TableCell>
                      <TableCell className={`text-right ${fontClass} ${
                        isHighlighted ? '' : 
                        (isOperatingProfit ? (variance < 0 ? 'text-red-600' : 'text-green-600') : 
                         isPositiveVariance ? 'text-green-600' : 'text-red-600')
                      }`}>
                        {variance > 0 ? '+' : ''}{formatCurrency(variance)} ({formatPercentage(variancePercent)})
                      </TableCell>
                      <TableCell className={`text-right ${fontClass} ${
                        isHighlighted ? '' : 
                        (isOperatingProfit && (item.forecast_amount || item.budget_amount) < 0 ? 'text-red-600' : 
                         isOperatingProfit && (item.forecast_amount || item.budget_amount) > 0 ? 'text-green-600' : '')
                      }`}>
                        {formatCurrency(item.forecast_amount || item.budget_amount)}
                      </TableCell>
                      <TableCell className={`text-right ${fontClass} ${
                        isHighlighted ? '' : 
                        (isOperatingProfit ? (forecastVariance < 0 ? 'text-red-600' : 'text-green-600') : 
                         isPositiveForecast ? 'text-green-600' : 'text-red-600')
                      }`}>
                        {forecastVariance > 0 ? '+' : ''}{formatCurrency(forecastVariance)} ({formatPercentage(forecastVariancePercent)})
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center p-8 text-gray-500">
            <p className="mb-4">No budget data available for {currentMonthName} {currentYear}.</p>
            <Button asChild variant="outline">
              <Link to="/pl/budget">
                <FileUp className="mr-2 h-4 w-4" />
                Upload Budget Data
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
