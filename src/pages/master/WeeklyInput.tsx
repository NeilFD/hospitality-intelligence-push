
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchMasterWeeklyRecords, upsertMasterDailyRecord } from '@/services/master-record-service';
import { MasterDailyRecord } from '@/types/master-record-types';
import DailyRecordForm from '@/components/master/DailyRecordForm';
import { generateWeekDates } from '@/lib/date-utils';
import { toast } from 'sonner';

const WeeklyInput = () => {
  const params = useParams<{
    year: string;
    month: string;
    week: string;
  }>();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<MasterDailyRecord[]>([]);
  const [activeDay, setActiveDay] = useState<string>('');
  const year = useMemo(() => params.year ? parseInt(params.year, 10) : new Date().getFullYear(), [params.year]);
  const month = useMemo(() => params.month ? parseInt(params.month, 10) : new Date().getMonth() + 1, [params.month]);
  const weekNumber = useMemo(() => params.week ? parseInt(params.week, 10) : 1, [params.week]);
  const weekDates = useMemo(() => generateWeekDates(year, month), [year, month]);
  const currentWeek = useMemo(() => weekDates[weekNumber - 1] || {
    startDate: '',
    endDate: ''
  }, [weekDates, weekNumber]);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedRecords = await fetchMasterWeeklyRecords(year, month, weekNumber);
      if (weekNumber <= weekDates.length) {
        const {
          startDate,
          endDate
        } = weekDates[weekNumber - 1];
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = [];
        for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
          const dateStr = format(day, 'yyyy-MM-dd');
          const existingRecord = fetchedRecords.find(r => r.date === dateStr);
          if (existingRecord) {
            days.push(existingRecord);
          } else {
            days.push({
              id: '',
              date: dateStr,
              dayOfWeek: format(day, 'EEEE'),
              year,
              month,
              weekNumber,
              foodRevenue: 0,
              beverageRevenue: 0,
              totalRevenue: 0,
              lunchCovers: 0,
              dinnerCovers: 0,
              totalCovers: 0
            });
          }
        }
        setRecords(days);
        if (days.length > 0) {
          if (!activeDay || !days.some(day => day.date === activeDay)) {
            setActiveDay(days[0].date);
          }
        }
      }
    } catch (error) {
      console.error('Error loading weekly records:', error);
      toast.error('Failed to load weekly records');
    } finally {
      setLoading(false);
    }
  }, [year, month, weekNumber, weekDates, activeDay]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleSaveDailyRecord = useCallback(async (data: Partial<MasterDailyRecord>) => {
    try {
      const updatedRecord = await upsertMasterDailyRecord(data as Partial<MasterDailyRecord> & {
        date: string;
      });
      setRecords(prev => prev.map(record => record.date === updatedRecord.date ? updatedRecord : record));
      toast.success(`Record for ${format(new Date(updatedRecord.date), 'EEE, MMM d')} saved successfully`);
    } catch (error) {
      console.error('Error saving daily record:', error);
      toast.error('Failed to save daily record');
    }
  }, []);

  if (loading) {
    return <div className="p-8">
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>;
  }

  return <div className="p-4 md:p-8">
      <Card className="border shadow-md">
        <CardHeader className="bg-gray-50 border-b pb-4">
          <CardTitle className="text-2xl">Master Input - Week {weekNumber}, {month}/{year}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs value={activeDay} onValueChange={setActiveDay} className="w-full">
            <TabsList className="grid grid-cols-7 rounded-none border-b bg-gray-50 py-2 -mt-5">
              {records.map(day => <TabsTrigger key={day.date} value={day.date} className={`
                    relative 
                    group 
                    data-[state=active]:text-tavern-green 
                    transition-colors 
                    duration-200 
                    hover:bg-gray-100
                    flex 
                    flex-col 
                    items-center 
                    justify-center
                    py-4
                    -mb-2
                  `}>
                  <div className="text-center relative z-10 w-full">
                    <div className="font-medium text-xs opacity-70 group-data-[state=active]:opacity-100 mb-1">
                      {format(new Date(day.date), 'EEE')}
                    </div>
                    <div className="text-xl font-semibold relative inline-block">
                      <span className={`
                        px-3
                        py-2
                        rounded-md 
                        inline-block
                        min-w-[48px]
                        text-center
                        bg-gray-100
                        group-data-[state=active]:bg-tavern-green/10
                        group-data-[state=active]:text-tavern-green
                      `}>
                        {format(new Date(day.date), 'd')}
                      </span>
                      <span className="
                          absolute 
                          bottom-0 
                          left-1/2 
                          transform 
                          -translate-x-1/2 
                          w-8 
                          h-1 
                          bg-tavern-green 
                          opacity-0 
                          group-data-[state=active]:opacity-100 
                          transition-opacity 
                          duration-200
                        " />
                    </div>
                  </div>
                </TabsTrigger>)}
            </TabsList>
            
            {records.map(day => <TabsContent key={day.date} value={day.date} className="p-4 bg-gray-100">
                <DailyRecordForm key={day.date} date={day.date} dayOfWeek={day.dayOfWeek} initialData={day} onSave={handleSaveDailyRecord} />
              </TabsContent>)}
          </Tabs>
        </CardContent>
      </Card>
    </div>;
};

export default WeeklyInput;

