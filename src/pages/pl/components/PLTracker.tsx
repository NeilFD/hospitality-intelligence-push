import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableStickyHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Save, Cog } from 'lucide-react';
import { formatCurrency } from '@/lib/date-utils';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { ProcessedBudgetItem } from '../hooks/useBudgetData';
import { PLTrackerSettings } from './PLTrackerSettings';

interface PLTrackerBudgetItem extends ProcessedBudgetItem {
  tracking_type: 'Discrete' | 'Pro-Rated';
  manually_entered_actual?: number;
}

interface PLTrackerProps {
  isLoading: boolean;
  processedBudgetData: ProcessedBudgetItem[];
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
  const [trackedBudgetData, setTrackedBudgetData] = useState<PLTrackerBudgetItem[]>([]);
  const [yesterdayDate, setYesterdayDate] = useState(new Date());
  const [daysInMonth, setDaysInMonth] = useState(0);
  const [dayOfMonth, setDayOfMonth] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (processedBudgetData.length > 0) {
      setTrackedBudgetData(prevData => {
        if (prevData.length > 0) {
          const trackingTypeMap = new Map<string, 'Discrete' | 'Pro-Rated'>();
          const manualActualsMap = new Map<string, number | undefined>();
          
          prevData.forEach(item => {
            if (item.id) {
              trackingTypeMap.set(item.id, item.tracking_type);
              manualActualsMap.set(item.id, item.manually_entered_actual);
            }
          });
          
          return processedBudgetData.map(item => ({
            ...item,
            tracking_type: (item.id && trackingTypeMap.has(item.id))
              ? trackingTypeMap.get(item.id)!
              : 'Pro-Rated', // Default to Pro-Rated for all items
            manually_entered_actual: (item.id && manualActualsMap.has(item.id))
              ? manualActualsMap.get(item.id)
              : undefined
          }));
        }
        
        return processedBudgetData.map(item => ({
          ...item,
          tracking_type: 'Pro-Rated' // Default to Pro-Rated for all items
        }));
      });
      setHasUnsavedChanges(false);
    }
  }, [processedBudgetData]);

  useEffect(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    setYesterdayDate(yesterday);
    
    const year = currentYear;
    const month = new Date(`${currentMonthName} 1, ${currentYear}`).getMonth();
    
    const lastDay = new Date(year, month + 1, 0).getDate();
    setDaysInMonth(lastDay);
    
    setDayOfMonth(Math.min(yesterday.getDate(), lastDay));
  }, [currentMonthName, currentYear]);

  const updateForecastAmount = (index: number, value: string) => {
    const numericValue = value === '' ? undefined : parseFloat(value);
    
    const updatedData = [...trackedBudgetData];
    updatedData[index] = {
      ...updatedData[index],
      forecast_amount: numericValue
    };
    setTrackedBudgetData(updatedData);
    setHasUnsavedChanges(true);
  };

  const updateManualActualAmount = (index: number, value: string) => {
    const numericValue = value === '' ? undefined : parseFloat(value);
    
    const updatedData = [...trackedBudgetData];
    updatedData[index] = {
      ...updatedData[index],
      manually_entered_actual: numericValue
    };
    setTrackedBudgetData(updatedData);
    setHasUnsavedChanges(true);
  };

  const saveForecastAmounts = async () => {
    if (!hasUnsavedChanges) return;
    
    setIsSaving(true);
    
    try {
      const itemsWithId = trackedBudgetData.filter(item => item.id);
      
      const forecastUpdates = itemsWithId
        .filter(item => item.forecast_amount !== undefined)
        .map(item => ({
          id: item.id,
          forecast_amount: item.forecast_amount
        }));
      
      if (forecastUpdates.length > 0) {
        for (const update of forecastUpdates) {
          if (update.id) {
            await supabase
              .from('budget_items')
              .update({ forecast_amount: update.forecast_amount })
              .eq('id', update.id);
          }
        }
      }
      
      toast({
        title: "Forecast amounts saved",
        description: "Your forecast amounts have been saved.",
      });
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error in saveForecastAmounts:', error);
      toast({
        title: "Error saving forecast",
        description: "An unexpected error occurred while saving forecast amounts.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSettingsSaved = (updatedItems: PLTrackerBudgetItem[]) => {
    setTrackedBudgetData(updatedItems);
    setShowSettings(false);
  };

  const calculateProRatedBudget = (item: PLTrackerBudgetItem): number => {
    return (item.budget_amount / daysInMonth) * dayOfMonth;
  };
  
  const calculateSummaryProRatedBudget = (item: PLTrackerBudgetItem): number => {
    if (item.isHeader) {
      return 0;
    }
    
    const isTurnover = item.name.toLowerCase().includes('turnover') || 
                       item.name.toLowerCase() === 'turnover';
                       
    const isCostOfSales = item.name.toLowerCase().includes('cost of sales') &&
                         !item.name.toLowerCase().includes('food') &&
                         !item.name.toLowerCase().includes('beverage');
                         
    const isTotalAdmin = item.name.toLowerCase().includes('total admin');
    
    const isOperatingProfit = item.name.toLowerCase().includes('operating profit');
    
    if (!isTurnover && !isCostOfSales && !isTotalAdmin && !isOperatingProfit) {
      return calculateProRatedBudget(item);
    }
    
    if (isTurnover) {
      return trackedBudgetData
        .filter(i => i.name.toLowerCase().includes('revenue') || 
                   (i.name.toLowerCase().includes('turnover') && i.name.toLowerCase() !== 'turnover'))
        .reduce((sum, i) => sum + calculateProRatedBudget(i), 0);
    }
    
    if (isCostOfSales) {
      return trackedBudgetData
        .filter(i => (i.name.toLowerCase().includes('cost of sales') || 
                     i.name.toLowerCase().includes('cos') ||
                     i.category.toLowerCase().includes('cost of sales')) &&
                     i.name !== item.name)
        .reduce((sum, i) => sum + calculateProRatedBudget(i), 0);
    }
    
    if (isTotalAdmin) {
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
    
    if (isOperatingProfit) {
      const grossProfitItem = trackedBudgetData.find(i => 
        i.name.toLowerCase() === 'total gross profit' || 
        (i.name.toLowerCase() === 'gross profit' && 
         !i.name.toLowerCase().includes('food') && 
         !i.name.toLowerCase().includes('beverage'))
      );
      
      const totalAdminItem = trackedBudgetData.find(i => 
        i.name.toLowerCase().includes('total admin')
      );
      
      const grossProfit = grossProfitItem 
        ? calculateSummaryProRatedBudget(grossProfitItem)
        : 0;
        
      const totalAdmin = totalAdminItem 
        ? calculateSummaryProRatedBudget(totalAdminItem) 
        : 0;
        
      return grossProfit - totalAdmin;
    }
    
    return calculateProRatedBudget(item);
  };

  const calculateAdminExpenses = () => {
    const wagesIndex = trackedBudgetData.findIndex(item => 
      item.name.toLowerCase().includes('wages and salaries'));
      
    const hotelTravelIndex = trackedBudgetData.findIndex(item => 
      item.name.toLowerCase().includes('hotel and travel'));
    
    if (wagesIndex !== -1 && hotelTravelIndex !== -1 && wagesIndex < hotelTravelIndex) {
      return trackedBudgetData.slice(wagesIndex, hotelTravelIndex + 1)
        .reduce((sum, item) => {
          if (!item.isHeader && item.budget_amount) {
            return sum + calculateProRatedBudget(item);
          }
          return sum;
        }, 0);
    }
    
    return trackedBudgetData
      .filter(item => 
        !item.isHeader && 
        !item.name.toLowerCase().includes('turnover') && 
        !item.name.toLowerCase().includes('revenue') &&
        !item.name.toLowerCase().includes('cost of sales') &&
        !item.name.toLowerCase().includes('gross profit')
      )
      .reduce((sum, item) => sum + calculateProRatedBudget(item), 0);
  };
  
  const calculateOperatingProfit = () => {
    const grossProfitItem = trackedBudgetData.find(item => 
      item.isHighlighted && item.name.toLowerCase().includes('gross profit'));
    
    if (grossProfitItem) {
      const grossProfit = calculateProRatedBudget(grossProfitItem);
      const adminExpenses = calculateAdminExpenses();
      return grossProfit - adminExpenses;
    }
    
    return 0;
  };

  const getActualAmount = (item: PLTrackerBudgetItem): number => {
    if (item.tracking_type === 'Pro-Rated') {
      return calculateProRatedBudget(item);
    } else {
      return item.manually_entered_actual || 0;
    }
  };

  const filterDuplicateTotalAdminRows = (items: PLTrackerBudgetItem[]) => {
    const totalAdminIndices = items
      .map((item, index) => item.name === 'Total Admin expenses' ? index : -1)
      .filter(index => index !== -1);
    
    if (totalAdminIndices.length > 1) {
      const indicesToRemove = totalAdminIndices.slice(0, totalAdminIndices.length - 1);
      return items.filter((_, index) => !indicesToRemove.includes(index));
    }
    
    return items;
  };

  const filterOutTotalAdminExpenses = (items: PLTrackerBudgetItem[]) => {
    return items.filter(item => item.name !== 'Total Admin expenses');
  };

  const filteredBudgetData = filterOutTotalAdminExpenses(trackedBudgetData);

  if (showSettings) {
    return (
      <PLTrackerSettings
        isLoading={isLoading}
        processedBudgetData={trackedBudgetData}
        currentMonthName={currentMonthName}
        currentYear={currentYear}
        onBackToTracker={() => setShowSettings(false)}
        onSettingsSaved={handleSettingsSaved}
      />
    );
  }

  return (
    <Card className="shadow-md rounded-xl overflow-hidden">
      <CardHeader className="bg-white/40 border-b flex flex-row items-center justify-between">
        <CardTitle>P&L Tracker - {currentMonthName} {currentYear}</CardTitle>
        <div className="flex items-center gap-2">
          <div className="text-sm">Data through: {yesterdayDate.toLocaleDateString()} (Day {dayOfMonth} of {daysInMonth})</div>
          <Button 
            onClick={() => setShowSettings(true)} 
            variant="outline" 
            className="flex items-center gap-2"
          >
            <Cog size={16} />
            Line Item Settings
          </Button>
          <Button 
            onClick={saveForecastAmounts} 
            variant="outline" 
            disabled={!hasUnsavedChanges || isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {isSaving ? "Saving..." : "Save Forecasts"}
          </Button>
          <Button onClick={onClose} variant="outline">Close Tracker</Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : filteredBudgetData.length > 0 ? (
          <div className="overflow-x-auto max-h-[calc(100vh-200px)]">
            <Table>
              <TableStickyHeader>
                <TableRow className="bg-purple-50">
                  <TableHead className="w-[250px]">Line Item</TableHead>
                  <TableHead className="text-right">Budget</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead className="text-right">Pro-Rated Budget MTD</TableHead>
                  <TableHead className="text-right">Actual MTD</TableHead>
                  <TableHead className="text-right">Forecast</TableHead>
                  <TableHead className="text-right">Var MTD</TableHead>
                </TableRow>
              </TableStickyHeader>
              <TableBody>
                {filteredBudgetData.map((item, i) => {
                  if (item.isHeader) {
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
                  
                  const proRatedBudget = calculateSummaryProRatedBudget(item);
                  const actualAmount = getActualAmount(item);
                  const variance = actualAmount - proRatedBudget;
                  
                  let rowClassName = '';
                  let fontClass = '';
                  
                  const isGrossProfit = item.isGrossProfit || 
                                      item.name.toLowerCase().includes('gross profit') || 
                                      item.name.toLowerCase().includes('profit/(loss)');
                  
                  const isOperatingProfit = item.isOperatingProfit || 
                                          item.name.toLowerCase().includes('operating profit');
                  
                  const isTurnover = item.name.toLowerCase().includes('turnover') || 
                                    item.name.toLowerCase() === 'turnover';
                  
                  if (item.isHighlighted && !item.name.toLowerCase().includes('total admin')) {
                    rowClassName = 'bg-[#48495e]/90 text-white font-bold';
                  } else if ((isGrossProfit && !item.name.toLowerCase().includes('food gross profit') && !item.name.toLowerCase().includes('beverage gross profit')) || isTurnover) {
                    rowClassName = 'font-semibold bg-purple-50/50';
                  }
                  
                  fontClass = item.isHighlighted || item.name.toLowerCase().includes('total admin') || isTurnover || item.name.toLowerCase().includes('cost of sales') || (isGrossProfit && !item.name.toLowerCase().includes('food gross profit') && !item.name.toLowerCase().includes('beverage gross profit')) ? 'font-bold' : '';
                  
                  if (isOperatingProfit && !item.isHighlighted) {
                    return null;
                  }
                  
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
                        {formatCurrency(proRatedBudget)}
                      </TableCell>
                      <TableCell className={`text-right ${fontClass}`}>
                        {item.tracking_type === 'Discrete' ? (
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.manually_entered_actual !== undefined ? item.manually_entered_actual : ''}
                            onChange={(e) => updateManualActualAmount(i, e.target.value)}
                            className="h-8 w-24 text-right"
                          />
                        ) : (
                          formatCurrency(actualAmount)
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.forecast_amount !== undefined ? item.forecast_amount : ''}
                          onChange={(e) => updateForecastAmount(i, e.target.value)}
                          className="h-8 w-24 text-right"
                        />
                      </TableCell>
                      <TableCell className={`text-right ${fontClass} ${
                        variance > 0 ? 'text-green-600' : variance < 0 ? 'text-red-600' : ''
                      }`}>
                        {formatCurrency(variance)}
                      </TableCell>
                    </TableRow>
                  );
                })}
                
                {(() => {
                  const adminExpenses = calculateAdminExpenses();
                  const adminActualAmount = trackedBudgetData
                    .filter(item => 
                      !item.isHeader && 
                      (item.name.toLowerCase().includes('wages') || 
                      item.name.toLowerCase().includes('salary') || 
                      item.name.toLowerCase().includes('admin') ||
                      item.name.toLowerCase().includes('marketing') ||
                      item.name.toLowerCase().includes('hotel'))
                    )
                    .reduce((sum, item) => sum + getActualAmount(item), 0);
                    
                  const adminVariance = adminActualAmount - adminExpenses;
                  
                  return (
                    <TableRow className="bg-purple-100/50 text-[#48495e]">
                      <TableCell className="font-bold">
                        ADMIN EXPENSES
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(adminExpenses * daysInMonth / dayOfMonth)}
                      </TableCell>
                      <TableCell className="text-right">
                        {/* Percentage can be added here if needed */}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(adminExpenses)}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(adminActualAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {/* Forecast can be added here if needed */}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${
                        adminVariance > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(adminVariance)}
                      </TableCell>
                    </TableRow>
                  );
                })()}
                
                {(() => {
                  const operatingProfit = calculateOperatingProfit();
                  
                  const grossProfitItem = trackedBudgetData.find(item => 
                    item.isHighlighted && item.name.toLowerCase().includes('gross profit'));
                    
                  const grossProfitActual = grossProfitItem ? getActualAmount(grossProfitItem) : 0;
                  
                  const adminActual = trackedBudgetData
                    .filter(item => 
                      !item.isHeader && 
                      (item.name.toLowerCase().includes('wages') || 
                      item.name.toLowerCase().includes('salary') || 
                      item.name.toLowerCase().includes('admin') ||
                      item.name.toLowerCase().includes('marketing') ||
                      item.name.toLowerCase().includes('hotel'))
                    )
                    .reduce((sum, item) => sum + getActualAmount(item), 0);
                    
                  const actualOperatingProfit = grossProfitActual - adminActual;
                  const opVariance = actualOperatingProfit - operatingProfit;
                  
                  return (
                    <TableRow className="bg-[#8B5CF6]/90 text-white">
                      <TableCell className="font-bold">
                        Operating profit
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(operatingProfit * daysInMonth / dayOfMonth)}
                      </TableCell>
                      <TableCell className="text-right">
                        {/* Percentage can be added here if needed */}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(operatingProfit)}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(actualOperatingProfit)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={trackedBudgetData.find(i => i.name.toLowerCase().includes('operating profit') && i.isHighlighted)?.forecast_amount !== undefined 
                            ? trackedBudgetData.find(i => i.name.toLowerCase().includes('operating profit') && i.isHighlighted)?.forecast_amount 
                            : ''}
                          onChange={(e) => {
                            const opIndex = trackedBudgetData.findIndex(i => i.name.toLowerCase().includes('operating profit') && i.isHighlighted);
                            if (opIndex >= 0) {
                              updateForecastAmount(opIndex, e.target.value);
                            }
                          }}
                          className="h-8 w-24 text-right"
                        />
                      </TableCell>
                      <TableCell className={`text-right font-bold ${
                        opVariance > 0 ? 'text-green-200' : 'text-red-300'
                      }`}>
                        {formatCurrency(opVariance)}
                      </TableCell>
                    </TableRow>
                  );
                })()}
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
