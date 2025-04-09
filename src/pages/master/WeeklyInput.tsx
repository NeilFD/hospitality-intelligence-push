
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  
  const navigate = useNavigate();
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
      console.log(`Loading master records for: Year=${year}, Month=${month}, Week=${weekNumber}`);
      
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
                {records.map(day => (
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
                  </TabsTrigger>
                ))}
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
