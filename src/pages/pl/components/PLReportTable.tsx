
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
  isAdminHeader?: boolean;
  isHighlighted?: boolean;
  isOperatingProfit?: boolean;
  isGrossProfit?: boolean;
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
  console.log("All budget data:", processedBudgetData.map(item => `${item.name}: £${item.actual_amount || 0}`));

  const displayData = processedBudgetData;
  
  // Find the food and beverage revenue items
  const foodRevenueItem = displayData.find(item => 
    (item.name.toLowerCase().includes('food sales') || 
     item.name.toLowerCase().includes('food revenue')));
  
  const beverageRevenueItem = displayData.find(item => 
    (item.name.toLowerCase().includes('beverage sales') || 
     item.name.toLowerCase().includes('beverage revenue') ||
     item.name.toLowerCase().includes('drink sales') ||
     item.name.toLowerCase().includes('drinks revenue')));
  
  // Check for gross profit items
  const foodGpItems = displayData.filter(item => 
    item.name.toLowerCase().includes('food') && 
    item.name.toLowerCase().includes('gross profit')
  );
  
  const beverageGpItems = displayData.filter(item => 
    (item.name.toLowerCase().includes('beverage') || item.name.toLowerCase().includes('drink')) && 
    item.name.toLowerCase().includes('gross profit')
  );
  
  console.log("Food GP items found:", foodGpItems.map(item => `${item.name}: £${item.actual_amount || 0}`));
  console.log("Beverage GP items found:", beverageGpItems.map(item => `${item.name}: £${item.actual_amount || 0}`));

  const displayItems = displayData.filter(item => 
    !item.name.toLowerCase().includes('total gross profit') && 
    item.name !== 'ADMINISTRATIVE EXPENSES' &&
    item.name !== 'Tavern' &&
    !item.name.toLowerCase().includes('operating profit') &&
    item.name !== 'Gross Profit' &&
    !item.name.toLowerCase().includes('total admin') &&
    !(item.name.toLowerCase() === 'total') &&
    !(item.name === 'ADMIN EXPENSES' && item.isAdminHeader)
  );
  
  console.log("Display items:", displayItems.map(item => `${item.name}: £${item.actual_amount || 0}`));
  
  const foodGrossProfitItem = displayData.find(item => 
    (item.name === 'Food Gross Profit' || 
     item.name.toLowerCase() === 'food gross profit' ||
     item.name === 'Food GP')
  );
  
  const beverageGrossProfitItem = displayData.find(item => 
    (item.name === 'Beverage Gross Profit' || 
     item.name.toLowerCase() === 'beverage gross profit' ||
     item.name.toLowerCase() === 'drink gross profit' ||
     item.name.toLowerCase() === 'drinks gross profit' ||
     item.name === 'Beverage GP')
  );

  console.log("Food GP item found:", foodGrossProfitItem ? `${foodGrossProfitItem.name}: £${foodGrossProfitItem.actual_amount || 0}` : "Not found");
  console.log("Beverage GP item found:", beverageGrossProfitItem ? `${beverageGrossProfitItem.name}: £${beverageGrossProfitItem.actual_amount || 0}` : "Not found");

  const costOfSalesItem = displayData.find(item => 
    (item.name.toLowerCase() === 'cost of sales' ||
    item.name.toLowerCase() === 'cos') &&
    !item.name.toLowerCase().includes('food') &&
    !item.name.toLowerCase().includes('beverage') &&
    !item.name.toLowerCase().includes('drink') &&
    !item.name.toLowerCase().includes('bev')
  );

  const isAdminExpense = (item: BudgetItem) => 
    !item.name.toLowerCase().includes('turnover') &&
    !item.name.toLowerCase().includes('cost of sales') &&
    !item.name.toLowerCase().includes('gross profit') &&
    !item.isHeader &&
    !item.name.toLowerCase().includes('total') &&
    item.category !== 'Revenue' &&
    item.category !== 'Turnover' &&
    item.category !== 'Cost of Sales' &&
    item.category !== 'COS' &&
    item.category !== 'Header' &&
    item.category !== 'Summary';
    
  const wagesIndex = displayItems.findIndex(item => 
    item.name.toLowerCase().includes('wages and salaries'));
  const hotelTravelIndex = displayItems.findIndex(item => 
    item.name.toLowerCase().includes('hotel and travel'));

  const targetAdminItems = wagesIndex >= 0 && hotelTravelIndex >= 0 && hotelTravelIndex >= wagesIndex
    ? displayItems.slice(wagesIndex, hotelTravelIndex + 1).filter(isAdminExpense)
    : displayItems.filter(isAdminExpense);

  const totalAdminBudget = targetAdminItems.reduce((sum, item) => sum + item.budget_amount, 0);
  const totalAdminActual = targetAdminItems.reduce((sum, item) => sum + (item.actual_amount || 0), 0);
  const totalAdminVariance = totalAdminActual - totalAdminBudget;

  const operatingProfitItem = displayData.find(item => 
    item.name.toLowerCase().includes('operating profit')
  );

  const totalGrossProfitItem = displayData.find(item => 
    item.name === 'Gross Profit' || 
    item.name.toLowerCase() === 'gross profit' || 
    item.name.toLowerCase() === 'gross profit/(loss)'
  );

  console.log("Total Gross Profit Item:", totalGrossProfitItem ? 
    `${totalGrossProfitItem.name}: Budget £${totalGrossProfitItem.budget_amount} Actual £${totalGrossProfitItem.actual_amount || 0}` : 
    "Not found");

  const renderBudgetItemRow = (item: BudgetItem, i: number | string, customClass: string = '') => {
    const actualAmount = item.actual_amount || 0;
    const variance = actualAmount - item.budget_amount;
    
    let rowClassName = customClass;
    let fontClass = '';
    
    const isGrossProfit = item.isGrossProfit || 
                         item.name.toLowerCase().includes('gross profit') ||
                         item.name.toLowerCase().includes('profit/(loss)');
    
    const isTurnover = item.name.toLowerCase() === 'turnover';
    const isCostOfSales = item.name.toLowerCase() === 'cost of sales' || 
                          item.name.toLowerCase() === 'cos';
    
    if (item.isHighlighted) {
      rowClassName = 'bg-[#48495e]/90 text-white';
      fontClass = 'font-bold';
    } else if (isGrossProfit || isTurnover) {
      rowClassName = 'bg-purple-50/50';
    } else if (isCostOfSales) {
      rowClassName = 'bg-purple-100/50';
      fontClass = 'font-semibold';
    }
    
    fontClass = item.isHighlighted || isTurnover || isGrossProfit || isCostOfSales ? 'font-bold' : '';
    
    const rowKey = typeof i === 'number' ? i : `${i}-${item.name.replace(/\s+/g, '-').toLowerCase()}`;

    // Calculate percentage for gross profit items
    let percentageDisplay = '';
    if (isGrossProfit && item.name.toLowerCase().includes('food') && foodRevenueItem && foodRevenueItem.actual_amount) {
      const foodRevenue = foodRevenueItem.actual_amount;
      const percentage = foodRevenue > 0 ? ((actualAmount / foodRevenue) * 100).toFixed(2) : "0.00";
      percentageDisplay = `${percentage}%`;
    } else if (isGrossProfit && (item.name.toLowerCase().includes('beverage') || item.name.toLowerCase().includes('drink')) && beverageRevenueItem && beverageRevenueItem.actual_amount) {
      const beverageRevenue = beverageRevenueItem.actual_amount;
      const percentage = beverageRevenue > 0 ? ((actualAmount / beverageRevenue) * 100).toFixed(2) : "0.00";
      percentageDisplay = `${percentage}%`;
    } else if (item.budget_percentage !== undefined) {
      percentageDisplay = `${(item.budget_percentage * 100).toFixed(2)}%`;
    }
    
    return (
      <TableRow key={rowKey} className={rowClassName}>
        <TableCell className={fontClass}>
          {item.name}
        </TableCell>
        <TableCell className={`text-right ${fontClass}`}>
          {formatCurrency(item.budget_amount)}
        </TableCell>
        <TableCell className="text-right">
          {percentageDisplay}
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
  };

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
        ) : displayData.length > 0 ? (
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
                {displayItems.map((item, i) => {
                  if (item.isHeader) {
                    let headerClass = 'bg-[#48495e]/90 text-white';
                    
                    if (item.name === 'ADMIN EXPENSES' || item.isAdminHeader) {
                      headerClass = 'bg-purple-100 text-[#48495e]';
                    }
                    
                    return (
                      <TableRow key={i} className={headerClass}>
                        <TableCell 
                          colSpan={5} 
                          className="font-bold text-sm tracking-wider py-2"
                        >
                          {item.name}
                        </TableCell>
                      </TableRow>
                    );
                  }
                  
                  return renderBudgetItemRow(item, i);
                })}
                
                {totalGrossProfitItem && (
                  <TableRow className="bg-[#48495e]/90 text-white">
                    <TableCell className="font-bold">
                      {totalGrossProfitItem.name}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(totalGrossProfitItem.budget_amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {totalGrossProfitItem.budget_percentage !== undefined 
                        ? `${(totalGrossProfitItem.budget_percentage * 100).toFixed(2)}%` 
                        : ''}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(totalGrossProfitItem.actual_amount || 0)}
                    </TableCell>
                    <TableCell className={`text-right font-bold ${
                      (totalGrossProfitItem.actual_amount || 0) - totalGrossProfitItem.budget_amount > 0 
                        ? 'text-green-200' 
                        : (totalGrossProfitItem.actual_amount || 0) - totalGrossProfitItem.budget_amount < 0 
                          ? 'text-red-200' 
                          : ''
                    }`}>
                      {formatCurrency((totalGrossProfitItem.actual_amount || 0) - totalGrossProfitItem.budget_amount)}
                    </TableCell>
                  </TableRow>
                )}
                
                <TableRow className="bg-purple-100 text-[#48495e]">
                  <TableCell className="font-bold">
                    ADMIN EXPENSES
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(totalAdminBudget)}
                  </TableCell>
                  <TableCell className="text-right">
                    {/* Percentage can be added here if needed */}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(totalAdminActual)}
                  </TableCell>
                  <TableCell className={`text-right font-bold ${
                    totalAdminVariance > 0 
                      ? 'text-green-600' 
                      : totalAdminVariance < 0 
                        ? 'text-red-600' 
                        : ''
                  }`}>
                    {formatCurrency(totalAdminVariance)}
                  </TableCell>
                </TableRow>
                
                {operatingProfitItem && (
                  <TableRow className="bg-[#8B5CF6]/90 text-white">
                    <TableCell className="font-bold">
                      {operatingProfitItem.name}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(operatingProfitItem.budget_amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {operatingProfitItem.budget_percentage !== undefined 
                        ? `${(operatingProfitItem.budget_percentage * 100).toFixed(2)}%` 
                        : ''}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(operatingProfitItem.actual_amount || 0)}
                    </TableCell>
                    <TableCell className={`text-right font-bold ${
                      (operatingProfitItem.actual_amount || 0) - operatingProfitItem.budget_amount > 0 
                        ? 'text-green-200' 
                        : (operatingProfitItem.actual_amount || 0) - operatingProfitItem.budget_amount < 0 
                          ? 'text-red-200' 
                          : ''
                    }`}>
                      {formatCurrency((operatingProfitItem.actual_amount || 0) - operatingProfitItem.budget_amount)}
                    </TableCell>
                  </TableRow>
                )}
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
