
import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ModuleType } from '@/types/kitchen-ledger';
import { fetchTrackerDataByWeek } from '@/services/kitchen-service';
import { toast } from 'sonner';

interface TrackerData {
  id: string;
  date: string;
  dayOfWeek: string;
  revenue: number;
  purchases: { [supplierId: string]: number };
  creditNotes: number[];
  staffFoodAllowance: number;
}

interface WeeklyTrackerProps {
  modulePrefix: string;
  moduleType: ModuleType;
}

const WeeklyTracker = React.memo(({ modulePrefix, moduleType }: WeeklyTrackerProps) => {
  const params = useParams<{ year: string; month: string; week: string }>();
  const [loading, setLoading] = useState(true);
  const [trackerData, setTrackerData] = useState<TrackerData[]>([]);
  
  const year = useMemo(() => params.year ? parseInt(params.year, 10) : new Date().getFullYear(), [params.year]);
  const month = useMemo(() => params.month ? parseInt(params.month, 10) : new Date().getMonth() + 1, [params.month]);
  const weekNumber = useMemo(() => params.week ? parseInt(params.week, 10) : 1, [params.week]);
  
  useEffect(() => {
    const loadTrackerData = async () => {
      setLoading(true);
      try {
        const data = await fetchTrackerDataByWeek(year, month, weekNumber, moduleType);
        console.info(`Processing ${moduleType} tracker data: ${data.length} records`);
        
        // Log revenue for debugging
        data.forEach(item => {
          console.info(`Day ${item.date}: Revenue = ${item.revenue}`);
        });
        
        // Transform data to our component's format
        const formattedData = data.map(item => ({
          id: item.id,
          date: item.date,
          dayOfWeek: item.day_of_week,
          revenue: item.revenue || 0,
          purchases: {}, // Will be populated if needed
          creditNotes: [], // Will be populated if needed
          staffFoodAllowance: item.staff_food_allowance || 0
        }));
        
        setTrackerData(formattedData);
      } catch (error) {
        console.error(`Error loading ${moduleType} tracker data:`, error);
        toast.error(`Failed to load ${moduleType} tracker data`);
      } finally {
        setLoading(false);
      }
    };
    
    loadTrackerData();
  }, [year, month, weekNumber, moduleType]);

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <Card className="border shadow-sm">
        <CardHeader className="bg-gray-50 border-b pb-4">
          <CardTitle className="text-xl">{modulePrefix} Weekly Tracker - Week {weekNumber}, {month}/{year}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {trackerData.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trackerData.map(day => (
                  <Card key={day.date} className="shadow-sm">
                    <CardHeader className="py-3 px-4 bg-gray-50">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium">{format(new Date(day.date), 'EEEE')}</h3>
                        <span className="text-xs text-gray-500">{format(new Date(day.date), 'MMM d')}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="py-3 px-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Revenue:</span>
                          <span className="font-medium">£{day.revenue.toFixed(2)}</span>
                        </div>
                        {day.staffFoodAllowance > 0 && (
                          <div className="flex justify-between">
                            <span className="text-sm">Staff Food:</span>
                            <span className="font-medium">£{day.staffFoodAllowance.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium mb-2">Weekly Summary</h3>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Total Revenue:</span>
                    <span className="font-medium">£{trackerData.reduce((sum, day) => sum + day.revenue, 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Daily Revenue:</span>
                    <span className="font-medium">
                      £{(trackerData.reduce((sum, day) => sum + day.revenue, 0) / 
                        (trackerData.filter(day => day.revenue > 0).length || 1)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No tracker data available for this week.</p>
              <p className="text-sm text-gray-400 mt-2">Data will appear here once it's entered in the system.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

WeeklyTracker.displayName = 'WeeklyTracker';

export default WeeklyTracker;
