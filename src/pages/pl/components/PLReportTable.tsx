import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, BarChart2 } from 'lucide-react';
import { formatCurrency } from '@/lib/date-utils';

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
}

interface PLReportTableProps {
  isLoading: boolean;
  processedBudgetData: BudgetItem[];
  currentMonthName: string;
  currentYear: number;
  onOpenTracker: () => void;
}

export function PLReportTable({ 
  isLoading, 
  processedBudgetData, 
  currentMonthName, 
  currentYear,
  onOpenTracker
}: PLReportTableProps) {
  return (
    <Card className="shadow-md rounded-xl overflow-hidden">
      <CardHeader className="bg-white/40 border-b flex flex-row items-center justify-between">
        <CardTitle>P&L Flash Report - {currentMonthName} {currentYear}</CardTitle>
        <Button 
          onClick={onOpenTracker}
          variant="outline" 
          size="sm"
          className="flex items-center gap-2"
        >
          <BarChart2 size={16} />
          Update Tracker
        </Button>
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
                  <TableHead className="text-right">Budget</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead className="text-right">Actual MTD</TableHead>
                  <TableHead className="text-right">Var MTD</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedBudgetData
                  .filter(item => 
                    !item.name.toLowerCase().includes('total') && 
                    item.name !== 'ADMINISTRATIVE EXPENSES' &&
                    item.name !== 'Tavern'
                  )
                  .map((item, i) => {
                  if (item.isHeader) {
                    return (
                      <TableRow key={i} className={'bg-[#48495e]/90 text-white'}>
                        <TableCell 
                          colSpan={5} 
                          className="font-bold text-sm tracking-wider py-2"
                        >
                          {item.name}
                        </TableCell>
                      </TableRow>
                    );
                  }
                  
                  const actualAmount = item.actual_amount || 0;
                  const variance = actualAmount - item.budget_amount;
                  
                  let rowClassName = '';
                  let fontClass = '';
                  
                  const isGrossProfit = item.name.toLowerCase().includes('gross profit') || 
                                        item.name.toLowerCase().includes('profit/(loss)');
                  
                  const isOperatingProfit = item.name.toLowerCase().includes('operating profit');
                  
                  const isTurnover = item.name.toLowerCase() === 'turnover';
                  
                  if (item.isHighlighted) {
                    rowClassName = 'bg-[#48495e]/90 text-white';
                  } else if (isGrossProfit || isTurnover) {
                    rowClassName = 'bg-purple-50/50';
                  }
                  
                  fontClass = item.isHighlighted || isTurnover ? 'font-bold' : '';
                  
                  return (
                    <TableRow key={i} className={rowClassName}>
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
                        {formatCurrency(actualAmount)}
                      </TableCell>
                      <TableCell className={`text-right ${fontClass} ${
                        variance > 0 ? 'text-green-600' : variance < 0 ? 'text-red-600' : ''
                      }`}>
                        {formatCurrency(variance)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center p-8 text-gray-500">
            <p>No budget data available for {currentMonthName} {currentYear}.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
