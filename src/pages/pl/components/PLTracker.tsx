
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/date-utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  tracking_type?: 'Discrete' | 'Pro-Rated';
}

interface PLTrackerProps {
  isLoading: boolean;
  processedBudgetData: BudgetItem[];
  currentMonthName: string;
  currentYear: number;
  onClose: () => void;
}

export function PLTracker({ 
  isLoading, 
  processedBudgetData, 
  currentMonthName, 
  currentYear,
  onClose
}: PLTrackerProps) {
  const [trackedBudgetData, setTrackedBudgetData] = useState<BudgetItem[]>([]);
  const [currentDate] = useState(new Date());
  const [daysInMonth, setDaysInMonth] = useState(0);
  const [dayOfMonth, setDayOfMonth] = useState(0);

  // Initialize tracking types for each budget item
  useEffect(() => {
    if (processedBudgetData.length > 0) {
      const trackedData = processedBudgetData.map(item => {
        // Set default tracking types based on item category
        let trackingType: 'Discrete' | 'Pro-Rated' = 'Discrete';
        
        // Examples of items that might be pro-rated
        const proRatedCategories = [
          'Marketing',
          'Bank charges',
          'Insurance',
          'Heat and power',
          'Telephone and internet',
          'Rates',
          'Rent',
          'Subscriptions'
        ];
        
        const proRatedNames = [
          'Marketing',
          'Bank charges',
          'Entertainment',
          'Insurance',
          'Heat and power',
          'Telephone and internet',
          'Rates',
          'Rent',
          'Subscriptions'
        ];
        
        if (
          proRatedCategories.includes(item.category) || 
          proRatedNames.some(name => item.name.includes(name))
        ) {
          trackingType = 'Pro-Rated';
        }
        
        return {
          ...item,
          tracking_type: trackingType
        };
      });
      
      setTrackedBudgetData(trackedData);
    }
  }, [processedBudgetData]);

  // Calculate days in month and current day of month
  useEffect(() => {
    const year = currentYear;
    const month = new Date(`${currentMonthName} 1, ${currentYear}`).getMonth();
    
    // Calculate days in the month
    const lastDay = new Date(year, month + 1, 0).getDate();
    setDaysInMonth(lastDay);
    
    // Get current day of month
    setDayOfMonth(Math.min(currentDate.getDate(), lastDay));
  }, [currentMonthName, currentYear, currentDate]);

  // Update tracking type for a specific item
  const updateTrackingType = (index: number, value: 'Discrete' | 'Pro-Rated') => {
    const updatedData = [...trackedBudgetData];
    updatedData[index] = {
      ...updatedData[index],
      tracking_type: value
    };
    setTrackedBudgetData(updatedData);
  };

  // Calculate pro-rated budget amount for a standard item
  const calculateProRatedBudget = (item: BudgetItem): number => {
    if (item.isHeader || item.tracking_type === 'Discrete') {
      return item.budget_amount;
    }
    
    // For pro-rated items, calculate based on the day of month
    return (item.budget_amount / daysInMonth) * dayOfMonth;
  };
  
  // Calculate pro-rated budget for summary items (Turnover, Cost of Sales, etc.)
  const calculateSummaryProRatedBudget = (item: BudgetItem): number => {
    // For header items or gross profit/operating profit calculations, we need to recalculate
    if (item.isHeader) {
      return 0;
    }
    
    // Check if this is a summary item that needs special handling
    const isTurnover = item.name.toLowerCase().includes('turnover') || 
                       item.name.toLowerCase() === 'turnover';
                       
    const isCostOfSales = item.name.toLowerCase().includes('cost of sales') &&
                         !item.name.toLowerCase().includes('food') &&
                         !item.name.toLowerCase().includes('beverage');
                         
    const isTotalAdmin = item.name.toLowerCase().includes('total admin');
    
    // If not a special summary item, use the standard calculation
    if (!isTurnover && !isCostOfSales && !isTotalAdmin) {
      return calculateProRatedBudget(item);
    }
    
    // For summary items, recalculate based on their components
    if (isTurnover) {
      // Sum all revenue items that have been pro-rated
      return trackedBudgetData
        .filter(i => i.name.toLowerCase().includes('revenue') || 
                   (i.name.toLowerCase().includes('turnover') && i.name.toLowerCase() !== 'turnover'))
        .reduce((sum, i) => sum + calculateProRatedBudget(i), 0);
    }
    
    if (isCostOfSales) {
      // Sum all cost of sales items that have been pro-rated
      return trackedBudgetData
        .filter(i => (i.name.toLowerCase().includes('cost of sales') || 
                     i.name.toLowerCase().includes('cos') ||
                     i.category.toLowerCase().includes('cost of sales')) &&
                     i.name !== item.name)
        .reduce((sum, i) => sum + calculateProRatedBudget(i), 0);
    }
    
    if (isTotalAdmin) {
      // Sum all expense items that have been pro-rated
      return trackedBudgetData
        .filter(i => !i.name.toLowerCase().includes('revenue') && 
                   !i.name.toLowerCase().includes('turnover') &&
                   !i.name.toLowerCase().includes('cost of sales') &&
                   !i.name.toLowerCase().includes('cos') &&
                   !i.name.toLowerCase().includes('gross profit') &&
                   !i.name.toLowerCase().includes('operating profit') &&
                   !i.isHeader &&
                   !i.name.toLowerCase().includes('total admin'))
        .reduce((sum, i) => sum + calculateProRatedBudget(i), 0);
    }
    
    return calculateProRatedBudget(item);
  };

  return (
    <Card className="shadow-md rounded-xl overflow-hidden">
      <CardHeader className="bg-white/40 border-b flex flex-row items-center justify-between">
        <CardTitle>P&L Tracker - {currentMonthName} {currentYear}</CardTitle>
        <div className="flex items-center gap-2">
          <div className="text-sm">Current Date: {currentDate.toLocaleDateString()}</div>
          <Button onClick={onClose} variant="outline">Close Tracker</Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : trackedBudgetData.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-purple-50">
                  <TableHead className="w-[250px]">Line Item</TableHead>
                  <TableHead>Discrete or Pro-Rated</TableHead>
                  <TableHead className="text-right">Budget</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead className="text-right">Pro-Rated Budget MTD</TableHead>
                  <TableHead className="text-right">Actual MTD</TableHead>
                  <TableHead className="text-right">Var MTD</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trackedBudgetData.map((item, i) => {
                  if (item.isHeader) {
                    // Handle section headers
                    return (
                      <TableRow key={i} className={'bg-[#48495e]/90 text-white'}>
                        <TableCell 
                          colSpan={7} 
                          className="font-bold text-sm tracking-wider py-2"
                        >
                          {item.name}
                        </TableCell>
                      </TableRow>
                    );
                  }
                  
                  // Use appropriate calculation method based on whether this is a summary item
                  const proRatedBudget = calculateSummaryProRatedBudget(item);
                  const actualAmount = item.actual_amount || 0;
                  const variance = actualAmount - proRatedBudget;
                  
                  // Determine if this is a percentage row (e.g., GP percentage)
                  const isPercentageRow = item.name.includes('%) ');
                  
                  // Determine styles based on item type
                  let rowClassName = '';
                  let fontClass = '';
                  
                  // Special styling for gross profit rows
                  const isGrossProfit = item.isGrossProfit || 
                                      item.name.toLowerCase().includes('gross profit') || 
                                      item.name.toLowerCase().includes('profit/(loss)');
                  
                  // Special handling for Operating Profit row
                  const isOperatingProfit = item.isOperatingProfit || 
                                          item.name.toLowerCase().includes('operating profit');
                  
                  // Add special handling for Turnover row
                  const isTurnover = item.name.toLowerCase().includes('turnover') || 
                                    item.name.toLowerCase() === 'turnover';
                  
                  // Apply styling based on row type
                  if (item.isHighlighted && !item.name.toLowerCase().includes('total admin')) {
                    rowClassName = 'bg-[#48495e]/90 text-white font-bold';
                  } else if ((isGrossProfit && !item.name.toLowerCase().includes('food gross profit') && !item.name.toLowerCase().includes('beverage gross profit')) || isTurnover) {
                    rowClassName = 'font-semibold bg-purple-50/50';
                  }
                  
                  fontClass = item.isHighlighted || item.name.toLowerCase().includes('total admin') || isTurnover || item.name.toLowerCase().includes('cost of sales') || (isGrossProfit && !item.name.toLowerCase().includes('food gross profit') && !item.name.toLowerCase().includes('beverage gross profit')) ? 'font-bold' : '';
                  
                  return (
                    <TableRow key={i} className={rowClassName}>
                      <TableCell className={fontClass}>
                        {item.name}
                      </TableCell>
                      <TableCell>
                        {!item.isHeader && !isGrossProfit && !isOperatingProfit && !isTurnover ? (
                          <Select
                            value={item.tracking_type}
                            onValueChange={(value) => updateTrackingType(i, value as 'Discrete' | 'Pro-Rated')}
                            disabled={item.isHeader || isGrossProfit || isOperatingProfit || isTurnover}
                          >
                            <SelectTrigger className="h-8 w-36">
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Discrete">Discrete</SelectItem>
                              <SelectItem value="Pro-Rated">Pro-Rated</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span>{item.isHeader || isGrossProfit || isOperatingProfit || isTurnover ? '' : item.tracking_type}</span>
                        )}
                      </TableCell>
                      <TableCell className={`text-right ${fontClass}`}>
                        {formatCurrency(item.budget_amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.budget_percentage !== undefined ? `${(item.budget_percentage * 100).toFixed(2)}%` : ''}
                      </TableCell>
                      <TableCell className={`text-right ${fontClass}`}>
                        {formatCurrency(proRatedBudget)}
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
