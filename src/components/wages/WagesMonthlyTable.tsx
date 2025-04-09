
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useWagesStore } from './WagesStore';
import { formatCurrency, getDayNameFromNumber } from '@/lib/date-utils';
import { toast } from "sonner";
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { fetchMasterRecordsByMonth } from '@/services/master-record-service';

export function WagesMonthlyTable({ year, month }: { year: number, month: number }) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [monthlyData, setMonthlyData] = React.useState<any[]>([]);
  const { getMonthlyWages, setDailyWages } = useWagesStore();
  
  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const wagesData = await getMonthlyWages(year, month);
        
        // Fetch master records to get revenue data
        const masterRecords = await fetchMasterRecordsByMonth(year, month);
        const masterRecordsByDate: Record<string, { foodRevenue: number; beverageRevenue: number }> = {};
        
        masterRecords.forEach(record => {
          masterRecordsByDate[record.date] = {
            foodRevenue: record.foodRevenue || 0,
            beverageRevenue: record.beverageRevenue || 0
          };
        });
        
        // Update wages data with master record revenue
        const updatedWagesData = wagesData.map(day => {
          const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.day.toString().padStart(2, '0')}`;
          const masterRecord = masterRecordsByDate[dateStr];
          
          if (masterRecord) {
            return {
              ...day,
              foodRevenue: masterRecord.foodRevenue,
              bevRevenue: masterRecord.beverageRevenue
            };
          }
          
          return day;
        });
        
        setMonthlyData(updatedWagesData);
      } catch (error) {
        console.error('Error fetching wages data:', error);
        toast.error('Failed to load wages data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [year, month, getMonthlyWages]);
  
  const handleInputChange = async (day: number, field: string, value: string) => {
    // Only allow changes to wages fields, not revenue fields
    if (field === 'foodRevenue' || field === 'bevRevenue') {
      toast.info('Revenue data can only be changed in the Master Input module');
      return;
    }
    
    const numValue = parseFloat(value) || 0;
    
    // Convert the day to proper day of week
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay();
    // Convert JS day (0=Sunday, 1=Monday) to our format (0=Monday, 6=Sunday)
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
    
    try {
      await setDailyWages(updatedDay);
      
      setMonthlyData(prevData => 
        prevData.map(d => d.day === day ? updatedDay : d)
      );
      
      toast.success('Data saved successfully');
    } catch (error) {
      console.error('Failed to save data:', error);
      toast.error('Failed to save data');
    }
  };
  
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
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Monthly Wages Tracker</span>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">
              Total Wages: {formatCurrency(totals.totalWages)} ({totalPercentage.toFixed(1)}%)
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {isLoading ? (
          <div className="py-10 text-center text-muted-foreground">Loading wages data...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Day & Date</TableHead>
                <TableHead>FOH Wages</TableHead>
                <TableHead>Kitchen Wages</TableHead>
                <TableHead>Total Wages</TableHead>
                <TableHead className="flex items-center gap-1">
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
                </TableHead>
                <TableHead className="flex items-center gap-1">
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
                </TableHead>
                <TableHead>Total Revenue</TableHead>
                <TableHead>FOH %</TableHead>
                <TableHead>Kitchen %</TableHead>
                <TableHead>Total %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyData.map((day) => {
                // Get day name and format it correctly (Monday first) using UTC
                const dateObj = new Date(Date.UTC(year, month - 1, day.day));
                const jsDay = dateObj.getDay(); // 0=Sunday, 1=Monday, etc.
                const adjustedDayIndex = jsDay === 0 ? 6 : jsDay - 1; // Convert to 0=Monday, ..., 6=Sunday
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
                
                return (
                  <TableRow key={day.day}>
                    <TableCell className="font-medium">
                      {shortDayName}, {day.day}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={day.fohWages || ''}
                        onChange={(e) => handleInputChange(day.day, 'fohWages', e.target.value)}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={day.kitchenWages || ''}
                        onChange={(e) => handleInputChange(day.day, 'kitchenWages', e.target.value)}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>{formatCurrency(totalDailyWages)}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={day.foodRevenue || ''}
                        onChange={(e) => handleInputChange(day.day, 'foodRevenue', e.target.value)}
                        className="w-24 bg-gray-50"
                        readOnly
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={day.bevRevenue || ''}
                        onChange={(e) => handleInputChange(day.day, 'bevRevenue', e.target.value)}
                        className="w-24 bg-gray-50"
                        readOnly
                      />
                    </TableCell>
                    <TableCell>{formatCurrency(totalDailyRevenue)}</TableCell>
                    <TableCell className={fohPercent > 20 ? 'text-red-500' : 'text-green-500'}>
                      {fohPercent.toFixed(1)}%
                    </TableCell>
                    <TableCell className={kitchenPercent > 20 ? 'text-red-500' : 'text-green-500'}>
                      {kitchenPercent.toFixed(1)}%
                    </TableCell>
                    <TableCell className={totalPercent > 35 ? 'text-red-500' : 'text-green-500'}>
                      {totalPercent.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow className="font-medium">
                <TableCell>MONTHLY TOTAL</TableCell>
                <TableCell>{formatCurrency(totals.fohWages)}</TableCell>
                <TableCell>{formatCurrency(totals.kitchenWages)}</TableCell>
                <TableCell>{formatCurrency(totals.totalWages)}</TableCell>
                <TableCell>{formatCurrency(totals.foodRevenue)}</TableCell>
                <TableCell>{formatCurrency(totals.bevRevenue)}</TableCell>
                <TableCell>{formatCurrency(totals.totalRevenue)}</TableCell>
                <TableCell className={fohPercentage > 20 ? 'text-red-500' : 'text-green-500'}>
                  {fohPercentage.toFixed(1)}%
                </TableCell>
                <TableCell className={kitchenPercentage > 20 ? 'text-red-500' : 'text-green-500'}>
                  {kitchenPercentage.toFixed(1)}%
                </TableCell>
                <TableCell className={totalPercentage > 35 ? 'text-red-500' : 'text-green-500'}>
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
