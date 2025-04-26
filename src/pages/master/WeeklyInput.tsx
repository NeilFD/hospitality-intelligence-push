
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchMasterWeeklyRecords, upsertMasterDailyRecord } from '@/services/master-record-service';
import { generateRevenueForecast } from '@/services/forecast-service';
import { MasterDailyRecord } from '@/types/master-record-types';
import DailyRecordForm from '@/components/master/DailyRecordForm';
import { generateWeekDates, formatDate, formatCurrency, formatPercentage } from '@/lib/date-utils';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ForecastDataItem {
  foodRevenue: number;
  beverageRevenue: number;
  totalRevenue: number;
}

const WeeklyInput = () => {
  const params = useParams<{
    year: string;
    month: string;
    week: string;
  }>();
  
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<MasterDailyRecord[]>([]);
  
  const year = useMemo(() => params.year ? parseInt(params.year, 10) : new Date().getFullYear(), [params.year]);
  const month = useMemo(() => params.month ? parseInt(params.month, 10) : new Date().getMonth() + 1, [params.month]);
  
  const weekDates = useMemo(() => generateWeekDates(year, month), [year, month]);
  const today = new Date().toISOString().split('T')[0];
  
  const currentWeekIndex = useMemo(() => {
    return weekDates.findIndex(week => today >= week.startDate && today <= week.endDate);
  }, [weekDates, today]);
  
  const weekNumber = useMemo(() => {
    if (params.week) {
      return parseInt(params.week, 10);
    }
    return currentWeekIndex >= 0 ? currentWeekIndex + 1 : 1;
  }, [params.week, currentWeekIndex]);
  
  const selectedDateStorageKey = useMemo(() => 
    `master-input-selected-date-${year}-${month}-${weekNumber}`, 
  [year, month, weekNumber]);
  
  const [activeDay, setActiveDay] = useState<string>(() => {
    const savedDate = localStorage.getItem(selectedDateStorageKey);
    return savedDate || '';
  });
  
  useEffect(() => {
    if (activeDay) {
      localStorage.setItem(selectedDateStorageKey, activeDay);
    }
  }, [activeDay, selectedDateStorageKey]);
  
  const currentWeek = useMemo(() => {
    if (weekNumber > 0 && weekNumber <= weekDates.length) {
      return weekDates[weekNumber - 1];
    }
    return { startDate: '', endDate: '' };
  }, [weekDates, weekNumber]);
  
  const [forecastData, setForecastData] = useState<Record<string, ForecastDataItem>>({});
  
  const loadForecastData = useCallback(async () => {
    if (weekNumber > 0 && weekNumber <= weekDates.length) {
      try {
        const { startDate, endDate } = weekDates[weekNumber - 1];
        const forecast = await generateRevenueForecast(startDate, endDate, false);
        
        const forecastObj = forecast.reduce((acc, day) => {
          acc[day.date] = {
            foodRevenue: day.foodRevenue,
            beverageRevenue: day.beverageRevenue,
            totalRevenue: day.totalRevenue
          };
          return acc;
        }, {} as Record<string, ForecastDataItem>);
        
        setForecastData(forecastObj);
      } catch (error) {
        console.error('Error loading forecast data:', error);
        toast.error('Failed to load forecast data');
      }
    }
  }, [weekNumber, weekDates]);
  
  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      console.log(`Loading master records for: Year=${year}, Month=${month}, Week=${weekNumber}`);
      
      const fetchedRecords = await fetchMasterWeeklyRecords(year, month, weekNumber);
      
      if (weekNumber > 0 && weekNumber <= weekDates.length) {
        const { startDate, endDate } = weekDates[weekNumber - 1];
        
        const start = new Date(`${startDate}T12:00:00Z`);
        const end = new Date(`${endDate}T12:00:00Z`);
        
        console.log(`Week ${weekNumber} date range: ${formatDate(start)} to ${formatDate(end)}`);
        
        const days = [];
        
        const currentDay = new Date(start);
        while (currentDay <= end) {
          const dateStr = formatDate(currentDay);
          const existingRecord = fetchedRecords.find(r => r.date === dateStr);
          
          if (existingRecord) {
            days.push(existingRecord);
          } else {
            days.push({
              id: '',
              date: dateStr,
              dayOfWeek: format(currentDay, 'EEEE'),
              year,
              month,
              weekNumber,
              foodRevenue: 0,
              beverageRevenue: 0,
              totalRevenue: 0,
              lunchCovers: 0,
              dinnerCovers: 0,
              totalCovers: 0,
              averageCoverSpend: 0
            });
          }
          
          currentDay.setUTCDate(currentDay.getUTCDate() + 1);
        }
        
        setRecords(days);
        
        if (days.length > 0) {
          const savedDate = localStorage.getItem(selectedDateStorageKey);
          const dateExists = savedDate && days.some(day => day.date === savedDate);
          
          if (dateExists) {
            setActiveDay(savedDate);
          } else if (!activeDay || !days.some(day => day.date === activeDay)) {
            setActiveDay(days[0].date);
          }
        }
      }
      
      await loadForecastData();
    } catch (error) {
      console.error('Error loading weekly records:', error);
      toast.error('Failed to load weekly records');
    } finally {
      setLoading(false);
    }
  }, [year, month, weekNumber, weekDates, activeDay, selectedDateStorageKey, loadForecastData]);
  
  useEffect(() => {
    loadRecords();
  }, [loadRecords]);
  
  const handleSaveDailyRecord = useCallback(async (data: Partial<MasterDailyRecord>) => {
    try {
      console.log('WeeklyInput: Saving daily record...', data);
      const updatedRecord = await upsertMasterDailyRecord(data as Partial<MasterDailyRecord> & {
        date: string;
      });
      console.log('WeeklyInput: Record saved successfully:', updatedRecord);
      
      // Explicitly update the correct record in state to ensure UI reflects saved data
      setRecords(prev => {
        // Create a new array to ensure React detects the state change
        return prev.map(record => {
          if (record.date === updatedRecord.date) {
            console.log(`Updating record in state for date ${record.date}`);
            return {
              ...updatedRecord // Use the full returned record from the server
            };
          }
          return record;
        });
      });
      
      toast.success(`Record for ${format(new Date(updatedRecord.date), 'EEE, MMM d')} saved successfully`);
    } catch (error) {
      console.error('WeeklyInput: Error saving daily record:', error);
      toast.error(`Failed to save record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);
  
  const getForecastVariance = (actual: number, forecast: number) => {
    if (forecast === 0) return { variance: 0, percentage: 0 };
    const variance = actual - forecast;
    const percentage = forecast !== 0 ? (variance / forecast) : 0;
    return { variance, percentage };
  };

  if (loading) {
    return <div className="p-4">
      <Skeleton className="h-8 w-3/4 mb-2" />
      <Skeleton className="h-48 w-full" />
    </div>;
  }
  
  return (
    <div className="p-2 md:p-4">
      <Card className="border shadow-sm">
        <CardHeader className="bg-gray-50 border-b py-2 px-4">
          <CardTitle className="text-lg md:text-xl">Master Input - Week {weekNumber}, {month}/{year}</CardTitle>
        </CardHeader>
        
        <CardContent className="p-0">
          <Tabs value={activeDay} onValueChange={setActiveDay} className="w-full">
            <div className="border-b bg-gray-50">
              <TabsList className="grid grid-cols-7 h-auto bg-transparent">
                {records.map(day => {
                  const forecast = forecastData[day.date] || { foodRevenue: 0, beverageRevenue: 0, totalRevenue: 0 };
                  const foodVariance = getForecastVariance(day.foodRevenue || 0, forecast.foodRevenue);
                  const bevVariance = getForecastVariance(day.beverageRevenue || 0, forecast.beverageRevenue);
                  const totalVariance = getForecastVariance((day.foodRevenue || 0) + (day.beverageRevenue || 0), forecast.totalRevenue);
                  
                  return (
                    <TabsTrigger 
                      key={day.date} 
                      value={day.date}
                      className="flex flex-col py-1 
                        data-[state=active]:bg-tavern-blue/10 
                        rounded-none 
                        text-gray-700
                        data-[state=active]:text-tavern-blue-dark
                        hover:bg-gray-100
                        relative
                        after:absolute
                        after:bottom-0
                        after:left-1/2
                        after:-translate-x-1/2
                        after:w-4/5
                        after:h-0.5
                        after:bg-[#78E08F]
                        after:scale-x-0
                        after:transition-transform
                        after:duration-300
                        data-[state=active]:after:scale-x-100
                        data-[state=active]:border-b-0"
                    >
                      <span className="text-xs opacity-80">{format(new Date(day.date), 'EEE')}</span>
                      <span className="text-base font-semibold">{format(new Date(day.date), 'd')}</span>
                      {totalVariance.variance !== 0 && forecast.totalRevenue > 0 && (
                        <span className={`text-xs ${totalVariance.percentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {totalVariance.percentage >= 0 ? '+' : ''}{formatPercentage(totalVariance.percentage)}
                        </span>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>
            
            {records.map(day => (
              <TabsContent 
                key={day.date} 
                value={day.date} 
                className="mt-0 p-0"
              >
                <DailyRecordForm 
                  key={day.date} 
                  date={day.date} 
                  dayOfWeek={day.dayOfWeek} 
                  initialData={day}
                  forecastData={forecastData[day.date]}
                  onSave={handleSaveDailyRecord} 
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default WeeklyInput;
