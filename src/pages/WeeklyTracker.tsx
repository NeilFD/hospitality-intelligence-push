
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useStore, useMonthRecord } from '@/lib/store';
import { calculateGP, formatCurrency, formatPercentage, getMonthName } from '@/lib/date-utils';
import { toast } from 'sonner';
import StatusBox from '@/components/StatusBox';

export default function WeeklyTracker() {
  const { year: yearParam, month: monthParam, week: weekParam } = useParams();
  const navigate = useNavigate();
  
  const [currentYear, setCurrentYear] = useState<number>(
    yearParam ? parseInt(yearParam) : new Date().getFullYear()
  );
  const [currentMonth, setCurrentMonth] = useState<number>(
    monthParam ? parseInt(monthParam) : new Date().getMonth() + 1
  );
  const [currentWeek, setCurrentWeek] = useState<number>(
    weekParam ? parseInt(weekParam) : 1
  );
  
  const monthRecord = useMonthRecord(currentYear, currentMonth);
  const weekRecord = monthRecord.weeks.find(w => w.weekNumber === currentWeek);
  
  // Navigate when params change
  useEffect(() => {
    if (yearParam && monthParam && weekParam) {
      setCurrentYear(parseInt(yearParam));
      setCurrentMonth(parseInt(monthParam));
      setCurrentWeek(parseInt(weekParam));
    }
  }, [yearParam, monthParam, weekParam]);
  
  const handleInputChange = (
    dayIndex: number,
    field: 'revenue' | 'purchases' | 'creditNotes' | 'staffFoodAllowance',
    value: any,
    supplierId?: string,
    creditIndex?: number
  ) => {
    if (!weekRecord) return;
    
    useStore.setState(state => {
      const updatedMonths = state.annualRecord.months.map(month => {
        if (month.year === currentYear && month.month === currentMonth) {
          const updatedWeeks = month.weeks.map(week => {
            if (week.weekNumber === currentWeek) {
              const updatedDays = [...week.days];
              
              if (field === 'revenue') {
                updatedDays[dayIndex] = {
                  ...updatedDays[dayIndex],
                  revenue: parseFloat(value) || 0
                };
              } else if (field === 'purchases' && supplierId) {
                updatedDays[dayIndex] = {
                  ...updatedDays[dayIndex],
                  purchases: {
                    ...updatedDays[dayIndex].purchases,
                    [supplierId]: parseFloat(value) || 0
                  }
                };
              } else if (field === 'creditNotes' && typeof creditIndex === 'number') {
                const updatedCreditNotes = [...updatedDays[dayIndex].creditNotes];
                updatedCreditNotes[creditIndex] = parseFloat(value) || 0;
                
                updatedDays[dayIndex] = {
                  ...updatedDays[dayIndex],
                  creditNotes: updatedCreditNotes
                };
              } else if (field === 'staffFoodAllowance') {
                updatedDays[dayIndex] = {
                  ...updatedDays[dayIndex],
                  staffFoodAllowance: parseFloat(value) || 0
                };
              }
              
              return {
                ...week,
                days: updatedDays
              };
            }
            return week;
          });
          
          return {
            ...month,
            weeks: updatedWeeks
          };
        }
        return month;
      });
      
      return {
        ...state,
        annualRecord: {
          ...state.annualRecord,
          months: updatedMonths
        }
      };
    });
  };
  
  // Calculate totals for the week
  const calculateDailyCost = (dayIndex: number) => {
    if (!weekRecord) return 0;
    const day = weekRecord.days[dayIndex];
    
    const purchasesTotal = Object.values(day.purchases).reduce((sum, amount) => sum + amount, 0);
    const creditNotesTotal = day.creditNotes.reduce((sum, amount) => sum + amount, 0);
    
    return purchasesTotal - creditNotesTotal + day.staffFoodAllowance;
  };
  
  const calculateDailyGP = (dayIndex: number) => {
    if (!weekRecord) return 0;
    const day = weekRecord.days[dayIndex];
    const dailyCost = calculateDailyCost(dayIndex);
    
    return calculateGP(day.revenue, dailyCost);
  };
  
  const calculateSupplierTotal = (supplierId: string) => {
    if (!weekRecord) return 0;
    
    return weekRecord.days.reduce((sum, day) => {
      return sum + (day.purchases[supplierId] || 0);
    }, 0);
  };
  
  const calculateCreditNotesTotal = () => {
    if (!weekRecord) return 0;
    
    return weekRecord.days.reduce((sum, day) => {
      return sum + day.creditNotes.reduce((creditSum, credit) => creditSum + credit, 0);
    }, 0);
  };
  
  const calculateTotalPurchases = (dayIndex?: number) => {
    if (!weekRecord) return 0;
    
    if (typeof dayIndex === 'number') {
      const day = weekRecord.days[dayIndex];
      return Object.values(day.purchases).reduce((sum, amount) => sum + amount, 0);
    }
    
    return weekRecord.days.reduce((sum, day) => {
      return sum + Object.values(day.purchases).reduce((purchaseSum, amount) => purchaseSum + amount, 0);
    }, 0);
  };
  
  const calculateTotalStaffAllowance = () => {
    if (!weekRecord) return 0;
    
    return weekRecord.days.reduce((sum, day) => sum + day.staffFoodAllowance, 0);
  };
  
  const calculateTotalFoodCost = () => {
    if (!weekRecord) return 0;
    
    const totalPurchases = calculateTotalPurchases();
    const totalCreditNotes = calculateCreditNotesTotal();
    const totalStaffAllowance = calculateTotalStaffAllowance();
    
    return totalPurchases - totalCreditNotes + totalStaffAllowance;
  };
  
  const calculateTotalRevenue = () => {
    if (!weekRecord) return 0;
    
    return weekRecord.days.reduce((sum, day) => sum + day.revenue, 0);
  };
  
  const calculateWeeklyGP = () => {
    const totalRevenue = calculateTotalRevenue();
    const totalFoodCost = calculateTotalFoodCost();
    
    return calculateGP(totalRevenue, totalFoodCost);
  };
  
  const weeklyGP = calculateWeeklyGP();
  const gpDifference = weeklyGP - monthRecord.gpTarget;
  const gpStatus = 
    gpDifference >= 0.02 ? 'good' : 
    gpDifference >= -0.02 ? 'warning' : 
    'bad';
  
  if (!weekRecord) {
    return (
      <div className="container py-6">
        <p>Week not found.</p>
      </div>
    );
  }
  
  // Sort days to ensure they're in Monday-Sunday order
  const sortedDays = [...weekRecord.days].sort((a, b) => {
    const dayOrder = {
      'Monday': 0,
      'Tuesday': 1,
      'Wednesday': 2,
      'Thursday': 3,
      'Friday': 4,
      'Saturday': 5,
      'Sunday': 6
    };
    return dayOrder[a.dayOfWeek] - dayOrder[b.dayOfWeek];
  });
  
  return (
    <div className="container py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate(`/month/${currentYear}/${currentMonth}`)}
            className="rounded-full shadow-sm hover:shadow transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-tavern-blue">
            Week {currentWeek} Tracker - {getMonthName(currentMonth)} {currentYear}
          </h1>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatusBox 
          label="Weekly GP %" 
          value={formatPercentage(calculateWeeklyGP())} 
          status={gpStatus} 
        />
        <StatusBox 
          label="GP Target" 
          value={formatPercentage(monthRecord.gpTarget)} 
          status="neutral" 
        />
        <StatusBox 
          label="Variance" 
          value={`${gpDifference >= 0 ? '+' : ''}${formatPercentage(gpDifference)}`} 
          status={gpStatus} 
        />
      </div>
      
      <Card className="rounded-xl shadow-md border-tavern-blue-light/20 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-tavern-blue-light/30 to-tavern-blue-light/10 border-b border-tavern-blue-light/20">
          <CardTitle>Daily Food Costs & Revenue</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="overflow-x-auto rounded-lg">
            <table className="w-full border-collapse rounded-lg overflow-hidden">
              <thead>
                <tr>
                  <th className="table-header rounded-tl-lg">Supplier Name</th>
                  {sortedDays.map((day, index) => {
                    const dateObj = new Date(day.date);
                    const formattedDate = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
                    
                    return (
                      <th key={index} className="table-header-day">
                        {day.dayOfWeek}<br />
                        {formattedDate}
                      </th>
                    );
                  })}
                  <th className="table-header rounded-tr-lg">Weekly Total</th>
                </tr>
              </thead>
              <tbody>
                {monthRecord.suppliers.map(supplier => (
                  <tr key={supplier.id}>
                    <td className="table-cell text-left font-medium">{supplier.name}</td>
                    {sortedDays.map((day, dayIndex) => {
                      // Find original index to use with handleInputChange
                      const originalDayIndex = weekRecord.days.findIndex(d => d.date === day.date);
                      
                      return (
                        <td key={dayIndex} className="table-cell p-0">
                          <Input 
                            type="number"
                            min="0"
                            step="0.01"
                            value={day.purchases[supplier.id] || ''}
                            onChange={(e) => handleInputChange(
                              originalDayIndex, 
                              'purchases', 
                              e.target.value, 
                              supplier.id
                            )}
                            className="table-input rounded-md"
                          />
                        </td>
                      );
                    })}
                    <td className="table-cell table-row-totals">
                      {formatCurrency(calculateSupplierTotal(supplier.id))}
                    </td>
                  </tr>
                ))}
                
                <tr className="border-t border-tavern-blue/20">
                  <td className="table-cell text-left font-medium">Total Purchases</td>
                  {sortedDays.map((day, dayIndex) => {
                    // Find original index to use with calculation function
                    const originalDayIndex = weekRecord.days.findIndex(d => d.date === day.date);
                    
                    return (
                      <td key={dayIndex} className="table-cell table-row-totals">
                        {formatCurrency(calculateTotalPurchases(originalDayIndex))}
                      </td>
                    );
                  })}
                  <td className="table-cell table-row-totals font-bold">
                    {formatCurrency(calculateTotalPurchases())}
                  </td>
                </tr>
                
                {[0, 1, 2].map(creditIndex => (
                  <tr key={`credit-${creditIndex}`}>
                    <td className="table-cell text-left font-medium text-tavern-red">
                      Credit note {creditIndex + 1}
                    </td>
                    {sortedDays.map((day, dayIndex) => {
                      // Find original index to use with handleInputChange
                      const originalDayIndex = weekRecord.days.findIndex(d => d.date === day.date);
                      
                      return (
                        <td key={dayIndex} className="table-cell p-0">
                          <Input 
                            type="number"
                            min="0"
                            step="0.01"
                            value={day.creditNotes[creditIndex] || ''}
                            onChange={(e) => handleInputChange(
                              originalDayIndex, 
                              'creditNotes', 
                              e.target.value, 
                              undefined, 
                              creditIndex
                            )}
                            className="table-input text-tavern-red rounded-md"
                          />
                        </td>
                      );
                    })}
                    <td className="table-cell"></td>
                  </tr>
                ))}
                
                <tr>
                  <td className="table-cell text-left font-medium">Staff Food Allowance</td>
                  {sortedDays.map((day, dayIndex) => {
                    // Find original index to use with handleInputChange
                    const originalDayIndex = weekRecord.days.findIndex(d => d.date === day.date);
                    
                    return (
                      <td key={dayIndex} className="table-cell p-0">
                        <Input 
                          type="number"
                          min="0"
                          step="0.01"
                          value={day.staffFoodAllowance || ''}
                          onChange={(e) => handleInputChange(
                            originalDayIndex, 
                            'staffFoodAllowance', 
                            e.target.value
                          )}
                          className="table-input rounded-md"
                        />
                      </td>
                    );
                  })}
                  <td className="table-cell table-row-totals">
                    {formatCurrency(calculateTotalStaffAllowance())}
                  </td>
                </tr>
                
                <tr className="border-t border-tavern-blue/20">
                  <td className="table-cell text-left font-semibold">Daily Total Food Cost</td>
                  {sortedDays.map((day, dayIndex) => {
                    // Find original index to use with calculation function
                    const originalDayIndex = weekRecord.days.findIndex(d => d.date === day.date);
                    
                    return (
                      <td key={dayIndex} className="table-cell table-row-totals font-semibold">
                        {formatCurrency(calculateDailyCost(originalDayIndex))}
                      </td>
                    );
                  })}
                  <td className="table-cell table-row-totals font-bold">
                    {formatCurrency(calculateTotalFoodCost())}
                  </td>
                </tr>
                
                <tr className="border-t-2 border-tavern-blue/30">
                  <td className="table-cell text-left font-semibold">Daily Net Food Revenue</td>
                  {sortedDays.map((day, dayIndex) => {
                    // Find original index to use with handleInputChange
                    const originalDayIndex = weekRecord.days.findIndex(d => d.date === day.date);
                    
                    return (
                      <td key={dayIndex} className="table-cell p-0">
                        <Input 
                          type="number"
                          min="0"
                          step="0.01"
                          value={day.revenue || ''}
                          onChange={(e) => handleInputChange(
                            originalDayIndex, 
                            'revenue', 
                            e.target.value
                          )}
                          className="table-input font-semibold rounded-md"
                        />
                      </td>
                    );
                  })}
                  <td className="table-cell table-row-totals font-bold">
                    {formatCurrency(calculateTotalRevenue())}
                  </td>
                </tr>
                
                <tr>
                  <td className="table-cell text-left font-semibold rounded-bl-lg">GP % Daily</td>
                  {sortedDays.map((day, dayIndex) => {
                    // Find original index to use with calculation function
                    const originalDayIndex = weekRecord.days.findIndex(d => d.date === day.date);
                    const dailyGP = calculateDailyGP(originalDayIndex);
                    const gpStatus = 
                      dailyGP >= monthRecord.gpTarget ? 'status-good' : 
                      dailyGP >= monthRecord.gpTarget - 0.02 ? 'status-warning' : 
                      'status-bad';
                    
                    return (
                      <td key={dayIndex} className={`table-cell ${gpStatus}`}>
                        {day.revenue > 0 ? formatPercentage(dailyGP) : '-'}
                      </td>
                    );
                  })}
                  <td className={`table-cell font-bold rounded-br-lg ${
                    weeklyGP >= monthRecord.gpTarget ? 'status-good' : 
                    weeklyGP >= monthRecord.gpTarget - 0.02 ? 'status-warning' : 
                    'status-bad'
                  }`}>
                    {formatPercentage(weeklyGP)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
