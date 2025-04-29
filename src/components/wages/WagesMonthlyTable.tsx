
import React, { useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { useWagesStore } from './WagesStore';
import { formatCurrency, getDayNameFromNumber } from '@/lib/date-utils';
import { toast } from "sonner";
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { fetchMasterRecordsByMonth, fetchMasterDailyRecord } from '@/services/master-record-service';

export function WagesMonthlyTable({ year, month }: { year: number, month: number }) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [monthlyData, setMonthlyData] = React.useState<any[]>([]);
  const [inputValues, setInputValues] = React.useState<Record<string, Record<string, string>>>({});
  const [dirtyInputs, setDirtyInputs] = React.useState<Record<string, Set<string>>>({});
  const [saveTimeout, setSaveTimeout] = React.useState<NodeJS.Timeout | null>(null);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const { getMonthlyWages, setDailyWages, clearCache, needsRefresh, refreshAnalysis } = useWagesStore();
  
  const loadWagesData = useCallback(async () => {
    setIsLoading(true);
    setSaveError(null);
    try {
      // Clear cache to ensure we get fresh data
      clearCache();
      
      // Fetch wages data
      console.log(`Fetching wages data for year=${year}, month=${month}`);
      const wagesData = await getMonthlyWages(year, month);
      
      // Explicitly fetch the master records for the month to ensure we have the latest data
      console.log(`Fetching master records for year=${year}, month=${month}`);
      const masterRecords = await fetchMasterRecordsByMonth(year, month);
      
      // Create a lookup map for easier access
      const masterRecordsByDate: Record<string, { foodRevenue: number; beverageRevenue: number }> = {};
      
      masterRecords.forEach(record => {
        const dateStr = record.date;
        console.log(`Master record found for ${dateStr}: Food=${record.foodRevenue}, Bev=${record.beverageRevenue}`);
        masterRecordsByDate[dateStr] = {
          foodRevenue: record.foodRevenue || 0,
          beverageRevenue: record.beverageRevenue || 0
        };
      });
      
      // Update wages data with revenue from master records
      const updatedWagesData = await Promise.all(wagesData.map(async (day) => {
        // Format the date string in YYYY-MM-DD format for lookups
        const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.day.toString().padStart(2, '0')}`;
        console.log(`Looking up master record for ${dateStr}`);
        
        let masterRecord = masterRecordsByDate[dateStr];
        
        // If no master record was found in the batch fetch, try fetching it individually
        if (!masterRecord || (masterRecord.foodRevenue === 0 && masterRecord.beverageRevenue === 0)) {
          console.log(`No master record found in batch fetch for ${dateStr}, trying individual fetch`);
          try {
            const individualRecord = await fetchMasterDailyRecord(dateStr);
            if (individualRecord) {
              console.log(`Individual fetch successful for ${dateStr}: Food=${individualRecord.foodRevenue}, Bev=${individualRecord.beverageRevenue}`);
              masterRecord = {
                foodRevenue: individualRecord.foodRevenue || 0,
                beverageRevenue: individualRecord.beverageRevenue || 0
              };
            }
          } catch (error) {
            console.error(`Error fetching individual master record for ${dateStr}:`, error);
          }
        }
        
        if (masterRecord) {
          console.log(`Found master record for ${dateStr}: updating with food=${masterRecord.foodRevenue}, bev=${masterRecord.beverageRevenue}`);
          return {
            ...day,
            foodRevenue: masterRecord.foodRevenue,
            bevRevenue: masterRecord.beverageRevenue
          };
        }
        
        return day;
      }));
      
      console.log('Setting monthly data with updated values:', updatedWagesData);
      setMonthlyData(updatedWagesData);
      
      // Initialize input values
      const initialInputValues: Record<string, Record<string, string>> = {};
      updatedWagesData.forEach(day => {
        initialInputValues[day.day] = {
          fohWages: day.fohWages !== undefined && day.fohWages !== null ? day.fohWages.toString() : '',
          kitchenWages: day.kitchenWages !== undefined && day.kitchenWages !== null ? day.kitchenWages.toString() : ''
        };
      });
      
      console.log('Setting initial input values:', initialInputValues);
      setInputValues(initialInputValues);
      
      // Reset dirty inputs
      setDirtyInputs({});
      
    } catch (error) {
      console.error('Error fetching wages data:', error);
      toast.error('Failed to load wages data');
    } finally {
      setIsLoading(false);
    }
  }, [year, month, getMonthlyWages, clearCache]);
  
  useEffect(() => {
    console.log("COMPONENT MOUNTED OR YEAR/MONTH CHANGED - LOADING FRESH DATA");
    loadWagesData();
  }, [loadWagesData]);
  
  // Handle controlled input changes
  const handleInputChange = (day: number, field: string, value: string) => {
    if (field === 'foodRevenue' || field === 'bevRevenue') {
      toast.info('Revenue data can only be changed in the Master Input module');
      return;
    }
    
    // Update local state immediately for responsive UI
    setInputValues(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
    
    // Mark this field as dirty
    setDirtyInputs(prev => {
      const newDirty = { ...prev };
      if (!newDirty[day]) {
        newDirty[day] = new Set();
      }
      newDirty[day].add(field);
      return newDirty;
    });
    
    // Clear any existing timeout and error message
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    setSaveError(null);
    
    // Set a new timeout to save after user stops typing
    const newTimeout = setTimeout(() => {
      saveData(day, field, value);
    }, 500); // Reduce to 500ms for faster response
    
    setSaveTimeout(newTimeout);
  };
  
  // Function to save data after delay
  const saveData = async (day: number, field: string, value: string) => {
    try {
      console.log(`SAVING ${field} VALUE FOR DAY ${day}: ${value}`);
      
      // Parse value properly
      const numValue = parseFloat(value) || 0;
      
      // Get current day data
      const dateObj = new Date(year, month - 1, day);
      const dayOfWeek = dateObj.getDay();
      const adjustedDayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      
      const currentDay = monthlyData.find(d => d.day === day) || {
        year, month, day,
        date: new Date(year, month - 1, day).toISOString().split('T')[0],
        dayOfWeek: getDayNameFromNumber(adjustedDayIndex),
        fohWages: 0,
        kitchenWages: 0,
        foodRevenue: 0,
        bevRevenue: 0
      };
      
      const updatedDay = {
        ...currentDay,
        [field]: numValue
      };
      
      console.log(`SAVING DATA FOR DAY ${day}:`, updatedDay);
      
      // Save immediately to database - no more delays
      try {
        setSaveError(null);
        await setDailyWages(updatedDay);
        
        // Update UI with saved data
        setMonthlyData(prevData => 
          prevData.map(d => d.day === day ? updatedDay : d)
        );
        
        // Clear this field from dirty state
        setDirtyInputs(prev => {
          const newDirty = { ...prev };
          if (newDirty[day]) {
            newDirty[day].delete(field);
            if (newDirty[day].size === 0) {
              delete newDirty[day];
            }
          }
          return newDirty;
        });
        
        toast.success('Data saved successfully');
      } catch (saveError: any) {
        console.error('ERROR SAVING DATA:', saveError);
        setSaveError(`Failed to save data: ${saveError.message || 'Unknown error'}`);
        toast.error('Failed to save data');
      }
      
    } catch (error: any) {
      console.error('FAILED TO SAVE DATA:', error);
      setSaveError(`Failed to save data: ${error.message || 'Unknown error'}`);
      toast.error('Failed to save data');
    }
  };

  // Handle refresh of the materialized view
  const handleRefreshAnalysis = async () => {
    setIsRefreshing(true);
    try {
      const success = await refreshAnalysis();
      if (success) {
        toast.success('Financial performance analysis has been refreshed');
      } else {
        toast.error('Failed to refresh financial performance analysis');
      }
    } catch (error) {
      console.error('Error refreshing analysis:', error);
      toast.error('An error occurred while refreshing the analysis');
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Add a manual refresh function
  const handleManualRefresh = () => {
    console.log("MANUALLY REFRESHING DATA");
    loadWagesData();
    toast.info('Refreshing wage data from database');
  };
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);
  
  const totals = monthlyData.reduce((acc, day) => {
    acc.fohWages += day.fohWages;
    acc.kitchenWages += day.kitchenWages;
    acc.totalWages += (day.fohWages + day.kitchenWages);
    acc.foodRevenue += day.foodRevenue;
    acc.bevRevenue += day.bevRevenue;
    acc.totalRevenue += (day.foodRevenue + day.bevRevenue);
    return acc;
  }, { 
    fohWages: 0, 
    kitchenWages: 0, 
    totalWages: 0,
    foodRevenue: 0, 
    bevRevenue: 0, 
    totalRevenue: 0 
  });
  
  const fohPercentage = totals.totalRevenue > 0 
    ? (totals.fohWages / totals.totalRevenue) * 100 
    : 0;
    
  const kitchenPercentage = totals.totalRevenue > 0 
    ? (totals.kitchenWages / totals.totalRevenue) * 100 
    : 0;
    
  const totalPercentage = totals.totalRevenue > 0 
    ? (totals.totalWages / totals.totalRevenue) * 100 
    : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Monthly Wages Tracker</CardTitle>
        <div className="flex items-center gap-4">
          {needsRefresh && (
            <div className="text-amber-600 text-sm font-medium">
              Analysis needs refresh
            </div>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleManualRefresh} 
            className="mr-2"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefreshAnalysis} 
            disabled={isRefreshing || !needsRefresh}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Analysis'}
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">
              Total Wages: {formatCurrency(totals.totalWages)} ({totalPercentage.toFixed(1)}%)
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {saveError && (
          <div className="bg-red-50 border border-red-200 p-3 mb-4 rounded-md flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-700">{saveError}</span>
          </div>
        )}
        
        {isLoading ? (
          <div className="py-10 text-center text-muted-foreground">Loading wages data...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Day & Date</TableHead>
                <TableHead className="text-right">FOH Wages</TableHead>
                <TableHead className="text-right">Kitchen Wages</TableHead>
                <TableHead className="text-right">Total Wages</TableHead>
                <TableHead className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    Food Revenue
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-gray-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Revenue data is synchronized from Master Input records</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableHead>
                <TableHead className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    Bev Revenue
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-gray-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Revenue data is synchronized from Master Input records</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableHead>
                <TableHead className="text-right">Total Revenue</TableHead>
                <TableHead className="text-right">FOH %</TableHead>
                <TableHead className="text-right">Kitchen %</TableHead>
                <TableHead className="text-right">Total %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyData.map((day) => {
                const dateObj = new Date(Date.UTC(year, month - 1, day.day));
                const jsDay = dateObj.getDay();
                const adjustedDayIndex = jsDay === 0 ? 6 : jsDay - 1;
                const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                const dayName = dayNames[adjustedDayIndex];
                const shortDayName = dayName.substring(0, 3);
                
                const totalDailyWages = day.fohWages + day.kitchenWages;
                const totalDailyRevenue = day.foodRevenue + day.bevRevenue;
                const fohPercent = totalDailyRevenue > 0 
                  ? (day.fohWages / totalDailyRevenue) * 100 
                  : 0;
                const kitchenPercent = totalDailyRevenue > 0 
                  ? (day.kitchenWages / totalDailyRevenue) * 100 
                  : 0;
                const totalPercent = totalDailyRevenue > 0 
                  ? (totalDailyWages / totalDailyRevenue) * 100 
                  : 0;
                
                // Check if these fields are dirty (being edited)
                const isDirtyFoh = dirtyInputs[day.day]?.has('fohWages');
                const isDirtyKitchen = dirtyInputs[day.day]?.has('kitchenWages');
                
                return (
                  <TableRow key={day.day}>
                    <TableCell className="font-medium">
                      {shortDayName}, {day.day}
                    </TableCell>
                    <TableCell className="text-right p-1">
                      <Input
                        type="number"
                        value={inputValues[day.day]?.fohWages || ''}
                        onChange={(e) => handleInputChange(day.day, 'fohWages', e.target.value)}
                        className={`w-24 ml-auto ${isDirtyFoh ? 'border-amber-400' : ''}`}
                        min={0}
                        step="0.01"
                        autoComplete="off"
                      />
                    </TableCell>
                    <TableCell className="text-right p-1">
                      <Input
                        type="number"
                        value={inputValues[day.day]?.kitchenWages || ''}
                        onChange={(e) => handleInputChange(day.day, 'kitchenWages', e.target.value)}
                        className={`w-24 ml-auto ${isDirtyKitchen ? 'border-amber-400' : ''}`}
                        min={0}
                        step="0.01"
                        autoComplete="off"
                      />
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(totalDailyWages)}</TableCell>
                    <TableCell className="text-right p-1">
                      <Input
                        type="number"
                        value={day.foodRevenue !== undefined ? day.foodRevenue : ''}
                        onChange={(e) => handleInputChange(day.day, 'foodRevenue', e.target.value)}
                        className="w-24 ml-auto bg-gray-50"
                        readOnly
                      />
                    </TableCell>
                    <TableCell className="text-right p-1">
                      <Input
                        type="number"
                        value={day.bevRevenue !== undefined ? day.bevRevenue : ''}
                        onChange={(e) => handleInputChange(day.day, 'bevRevenue', e.target.value)}
                        className="w-24 ml-auto bg-gray-50"
                        readOnly
                      />
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(totalDailyRevenue)}</TableCell>
                    <TableCell className={`text-right ${fohPercent > 20 ? 'text-red-500' : 'text-green-500'}`}>
                      {fohPercent.toFixed(1)}%
                    </TableCell>
                    <TableCell className={`text-right ${kitchenPercent > 20 ? 'text-red-500' : 'text-green-500'}`}>
                      {kitchenPercent.toFixed(1)}%
                    </TableCell>
                    <TableCell className={`text-right ${totalPercent > 35 ? 'text-red-500' : 'text-green-500'}`}>
                      {totalPercent.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow className="font-medium">
                <TableCell>MONTHLY TOTAL</TableCell>
                <TableCell className="text-right">{formatCurrency(totals.fohWages)}</TableCell>
                <TableCell className="text-right">{formatCurrency(totals.kitchenWages)}</TableCell>
                <TableCell className="text-right">{formatCurrency(totals.totalWages)}</TableCell>
                <TableCell className="text-right">{formatCurrency(totals.foodRevenue)}</TableCell>
                <TableCell className="text-right">{formatCurrency(totals.bevRevenue)}</TableCell>
                <TableCell className="text-right">{formatCurrency(totals.totalRevenue)}</TableCell>
                <TableCell className={`text-right ${fohPercentage > 20 ? 'text-red-500' : 'text-green-500'}`}>
                  {fohPercentage.toFixed(1)}%
                </TableCell>
                <TableCell className={`text-right ${kitchenPercentage > 20 ? 'text-red-500' : 'text-green-500'}`}>
                  {kitchenPercentage.toFixed(1)}%
                </TableCell>
                <TableCell className={`text-right ${totalPercentage > 35 ? 'text-red-500' : 'text-green-500'}`}>
                  {totalPercentage.toFixed(1)}%
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
