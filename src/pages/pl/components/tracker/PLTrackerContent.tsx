
import React, { useState } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PLTrackerBudgetItem, DayInput } from '../types/PLTrackerTypes';
import { formatCurrency } from '@/lib/date-utils';
import { TrackerSummaryRows } from '../TrackerSummaryRows';
import { calculateProRatedActual } from './TrackerCalculations';
import { DailyInputDrawer } from './DailyInputDrawer';

interface PLTrackerContentProps {
  isLoading: boolean;
  filteredBudgetData: PLTrackerBudgetItem[];
  trackedBudgetData: PLTrackerBudgetItem[];
  dayOfMonth: number;
  daysInMonth: number;
  updateManualActualAmount: (index: number, value: string) => void;
  updateForecastAmount: (index: number, value: string) => void;
  updateDailyValues: (index: number, day: number, value: string) => void;
  getActualAmount: (item: PLTrackerBudgetItem) => number;
  calculateProRatedBudget: (item: PLTrackerBudgetItem) => number;
  currentMonthName: string;
  currentYear: number;
}

export function PLTrackerContent({
  isLoading,
  filteredBudgetData,
  trackedBudgetData,
  dayOfMonth,
  daysInMonth,
  updateManualActualAmount,
  updateForecastAmount,
  updateDailyValues,
  getActualAmount,
  calculateProRatedBudget,
  currentMonthName,
  currentYear
}: PLTrackerContentProps) {
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [showDailyDrawer, setShowDailyDrawer] = useState(false);
  
  // Function to determine if an item should use pro-rated actuals
  const shouldUseProRatedActual = (item: PLTrackerBudgetItem): boolean => {
    if (item.isHeader || item.isGrossProfit || item.isOperatingProfit) {
      return false;
    }
    
    // Special items that should not use pro-rated amounts
    const specialItems = ['turnover', 'revenue', 'sales', 'cost of sales', 'cos', 
                        'gross profit', 'wages', 'salaries'];
                        
    // Check if the item name contains any of the special items
    const isSpecialItem = specialItems.some(term => 
      item.name.toLowerCase().includes(term)
    );
    
    // All regular expense items should use pro-rated budget
    return !isSpecialItem;
  };
  
  // Get the effective actual amount considering pro-rating for expense items
  const getEffectiveActualAmount = (item: PLTrackerBudgetItem): number => {
    // Check for manually entered actual or daily values first
    const manualActual = getActualAmount(item);
    
    // If there's a manual value or daily values, use that
    if (manualActual > 0) {
      return manualActual;
    }
    
    // For expense items, use pro-rated budget if no manual value exists
    if (shouldUseProRatedActual(item)) {
      return calculateProRatedActual(item, daysInMonth, dayOfMonth);
    }
    
    // For other items (revenue, COS, etc.), return the actual amount
    return manualActual;
  };

  if (isLoading) {
    return <div className="p-6 text-center">
      <p>Loading tracker data...</p>
    </div>;
  }
  
  // Handle the daily value updates from the drawer
  const handleDailyValueUpdate = (index: number, dailyValues: DayInput[]) => {
    // Calculate the sum of all daily values
    const total = dailyValues.reduce((sum, day) => sum + (Number(day.value) || 0), 0);
    
    // First update the manual actual amount
    updateManualActualAmount(index, total.toString());
    
    // Then update each day individually
    dailyValues.forEach(day => {
      if (day.value !== null) {
        updateDailyValues(index, day.day, day.value.toString());
      }
    });
    
    // Close the drawer
    setShowDailyDrawer(false);
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-gray-50 sticky top-0 z-10">
          <TableRow>
            <TableHead className="w-[250px]">Line Item</TableHead>
            <TableHead className="text-right">Budget</TableHead>
            <TableHead className="text-right">Budget %</TableHead>
            <TableHead className="text-right">
              Pro-Rated Budget <span className="text-xs text-gray-500">({dayOfMonth}/{daysInMonth})</span>
            </TableHead>
            <TableHead className="text-right">
              Actual MTD <span className="text-xs text-gray-500">({dayOfMonth}/{daysInMonth})</span>
            </TableHead>
            <TableHead className="text-right">Forecast</TableHead>
            <TableHead className="text-right">Variance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredBudgetData.map((item, index) => {
            const proRatedBudget = calculateProRatedBudget(item);
            const actualAmount = getEffectiveActualAmount(item);
            const forecastAmount = parseFloat(item.forecast_amount?.toString() || "0");
            const forecastVariance = forecastAmount - item.budget_amount;
            
            const turnoverItem = trackedBudgetData.find(i => i.name === 'Turnover' || i.name === 'Total Revenue');
            const turnoverBudget = turnoverItem ? turnoverItem.budget_amount || 0 : 0;
            
            let budgetPercentage = 0;
            if (!item.isHeader && turnoverBudget > 0) {
              budgetPercentage = (item.budget_amount / turnoverBudget) * 100;
            }
            
            return (
              <TableRow 
                key={index}
                className={`${item.isHeader ? 'bg-gray-100 font-bold text-[#48495e]' : ''} ${
                  item.isHighlighted ? 'bg-purple-50/50' : ''
                } ${
                  item.isGrossProfit ? 'bg-green-50/50 font-medium' : ''
                } ${
                  item.isOperatingProfit ? 'bg-[#8B5CF6]/10 font-medium' : ''
                }`}
              >
                <TableCell className={`${item.isHeader ? 'pl-2' : 'pl-4'} ${selectedItem === index ? 'bg-blue-50' : ''}`}>
                  {item.isHeader ? item.name : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-normal justify-start hover:bg-transparent hover:underline w-full text-left"
                      onClick={() => {
                        setSelectedItem(selectedItem === index ? null : index);
                        if (selectedItem !== index && shouldUseProRatedActual(item)) {
                          setShowDailyDrawer(true);
                        }
                      }}
                    >
                      {item.name}
                    </Button>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {item.isHeader ? '' : formatCurrency(item.budget_amount || 0)}
                </TableCell>
                <TableCell className="text-right">
                  {item.isHeader ? '' : budgetPercentage.toFixed(1) + '%'}
                </TableCell>
                <TableCell className="text-right">
                  {item.isHeader ? '' : formatCurrency(proRatedBudget)}
                </TableCell>
                <TableCell className={`text-right ${selectedItem === index ? 'bg-blue-50' : ''}`}>
                  {item.isHeader ? '' : (
                    selectedItem === index ? (
                      <Input 
                        type="number"
                        value={item.manually_entered_actual || ''}
                        onChange={(e) => updateManualActualAmount(index, e.target.value)}
                        className="h-8 text-right w-24 inline-block"
                      />
                    ) : (
                      formatCurrency(actualAmount)
                    )
                  )}
                </TableCell>
                <TableCell className={`text-right ${selectedItem === index ? 'bg-blue-50' : ''}`}>
                  {item.isHeader ? '' : (
                    selectedItem === index ? (
                      <Input 
                        type="number"
                        value={item.forecast_amount || ''}
                        onChange={(e) => updateForecastAmount(index, e.target.value)}
                        className="h-8 text-right w-24 inline-block"
                      />
                    ) : (
                      formatCurrency(forecastAmount)
                    )
                  )}
                </TableCell>
                <TableCell className={`text-right ${
                  forecastVariance > 0 ? 'text-green-600' : forecastVariance < 0 ? 'text-red-600' : ''
                }`}>
                  {item.isHeader ? '' : formatCurrency(forecastVariance)}
                </TableCell>
              </TableRow>
            );
          })}
          
          <TrackerSummaryRows
            trackedBudgetData={trackedBudgetData}
            dayOfMonth={dayOfMonth}
            daysInMonth={daysInMonth}
            getActualAmount={getEffectiveActualAmount}
            calculateProRatedBudget={calculateProRatedBudget}
            updateForecastAmount={(index, value) => updateForecastAmount(index, value)}
          />
        </TableBody>
      </Table>
      
      {selectedItem !== null && filteredBudgetData[selectedItem] && (
        <DailyInputDrawer
          isOpen={showDailyDrawer}
          onClose={() => setShowDailyDrawer(false)}
          onSave={(dailyValues) => handleDailyValueUpdate(selectedItem, dailyValues)}
          initialValues={filteredBudgetData[selectedItem].daily_values || []}
          itemName={filteredBudgetData[selectedItem].name}
          monthName={currentMonthName}
          year={currentYear}
          budgetItemId={filteredBudgetData[selectedItem].id}
        />
      )}
    </div>
  );
}
