
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, FileUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatPercentage } from '@/lib/date-utils';

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
  return (
    <Card className="shadow-md rounded-xl overflow-hidden">
      <CardHeader className="bg-white/40 border-b">
        <CardTitle>P&L Flash Report - {currentMonthName} {currentYear}</CardTitle>
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
                  
                  return (
                    <TableRow key={i} className={
                      isHighlighted ? 'bg-[#48495e]/90 text-white' :
                      isGrossProfit ? 'font-semibold bg-purple-50/50' : ''
                    }>
                      <TableCell className={isHighlighted ? 'font-bold text-sm tracking-wider py-2' : ''}>
                        {item.name}
                        {isGrossProfit && item.budget_percentage && !isHighlighted && (
                          <span className="ml-2 text-xs text-gray-500">
                            ({formatPercentage(item.budget_percentage)})
                          </span>
                        )}
                      </TableCell>
                      <TableCell className={`text-right ${
                        isHighlighted ? '' : 
                        (isOperatingProfit && item.budget_amount < 0 ? 'text-red-600' : 
                         isOperatingProfit && item.budget_amount > 0 ? 'text-green-600' : '')
                      }`}>
                        {formatCurrency(item.budget_amount)}
                      </TableCell>
                      <TableCell className={`text-right ${
                        isHighlighted ? '' : 
                        (isOperatingProfit && (item.actual_amount || 0) < 0 ? 'text-red-600' : 
                         isOperatingProfit && (item.actual_amount || 0) > 0 ? 'text-green-600' : '')
                      }`}>
                        {formatCurrency(item.actual_amount || 0)}
                      </TableCell>
                      <TableCell className={`text-right ${
                        isHighlighted ? '' : 
                        (isOperatingProfit ? (variance < 0 ? 'text-red-600' : 'text-green-600') : 
                         isPositiveVariance ? 'text-green-600' : 'text-red-600')
                      }`}>
                        {variance > 0 ? '+' : ''}{formatCurrency(variance)} ({formatPercentage(variancePercent)})
                      </TableCell>
                      <TableCell className={`text-right ${
                        isHighlighted ? '' : 
                        (isOperatingProfit && (item.forecast_amount || item.budget_amount) < 0 ? 'text-red-600' : 
                         isOperatingProfit && (item.forecast_amount || item.budget_amount) > 0 ? 'text-green-600' : '')
                      }`}>
                        {formatCurrency(item.forecast_amount || item.budget_amount)}
                      </TableCell>
                      <TableCell className={`text-right ${
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
