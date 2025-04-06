import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { formatCurrency } from '@/lib/date-utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { fetchBudgetItemTracking, upsertBudgetItemTracking } from '@/services/kitchen-service';
import { supabase } from '@/lib/supabase';
import { BudgetItem } from '@/utils/budget/types';

interface PLTrackerBudgetItem {
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
  processedBudgetData: PLTrackerBudgetItem[];
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
  const [currentDate] = useState(new Date());
  const [daysInMonth, setDaysInMonth] = useState(0);
  const [dayOfMonth, setDayOfMonth] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const loadTrackingSettings = async (items: PLTrackerBudgetItem[]) => {
    try {
      const itemIds = items.filter(item => item.id).map(item => item.id);
      
      if (itemIds.length === 0) return items;
      
      const trackingData = await fetchBudgetItemTracking(itemIds as string[]);
      
      if (trackingData && trackingData.length > 0) {
        const trackingMap = trackingData.reduce((acc, curr) => {
          acc[curr.budget_item_id] = curr.tracking_type;
          return acc;
        }, {} as Record<string, string>);
        
        return items.map(item => {
          if (item.id && trackingMap[item.id]) {
            return {
              ...item,
              tracking_type: trackingMap[item.id] as 'Discrete' | 'Pro-Rated'
            };
          }
          return item;
        });
      }
      
      return items;
    } catch (error) {
      console.error('Error in loadTrackingSettings:', error);
      return items;
    }
  };

  useEffect(() => {
    if (processedBudgetData.length > 0) {
      const initializeData = async () => {
        let trackedData = processedBudgetData.map(item => {
          let trackingType: 'Discrete' | 'Pro-Rated' = 'Discrete';
          
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
            tracking_type: item.tracking_type || trackingType
          };
        });
        
        trackedData = await loadTrackingSettings(trackedData);
        
        setTrackedBudgetData(trackedData);
        setHasUnsavedChanges(false);
      };
      
      initializeData();
    }
  }, [processedBudgetData]);

  useEffect(() => {
    const year = currentYear;
    const month = new Date(`${currentMonthName} 1, ${currentYear}`).getMonth();
    
    const lastDay = new Date(year, month + 1, 0).getDate();
    setDaysInMonth(lastDay);
    
    setDayOfMonth(Math.min(currentDate.getDate(), lastDay));
  }, [currentMonthName, currentYear, currentDate]);

  const updateTrackingType = (index: number, value: 'Discrete' | 'Pro-Rated') => {
    const updatedData = [...trackedBudgetData];
    updatedData[index] = {
      ...updatedData[index],
      tracking_type: value
    };
    setTrackedBudgetData(updatedData);
    setHasUnsavedChanges(true);
  };

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

  const saveTrackingSettings = async () => {
    if (!hasUnsavedChanges) return;
    
    setIsSaving(true);
    
    try {
      const itemsWithId = trackedBudgetData.filter(item => item.id);
      
      const trackingUpserts = itemsWithId
        .filter(item => item.tracking_type)
        .map(item => ({
          budget_item_id: item.id as string,
          tracking_type: item.tracking_type as 'Discrete' | 'Pro-Rated'
        }));
      
      if (trackingUpserts.length > 0) {
        await upsertBudgetItemTracking(trackingUpserts);
      }
      
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
        title: "Settings saved",
        description: "Your tracking settings and forecast amounts have been saved.",
      });
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error in saveTrackingSettings:', error);
      toast({
        title: "Error saving settings",
        description: "An unexpected error occurred while saving settings.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const calculateProRatedBudget = (item: PLTrackerBudgetItem): number => {
    if (item.isHeader || item.tracking_type === 'Discrete') {
      return item.budget_amount;
    }
    
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

  const shouldShowTrackingType = (item: PLTrackerBudgetItem): boolean => {
    const isSummaryItem = 
      item.isHeader || 
      item.isGrossProfit || 
      item.isOperatingProfit || 
      item.name.toLowerCase().includes('turnover') || 
      item.name.toLowerCase() === 'turnover';
    
    return !isSummaryItem;
  };

  return (
    <Card className="shadow-md rounded-xl overflow-hidden">
      <CardHeader className="bg-white/40 border-b flex flex-row items-center justify-between">
        <CardTitle>P&L Tracker - {currentMonthName} {currentYear}</CardTitle>
        <div className="flex items-center gap-2">
          <div className="text-sm">Current Date: {currentDate.toLocaleDateString()}</div>
          <Button 
            onClick={saveTrackingSettings} 
            variant="outline" 
            disabled={!hasUnsavedChanges || isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
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
                  <TableHead className="text-right">Forecast</TableHead>
                  <TableHead className="text-right">Var MTD</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trackedBudgetData.map((item, i) => {
                  if (item.isHeader) {
                    return (
                      <TableRow key={i} className={'bg-[#48495e]/90 text-white'}>
                        <TableCell 
                          colSpan={8} 
                          className="font-bold text-sm tracking-wider py-2"
                        >
                          {item.name}
                        </TableCell>
                      </TableRow>
                    );
                  }
                  
                  const proRatedBudget = calculateSummaryProRatedBudget(item);
                  const actualAmount = item.actual_amount || 0;
                  const variance = actualAmount - proRatedBudget;
                  
                  const isPercentageRow = item.name.includes('%) ');
                  
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
                  
                  return (
                    <TableRow key={i} className={rowClassName}>
                      <TableCell className={fontClass}>
                        {item.name}
                      </TableCell>
                      <TableCell>
                        {shouldShowTrackingType(item) ? (
                          <Select
                            value={item.tracking_type}
                            onValueChange={(value) => updateTrackingType(i, value as 'Discrete' | 'Pro-Rated')}
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
                          <span></span>
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
