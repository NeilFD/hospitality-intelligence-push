
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, PlusCircle } from 'lucide-react';
import { generateWeekDates } from '@/lib/date-utils';

const MasterDashboard = () => {
  const navigate = useNavigate();
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  // Generate current month's weeks
  const weeks = generateWeekDates(currentYear, currentMonth);
  
  // Find current week
  const today = format(currentDate, 'yyyy-MM-dd');
  const currentWeekIndex = weeks.findIndex(
    week => today >= week.startDate && today <= week.endDate
  );
  
  const goToWeek = (year: number, month: number, weekNumber: number) => {
    navigate(`/master/week/${year}/${month}/${weekNumber}`);
  };
  
  const goToMonth = (year: number, month: number) => {
    navigate(`/master/month/${year}/${month}`);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Master Input Dashboard</h1>
          <p className="text-muted-foreground">
            Central data management for revenue, covers, weather, and operational notes
          </p>
        </div>
        <Button onClick={() => goToWeek(currentYear, currentMonth, currentWeekIndex + 1)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Current Week Input
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Week {currentWeekIndex + 1}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {currentWeekIndex >= 0 && weeks[currentWeekIndex]
                ? `${format(new Date(weeks[currentWeekIndex].startDate), 'MMM d')} - ${format(new Date(weeks[currentWeekIndex].endDate), 'MMM d, yyyy')}`
                : 'No current week data'}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4 w-full"
              onClick={() => goToWeek(currentYear, currentMonth, currentWeekIndex + 1)}
              disabled={currentWeekIndex < 0}
            >
              Input Data
            </Button>
          </CardContent>
        </Card>

        {weeks.slice(0, 5).map((week, index) => (
          <Card key={`week-${index+1}`} className={index === currentWeekIndex ? "border-blue-500" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Week {index + 1}
                {index === currentWeekIndex && <span className="ml-2 text-xs bg-blue-100 text-blue-800 py-0.5 px-2 rounded-full">Current</span>}
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {format(new Date(week.startDate), 'MMM d')} - {format(new Date(week.endDate), 'MMM d')}
              </p>
              <Button 
                variant="outline" 
                size="sm"
                className="mt-4 w-full"
                onClick={() => goToWeek(currentYear, currentMonth, index + 1)}
              >
                View/Edit
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Monthly Summaries</h2>
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {[...Array(3)].map((_, i) => {
            const monthIndex = currentMonth - i - 1;
            const monthToUse = monthIndex > 0 ? monthIndex : 12 + monthIndex;
            const yearToUse = monthIndex > 0 ? currentYear : currentYear - 1;
            
            return (
              <Card key={`month-${monthToUse}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    {format(new Date(yearToUse, monthToUse - 1, 1), 'MMMM yyyy')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full"
                    onClick={() => goToMonth(yearToUse, monthToUse)}
                  >
                    View Summary
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MasterDashboard;
