
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, PlusCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { generateWeekDates } from '@/lib/date-utils';

const MasterDashboard = () => {
  const navigate = useNavigate();

  // State for the selected date
  const [selectedDate, setSelectedDate] = useState(new Date());
  const currentYear = selectedDate.getFullYear();
  const currentMonth = selectedDate.getMonth() + 1; // 1-12

  // Generate current month's weeks
  const weeks = generateWeekDates(currentYear, currentMonth);

  // Find current week
  const today = format(new Date(), 'yyyy-MM-dd');
  const currentWeekIndex = weeks.findIndex(week => today >= week.startDate && today <= week.endDate);

  // Navigation functions
  const goToPreviousMonth = () => {
    setSelectedDate(prevDate => addMonths(prevDate, -1));
  };
  const goToNextMonth = () => {
    setSelectedDate(prevDate => addMonths(prevDate, 1));
  };
  const goToCurrentMonth = () => {
    setSelectedDate(new Date());
  };
  
  // Navigate to week page
  const goToWeek = (year: number, month: number, weekNumber: number) => {
    navigate(`/master/weekly-input/${year}/${month}/${weekNumber}`);
  };
  
  const goToMonth = (year: number, month: number) => {
    navigate(`/master/month-summary`);
  };

  // Format month range for display
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const monthRangeDisplay = `${format(monthStart, 'MMMM yyyy')}`;

  // Check if current date is in the displayed month
  const isCurrentMonth = new Date().getMonth() === selectedDate.getMonth() && new Date().getFullYear() === selectedDate.getFullYear();
  
  return <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Master Input Dashboard</h1>
          <p className="text-muted-foreground">
            Central data management for revenue, covers, weather, and operational notes
          </p>
        </div>
        <Button onClick={() => goToWeek(currentYear, currentMonth, currentWeekIndex >= 0 ? currentWeekIndex + 1 : 1)} className="bg-[#806cac] hover:bg-[#705b9b]">
          <PlusCircle className="mr-2 h-4 w-4" />
          Current Week Input
        </Button>
      </div>
      
      {/* Month navigation */}
      <Card className="mb-6 border-[#806cac]/10">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle>Daily Info</CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon" onClick={goToPreviousMonth} className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant={isCurrentMonth ? "default" : "outline"} size="sm" onClick={goToCurrentMonth} className={isCurrentMonth ? "bg-[#806cac] hover:bg-[#705b9b]" : ""}>Month</Button>
              <Button variant="outline" size="icon" onClick={goToNextMonth} className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row items-center justify-between mb-4">
            <div className="flex items-center mb-4 md:mb-0">
              <Calendar className="mr-2 h-4 w-4 text-[#806cac]" />
              <h2 className="text-xl font-semibold">{monthRangeDisplay}</h2>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => goToMonth(currentYear, currentMonth)} className="border-[#806cac] text-[#806cac] hover:bg-[#806cac] hover:text-white">
                View Month Summary
              </Button>
            </div>
          </div>
          
          {/* Year/Month selector */}
          <div className="flex gap-2 mb-6">
            <div className="relative flex-1 max-w-[180px]">
              <Input type="month" value={`${currentYear}-${currentMonth.toString().padStart(2, '0')}`} onChange={e => {
              const [year, month] = e.target.value.split('-').map(Number);
              if (year && month) {
                setSelectedDate(new Date(year, month - 1, 1));
              }
            }} className="pl-10" />
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      <h2 className="text-xl font-semibold mb-4 text-slate-900">Weeks in {format(selectedDate, 'MMMM yyyy')}</h2>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {weeks.map((week, index) => {
        const weekNumber = index + 1;
        const isCurrentWeek = currentWeekIndex === index && isCurrentMonth;

        // Parse dates for display - use new Date directly and format it
        const startDate = new Date(`${week.startDate}T12:00:00Z`);
        const endDate = new Date(`${week.endDate}T12:00:00Z`);
        
        return <Card key={`week-${weekNumber}`} className={`
                transition-all duration-200 hover:shadow-md
                ${isCurrentWeek ? 'border-[#806cac] bg-[#806cac]/5' : 'border-gray-200'}
              `}>
              <CardContent className="p-0">
                <div className="p-4 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium">Week {weekNumber}</h3>
                        {isCurrentWeek && <span className="ml-2 bg-[#806cac] text-white text-xs px-2 py-1 rounded-full">
                            Current
                          </span>}
                      </div>
                      <p className="text-sm text-gray-500">
                        {format(startDate, 'MMM d')} - {format(endDate, 'MMM d')}
                        {startDate.getFullYear() !== endDate.getFullYear() && <span> {format(endDate, 'yyyy')}</span>}
                      </p>
                    </div>
                    <div className="text-[#806cac]/70">
                      <Calendar className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-auto">
                    <Button onClick={() => goToWeek(currentYear, currentMonth, weekNumber)} variant={isCurrentWeek ? "default" : "outline"} className={`w-full ${isCurrentWeek ? 'bg-[#806cac] hover:bg-[#705b9b]' : 'border-[#806cac] text-[#806cac] hover:bg-[#806cac] hover:text-white'}`}>
                      {isCurrentWeek ? 'Input Data' : 'View/Edit'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>;
      })}
      </div>
      
      {/* Monthly summaries section */}
      <div className="mt-8 mb-2 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-900">Monthly Summaries</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={goToPreviousMonth} className="h-8 w-8 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextMonth} className="h-8 w-8 p-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {[...Array(3)].map((_, i) => {
        const offsetMonths = i === 0 ? 0 : -i;
        const date = addMonths(selectedDate, offsetMonths);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const isHighlighted = i === 0;
        return <Card key={`month-${i}`} className={`transition-all duration-200 hover:shadow-md ${isHighlighted ? 'border-[#806cac]/30' : ''}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span>{format(date, 'MMMM yyyy')}</span>
                  <Calendar className="h-4 w-4 text-[#806cac]/70" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" className="w-full border-[#806cac] text-[#806cac] hover:bg-[#806cac] hover:text-white" onClick={() => goToMonth(year, month)}>
                  View Summary
                </Button>
              </CardContent>
            </Card>;
      })}
      </div>
    </div>;
};

export default MasterDashboard;
