
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
  console.log("All budget data:", processedBudgetData.map(item => item.name));

  // Important: Log all food and beverage gross profit items for debugging
  const foodGpItems = processedBudgetData.filter(item => 
    item.name.toLowerCase().includes('food') && 
    item.name.toLowerCase().includes('gross profit')
  );
  
  const beverageGpItems = processedBudgetData.filter(item => 
    (item.name.toLowerCase().includes('beverage') || item.name.toLowerCase().includes('drink')) && 
    item.name.toLowerCase().includes('gross profit')
  );
  
  console.log("Food GP items found:", foodGpItems.map(item => `${item.name}: £${item.budget_amount}`));
  console.log("Beverage GP items found:", beverageGpItems.map(item => `${item.name}: £${item.budget_amount}`));

  // Filter items for display but exclude Total Gross Profit only
  const displayItems = processedBudgetData.filter(item => 
    !item.name.toLowerCase().includes('total') && 
    item.name !== 'ADMINISTRATIVE EXPENSES' &&
    item.name !== 'Tavern' &&
    !item.name.toLowerCase().includes('operating profit') &&
    item.name !== 'Gross Profit'
  );
  
  console.log("Display items:", displayItems.map(item => item.name));
  
  // Find Food and Beverage Gross Profit items directly from processedBudgetData
  const foodGrossProfitItem = processedBudgetData.find(item => 
    (item.name === 'Food Gross Profit' || 
     item.name.toLowerCase() === 'food gross profit' ||
     item.name === 'Food GP')
  );
  
  const beverageGrossProfitItem = processedBudgetData.find(item => 
    (item.name === 'Beverage Gross Profit' || 
     item.name.toLowerCase() === 'beverage gross profit' ||
     item.name.toLowerCase() === 'drink gross profit' ||
     item.name.toLowerCase() === 'drinks gross profit' ||
     item.name === 'Beverage GP')
  );

  console.log("Food GP item found:", foodGrossProfitItem ? foodGrossProfitItem.name : "Not found");
  console.log("Beverage GP item found:", beverageGrossProfitItem ? beverageGrossProfitItem.name : "Not found");

  // Determine if an item is an admin expense
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
    
  // Find Wages and Salaries index and Hotel and travel index
  const wagesIndex = displayItems.findIndex(item => 
    item.name.toLowerCase().includes('wages and salaries'));
  const hotelTravelIndex = displayItems.findIndex(item => 
    item.name.toLowerCase().includes('hotel and travel'));

  // If found, extract just those items
  const targetAdminItems = wagesIndex >= 0 && hotelTravelIndex >= 0 && hotelTravelIndex >= wagesIndex
    ? displayItems.slice(wagesIndex, hotelTravelIndex + 1).filter(isAdminExpense)
    : displayItems.filter(isAdminExpense);

  // Calculate totals for the specific range
  const totalAdminBudget = targetAdminItems.reduce((sum, item) => sum + item.budget_amount, 0);
  const totalAdminActual = targetAdminItems.reduce((sum, item) => sum + (item.actual_amount || 0), 0);
  const totalAdminVariance = totalAdminActual - totalAdminBudget;

  // Separate operating profit items for proper ordering
  const operatingProfitItem = processedBudgetData.find(item => 
    item.name.toLowerCase().includes('operating profit')
  );

  // Get the Total Gross Profit item
  const totalGrossProfitItem = processedBudgetData.find(item => 
    item.name === 'Gross Profit' || item.name.toLowerCase() === 'gross profit'
  );

  // Create a helper function to render a budget item row
  const renderBudgetItemRow = (item: BudgetItem, i: number | string, customClass: string = '') => {
    const actualAmount = item.actual_amount || 0;
    const variance = actualAmount - item.budget_amount;
    
    let rowClassName = customClass;
    let fontClass = '';
    
    const isGrossProfit = item.isGrossProfit || 
                         item.name.toLowerCase().includes('profit/(loss)');
    
    const isTurnover = item.name.toLowerCase() === 'turnover';
    
    if (item.isHighlighted) {
      rowClassName = 'bg-[#48495e]/90 text-white';
      fontClass = 'font-bold';
    } else if (isGrossProfit || isTurnover) {
      rowClassName = 'bg-purple-50/50';
    }
    
    fontClass = item.isHighlighted || isTurnover || isGrossProfit ? 'font-bold' : '';
    
    // Generate a unique key based on the item name and index
    const rowKey = typeof i === 'number' ? i : `${i}-${item.name.replace(/\s+/g, '-').toLowerCase()}`;
    
    return (
      <TableRow key={rowKey} className={rowClassName}>
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
                {/* Render all items except special items which we'll handle separately */}
                {displayItems.map((item, i) => {
                  // Skip Food and Beverage Gross Profit items as we'll render them separately
                  if (
                    item.name.toLowerCase().includes('food') && 
                    item.name.toLowerCase().includes('gross profit') ||
                    ((item.name.toLowerCase().includes('beverage') || 
                      item.name.toLowerCase().includes('drink')) && 
                     item.name.toLowerCase().includes('gross profit'))
                  ) {
                    return null;
                  }
                  
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
                  
                  return renderBudgetItemRow(item, i);
                })}
                
                {/* Food Gross Profit row */}
                {foodGrossProfitItem ? (
                  renderBudgetItemRow(foodGrossProfitItem, 'food-gp', 'bg-purple-50/50')
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-amber-600 bg-amber-50 font-semibold text-center">
                      Food Gross Profit data not available
                    </TableCell>
                  </TableRow>
                )}
                
                {/* Beverage Gross Profit row */}
                {beverageGrossProfitItem ? (
                  renderBudgetItemRow(beverageGrossProfitItem, 'bev-gp', 'bg-purple-50/50')
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-amber-600 bg-amber-50 font-semibold text-center">
                      Beverage Gross Profit data not available
                    </TableCell>
                  </TableRow>
                )}
                
                {/* Add Total Gross Profit row */}
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
                
                {/* Add Total Admin Expenses row before Operating Profit */}
                <TableRow className="bg-[#48495e]/90 text-white">
                  <TableCell className="font-bold">
                    Total Admin Expenses
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(totalAdminBudget)}
                  </TableCell>
                  <TableCell className="text-right">
                    {/* Percentage could be calculated if needed */}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(totalAdminActual)}
                  </TableCell>
                  <TableCell className={`text-right font-bold ${
                    totalAdminVariance > 0 ? 'text-green-200' : totalAdminVariance < 0 ? 'text-red-200' : ''
                  }`}>
                    {formatCurrency(totalAdminVariance)}
                  </TableCell>
                </TableRow>
                
                {/* Display Operating Profit row after Total Admin Expenses */}
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
