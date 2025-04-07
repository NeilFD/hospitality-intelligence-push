import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useStore, useMonthRecord } from '@/lib/store';
import { 
  calculateGP, 
  formatCurrency, 
  formatPercentage, 
  getMonthName,
  formatDateForDisplay
} from '@/lib/date-utils';
import { toast } from 'sonner';
import StatusBox from '@/components/StatusBox';
import { useQuery } from '@tanstack/react-query';
import { fetchSuppliers, fetchMonthlySettings } from '@/services/kitchen-service';
import { Supplier, ModuleType } from '@/types/kitchen-ledger';

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

  const path = window.location.pathname;
  const moduleType: ModuleType = path.includes('/food/') ? 'food' : 
                              path.includes('/beverage/') ? 'beverage' : 'food';
  
  const monthRecord = useMonthRecord(currentYear, currentMonth, moduleType);
  const weekRecord = monthRecord.weeks.find(w => w.weekNumber === currentWeek);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  const { data: supabaseSuppliers, isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ['suppliers', moduleType],
    queryFn: async () => {
      const data = await fetchSuppliers(moduleType);
      return data;
    }
  });
  
  const { data: monthlySettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['monthly-settings', currentYear, currentMonth, moduleType],
    queryFn: async () => {
      try {
        const settings = await fetchMonthlySettings(currentYear, currentMonth, moduleType);
        return settings;
      } catch (error) {
        console.error('Error fetching monthly settings:', error);
        return null;
      }
    }
  });
  
  useEffect(() => {
    if (yearParam && monthParam && weekParam) {
      setCurrentYear(parseInt(yearParam));
      setCurrentMonth(parseInt(monthParam));
      setCurrentWeek(parseInt(weekParam));
    }
  }, [yearParam, monthParam, weekParam]);
  
  useEffect(() => {
    if (!isLoadingSuppliers && supabaseSuppliers && supabaseSuppliers.length > 0) {
      const mappedSuppliers = supabaseSuppliers.map(s => ({
        id: s.id,
        name: s.name
      }));
      setSuppliers(mappedSuppliers);
    } else {
      setSuppliers([...monthRecord.suppliers]);
    }
  }, [supabaseSuppliers, isLoadingSuppliers, monthRecord]);
  
  const handleInputChange = (
    dayIndex: number,
    field: 'revenue' | 'purchases' | 'creditNotes' | 'staffFoodAllowance',
    value: string,
    supplierId?: string,
    creditIndex?: number
  ) => {
    if (!weekRecord) return;
    
    const numericValue = value === '' ? 0 : parseFloat(value);
    
    if (isNaN(numericValue)) {
      console.log("Invalid numeric input:", value);
      return;
    }
    
    console.log(`Updating ${field} for day ${dayIndex} with value: ${numericValue}`);
    
    useStore.setState(state => {
      const updatedMonths = state.annualRecord.months.map(month => {
        if (month.year === currentYear && month.month === currentMonth) {
          const updatedWeeks = month.weeks.map(week => {
            if (week.weekNumber === currentWeek) {
              const updatedDays = [...week.days];
              
              if (field === 'revenue') {
                updatedDays[dayIndex] = {
                  ...updatedDays[dayIndex],
                  revenue: numericValue
                };
              } else if (field === 'purchases' && supplierId) {
                updatedDays[dayIndex] = {
                  ...updatedDays[dayIndex],
                  purchases: {
                    ...updatedDays[dayIndex].purchases,
                    [supplierId]: numericValue
                  }
                };
              } else if (field === 'creditNotes' && typeof creditIndex === 'number') {
                const updatedCreditNotes = [...updatedDays[dayIndex].creditNotes];
                updatedCreditNotes[creditIndex] = numericValue;
                
                updatedDays[dayIndex] = {
                  ...updatedDays[dayIndex],
                  creditNotes: updatedCreditNotes
                };
              } else if (field === 'staffFoodAllowance') {
                updatedDays[dayIndex] = {
                  ...updatedDays[dayIndex],
                  staffFoodAllowance: numericValue
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

  if (!weekRecord) {
    return (
      <div className="container py-6">
        <p>Week not found.</p>
      </div>
    );
  }

  const sortedDays = [...weekRecord.days];
  
  const weeklyGP = calculateWeeklyGP();
  const gpTarget = monthlySettings?.gp_target || monthRecord.gpTarget;
  const gpDifference = weeklyGP - gpTarget;
  const gpStatus = 
    gpDifference >= 0.02 ? 'good' : 
    gpDifference >= -0.02 ? 'warning' : 
    'bad';
  
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
          value={formatPercentage(gpTarget)} 
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
                  {sortedDays.map((day, index) => (
                    <th key={index} className="table-header-day">
                      {day.dayOfWeek}<br />
                      {day.date.split('-')[2]}/{day.date.split('-')[1]}
                    </th>
                  ))}
                  <th className="table-header rounded-tr-lg">Weekly Total</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map(supplier => (
                  <tr key={supplier.id}>
                    <td className="table-cell text-left font-medium">{supplier.name}</td>
                    {sortedDays.map((day, dayIndex) => {
                      const originalDayIndex = weekRecord.days.findIndex(d => d.date === day.date);
                      const value = day.purchases[supplier.id];
                      
                      return (
                        <td key={dayIndex} className="table-cell p-0">
                          <Input 
                            type="number"
                            min="0"
                            step="0.01"
                            value={value || ''} 
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
                      const originalDayIndex = weekRecord.days.findIndex(d => d.date === day.date);
                      const value = day.creditNotes[creditIndex];
                      
                      return (
                        <td key={dayIndex} className="table-cell p-0">
                          <Input 
                            type="number"
                            min="0"
                            step="0.01"
                            value={value || ''} 
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
                    const originalDayIndex = weekRecord.days.findIndex(d => d.date === day.date);
                    const value = day.staffFoodAllowance;
                    
                    return (
                      <td key={dayIndex} className="table-cell p-0">
                        <Input 
                          type="number"
                          min="0"
                          step="0.01"
                          value={value || ''} 
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
                    const originalDayIndex = weekRecord.days.findIndex(d => d.date === day.date);
                    const value = day.revenue;
                    
                    return (
                      <td key={dayIndex} className="table-cell p-0">
                        <Input 
                          type="number"
                          min="0"
                          step="0.01"
                          value={value || ''} 
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
                    const originalDayIndex = weekRecord.days.findIndex(d => d.date === day.date);
                    const dailyGP = calculateDailyGP(originalDayIndex);
                    const gpStatus = 
                      dailyGP >= gpTarget ? 'status-good' : 
                      dailyGP >= gpTarget - 0.02 ? 'status-warning' : 
                      'status-bad';
                    
                    return (
                      <td key={dayIndex} className={`table-cell ${gpStatus}`}>
                        {day.revenue > 0 ? formatPercentage(dailyGP) : '-'}
                      </td>
                    );
                  })}
                  <td className={`table-cell font-bold rounded-br-lg ${
                    weeklyGP >= gpTarget ? 'status-good' : 
                    weeklyGP >= gpTarget - 0.02 ? 'status-warning' : 
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
