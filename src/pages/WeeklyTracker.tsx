
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStore } from '@/lib/store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import KeyInsights from '@/components/performance/KeyInsights';
import { format, parseISO } from 'date-fns';

interface WeeklyTrackerProps {
  modulePrefix: string;
  moduleType: string;
}

const WeeklyTracker: React.FC<WeeklyTrackerProps> = ({ modulePrefix, moduleType }) => {
  const { year: yearParam, month: monthParam, week: weekParam } = useParams();
  const { setCurrentYear, setCurrentMonth, currentYear, currentMonth } = useStore();
  
  // If URL params are provided, update the store
  useEffect(() => {
    if (yearParam && monthParam) {
      const parsedYear = parseInt(yearParam, 10);
      const parsedMonth = parseInt(monthParam, 10);
      
      if (!isNaN(parsedYear) && !isNaN(parsedMonth)) {
        setCurrentYear(parsedYear);
        setCurrentMonth(parsedMonth);
      }
    }
  }, [yearParam, monthParam, setCurrentYear, setCurrentMonth]);
  
  // Use parameters from store if not provided in URL
  const year = yearParam ? parseInt(yearParam, 10) : currentYear;
  const month = monthParam ? parseInt(monthParam, 10) : currentMonth;
  const weekNumber = weekParam ? parseInt(weekParam, 10) : null;
  
  // Format the date for display
  const dateDisplay = format(new Date(year, month - 1, 1), 'MMMM yyyy');

  return (
    <div className="p-4 md:p-8 space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <CardTitle className="text-xl md:text-2xl font-semibold flex items-center">
            {modulePrefix} Weekly Tracker
            {weekNumber && <span className="ml-2 text-lg text-muted-foreground font-normal">- Week {weekNumber}</span>}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-5">
          <Tabs defaultValue="insights">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="insights">Weekly Insights</TabsTrigger>
              <TabsTrigger value="daily">Daily Breakdown</TabsTrigger>
              <TabsTrigger value="variance">Forecast Variance</TabsTrigger>
            </TabsList>
            
            <TabsContent value="insights" className="pt-6">
              <KeyInsights />
            </TabsContent>
            
            <TabsContent value="daily" className="pt-6">
              <h2 className="text-2xl font-semibold mb-4">Daily Tracker - {dateDisplay}</h2>
              <p className="text-muted-foreground">
                Daily breakdown content will be displayed here.
                {weekNumber && <span> Currently viewing Week {weekNumber}.</span>}
              </p>
            </TabsContent>
            
            <TabsContent value="variance" className="pt-6">
              <h2 className="text-2xl font-semibold mb-4">Forecast Variance - {dateDisplay}</h2>
              <p className="text-muted-foreground">
                Forecast variance analysis will be displayed here.
                {weekNumber && <span> Currently viewing Week {weekNumber}.</span>}
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default WeeklyTracker;
