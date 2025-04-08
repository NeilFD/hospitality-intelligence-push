
import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useMonthRecord, useWeekRecord } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ModuleType } from '@/types/kitchen-ledger';

interface WeeklyTrackerProps {
  modulePrefix: string;
  moduleType: ModuleType;
}

const WeeklyTracker = React.memo(({ modulePrefix, moduleType }: WeeklyTrackerProps) => {
  const params = useParams<{ year: string; month: string; week: string }>();
  const [loading, setLoading] = useState(true);
  
  const year = useMemo(() => params.year ? parseInt(params.year, 10) : new Date().getFullYear(), [params.year]);
  const month = useMemo(() => params.month ? parseInt(params.month, 10) : new Date().getMonth() + 1, [params.month]);
  const weekNumber = useMemo(() => params.week ? parseInt(params.week, 10) : 1, [params.week]);
  
  const monthRecord = useMonthRecord(year, month, moduleType);
  const weekRecord = useWeekRecord(year, month, weekNumber);
  
  useEffect(() => {
    if (monthRecord && weekRecord) {
      setLoading(false);
    }
  }, [monthRecord, weekRecord]);

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
      <Card>
        <CardHeader>
          <CardTitle>{modulePrefix} Weekly Tracker - Week {weekNumber}, {month}/{year}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Weekly tracking data will be displayed here.</p>
          {/* Implement weekly tracking UI here */}
        </CardContent>
      </Card>
    </div>
  );
});

WeeklyTracker.displayName = 'WeeklyTracker';

export default WeeklyTracker;
