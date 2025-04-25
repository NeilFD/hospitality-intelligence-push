
import React from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter } from '@/components/ui/table';
import { formatCurrency } from '@/lib/date-utils';
import { PLTrackerBudgetItem } from './types/PLTrackerTypes';
import { Button } from '@/components/ui/button';

interface PLReportTableProps {
  isLoading: boolean;
  processedBudgetData: PLTrackerBudgetItem[];
  currentMonthName: string;
  currentYear: number;
  currentMonth: number;
}

export function PLReportTable({ 
  isLoading, 
  processedBudgetData, 
  currentMonthName,
  currentYear,
  currentMonth
}: PLReportTableProps) {
  
  if (isLoading) {
    return <div className="p-6 text-center">Loading budget data...</div>;
  }
  
  const calculateVariance = (actual: number | undefined, budget: number | undefined): number => {
    if (actual === undefined || budget === undefined) return 0;
    return actual - budget;
  };
  
  const calculateForecastVariance = (forecast: number | undefined, budget: number | undefined): number => {
    if (forecast === undefined || budget === undefined) return 0;
    return forecast - budget;
  };
  
  const getVarianceColor = (variance: number): string => {
    if (variance > 0) return 'text-green-600';
    if (variance < 0) return 'text-red-600';
    return '';
  };
  
  // Group data by categories
  const categories = processedBudgetData.reduce((acc, item) => {
    if (!item.category) return acc;
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, PLTrackerBudgetItem[]>);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold">{currentMonthName} {currentYear} P&L Report</h2>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Item</TableHead>
              <TableHead className="text-right">Budget</TableHead>
              <TableHead className="text-right">Actual MTD</TableHead>
              <TableHead className="text-right">Variance</TableHead>
              <TableHead className="text-right">Forecast</TableHead>
              <TableHead className="text-right">Forecast Variance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.keys(categories).map((category) => (
              <React.Fragment key={category}>
                <TableRow className="bg-gray-50">
                  <TableCell colSpan={6} className="font-semibold text-[#48495e]">
                    {category}
                  </TableCell>
                </TableRow>
                {categories[category].map((item, index) => {
                  const variance = calculateVariance(item.actual_amount, item.budget_amount);
                  const forecastVariance = calculateForecastVariance(item.forecast_amount, item.budget_amount);
                  
                  return (
                    <TableRow key={index}>
                      <TableCell className="pl-8">{item.name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.budget_amount || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.actual_amount || 0)}</TableCell>
                      <TableCell className={`text-right ${getVarianceColor(variance)}`}>
                        {formatCurrency(variance)}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(item.forecast_amount || 0)}</TableCell>
                      <TableCell className={`text-right ${getVarianceColor(forecastVariance)}`}>
                        {formatCurrency(forecastVariance)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </React.Fragment>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>Total</TableCell>
              <TableCell className="text-right">
                {formatCurrency(processedBudgetData.reduce((sum, item) => sum + (item.budget_amount || 0), 0))}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(processedBudgetData.reduce((sum, item) => sum + (item.actual_amount || 0), 0))}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(processedBudgetData.reduce((sum, item) => {
                  const variance = calculateVariance(item.actual_amount, item.budget_amount);
                  return sum + variance;
                }, 0))}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(processedBudgetData.reduce((sum, item) => sum + (item.forecast_amount || 0), 0))}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(processedBudgetData.reduce((sum, item) => {
                  const forecastVariance = calculateForecastVariance(item.forecast_amount, item.budget_amount);
                  return sum + forecastVariance;
                }, 0))}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
