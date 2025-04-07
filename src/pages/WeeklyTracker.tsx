
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchSuppliers, 
  fetchMonthlySettings, 
  fetchTrackerDataByWeek, 
  fetchTrackerPurchases, 
  fetchTrackerCreditNotes,
  upsertTrackerData,
  upsertTrackerPurchase,
  upsertTrackerCreditNote
} from '@/services/kitchen-service';
import { Supplier, ModuleType, DailyRecord } from '@/types/kitchen-ledger';
import { DbTrackerData } from '@/types/supabase-types';

export default function WeeklyTracker() {
  const { year: yearParam, month: monthParam, week: weekParam } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
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
  const [isDataChanged, setIsDataChanged] = useState(false);
  const [localWeekData, setLocalWeekData] = useState<DailyRecord[]>([]);
  
  // Queries
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

  const { data: trackerData, isLoading: isLoadingTrackerData } = useQuery({
    queryKey: ['tracker-data', currentYear, currentMonth, currentWeek, moduleType],
    queryFn: async () => {
      try {
        return await fetchTrackerDataByWeek(currentYear, currentMonth, currentWeek, moduleType);
      } catch (error) {
        console.error('Error fetching tracker data:', error);
        return [];
      }
    }
  });
  
  // Mutations
  const saveTrackerDataMutation = useMutation({
    mutationFn: async (data: {
      trackerId: string;
      dayIndex: number;
      field: 'revenue' | 'staff_food_allowance';
      value: number;
    }) => {
      const { trackerId, field, value } = data;
      return await upsertTrackerData({ 
        id: trackerId,
        [field]: value
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracker-data', currentYear, currentMonth, currentWeek, moduleType] });
    }
  });

  const savePurchaseMutation = useMutation({
    mutationFn: async (data: {
      trackerId: string;
      supplierId: string;
      amount: number;
    }) => {
      return await upsertTrackerPurchase({
        tracker_data_id: data.trackerId,
        supplier_id: data.supplierId,
        amount: data.amount
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracker-purchases'] });
    }
  });

  const saveCreditNoteMutation = useMutation({
    mutationFn: async (data: {
      trackerId: string;
      creditIndex: number;
      amount: number;
    }) => {
      return await upsertTrackerCreditNote({
        tracker_data_id: data.trackerId,
        credit_index: data.creditIndex,
        amount: data.amount
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracker-credit-notes'] });
    }
  });

  const saveAllDataMutation = useMutation({
    mutationFn: async (days: DailyRecord[]) => {
      const promises = [];
      
      // For each day, we need to save:
      for (const day of days) {
        // First ensure tracker data exists for this day
        const trackerDataPayload: Omit<DbTrackerData, 'id' | 'created_at' | 'updated_at'> = {
          year: currentYear,
          month: currentMonth,
          week_number: currentWeek,
          date: day.date,
          day_of_week: day.dayOfWeek,
          module_type: moduleType,
          revenue: day.revenue,
          staff_food_allowance: day.staffFoodAllowance
        };
        
        const trackerData = await upsertTrackerData(trackerDataPayload);
        
        // Then save all purchases for this day
        for (const [supplierId, amount] of Object.entries(day.purchases)) {
          if (amount > 0) {
            promises.push(upsertTrackerPurchase({
              tracker_data_id: trackerData.id,
              supplier_id: supplierId,
              amount
            }));
          }
        }
        
        // And save all credit notes for this day
        day.creditNotes.forEach((amount, index) => {
          if (amount > 0) {
            promises.push(upsertTrackerCreditNote({
              tracker_data_id: trackerData.id,
              credit_index: index,
              amount
            }));
          }
        });
      }
      
      await Promise.all(promises);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracker-data'] });
      queryClient.invalidateQueries({ queryKey: ['tracker-purchases'] });
      queryClient.invalidateQueries({ queryKey: ['tracker-credit-notes'] });
      setIsDataChanged(false);
      toast.success("All changes saved successfully!");
    },
    onError: (error) => {
      console.error('Failed to save data:', error);
      toast.error("Failed to save data. Please try again.");
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
  
  // Setup initial week data
  useEffect(() => {
    if (!weekRecord) return;
    
    // Initialize with data from the local state
    let initialData = [...weekRecord.days];
    
    // If we have tracker data from Supabase, integrate it
    if (trackerData && trackerData.length > 0) {
      // We'll get purchases and credit notes for each day
      const promises = trackerData.map(async (day) => {
        const purchases = await fetchTrackerPurchases(day.id);
        const creditNotes = await fetchTrackerCreditNotes(day.id);
        return { day, purchases, creditNotes };
      });
      
      Promise.all(promises).then((results) => {
        // Update local data with Supabase data
        const updatedDays = initialData.map(localDay => {
          // Find matching day from Supabase
          const dayResult = results.find(r => r.day.date === localDay.date);
          
          if (dayResult) {
            // Create a new purchases record
            const updatedPurchases = { ...localDay.purchases };
            
            // Update purchases from Supabase data
            dayResult.purchases.forEach(purchase => {
              updatedPurchases[purchase.supplier_id] = purchase.amount;
            });
            
            // Update credit notes from Supabase data
            const updatedCreditNotes = [...localDay.creditNotes];
            dayResult.creditNotes.forEach(note => {
              updatedCreditNotes[note.credit_index] = note.amount;
            });
            
            // Return updated day with Supabase data
            return {
              ...localDay,
              revenue: dayResult.day.revenue || 0,
              purchases: updatedPurchases,
              creditNotes: updatedCreditNotes,
              staffFoodAllowance: dayResult.day.staff_food_allowance || 0
            };
          }
          
          return localDay;
        });
        
        setLocalWeekData(updatedDays);
      });
    } else {
      setLocalWeekData(initialData);
    }
  }, [weekRecord, trackerData]);
  
  const handleInputChange = (
    dayIndex: number,
    field: 'revenue' | 'purchases' | 'creditNotes' | 'staffFoodAllowance',
    value: string,
    supplierId?: string,
    creditIndex?: number
  ) => {
    if (!localWeekData) return;
    
    const numericValue = value === '' ? 0 : parseFloat(value);
    
    if (isNaN(numericValue)) {
      console.log("Invalid numeric input:", value);
      return;
    }
    
    setIsDataChanged(true);
    
    setLocalWeekData(prevData => {
      const updatedDays = [...prevData];
      
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
      
      return updatedDays;
    });
  };
  
  const handleSaveAllData = () => {
    if (localWeekData.length > 0) {
      saveAllDataMutation.mutate(localWeekData);
    }
  };
  
  const calculateDailyCost = (dayIndex: number) => {
    if (!localWeekData || dayIndex >= localWeekData.length) return 0;
    const day = localWeekData[dayIndex];
    
    const purchasesTotal = Object.values(day.purchases).reduce((sum, amount) => sum + amount, 0);
    const creditNotesTotal = day.creditNotes.reduce((sum, amount) => sum + amount, 0);
    
    return purchasesTotal - creditNotesTotal + day.staffFoodAllowance;
  };
  
  const calculateDailyGP = (dayIndex: number) => {
    if (!localWeekData || dayIndex >= localWeekData.length) return 0;
    const day = localWeekData[dayIndex];
    const dailyCost = calculateDailyCost(dayIndex);
    
    return calculateGP(day.revenue, dailyCost);
  };
  
  const calculateSupplierTotal = (supplierId: string) => {
    if (!localWeekData) return 0;
    
    return localWeekData.reduce((sum, day) => {
      return sum + (day.purchases[supplierId] || 0);
    }, 0);
  };
  
  const calculateCreditNotesTotal = () => {
    if (!localWeekData) return 0;
    
    return localWeekData.reduce((sum, day) => {
      return sum + day.creditNotes.reduce((creditSum, credit) => creditSum + credit, 0);
    }, 0);
  };
  
  const calculateTotalPurchases = (dayIndex?: number) => {
    if (!localWeekData) return 0;
    
    if (typeof dayIndex === 'number') {
      const day = localWeekData[dayIndex];
      return Object.values(day.purchases).reduce((sum, amount) => sum + amount, 0);
    }
    
    return localWeekData.reduce((sum, day) => {
      return sum + Object.values(day.purchases).reduce((purchaseSum, amount) => purchaseSum + amount, 0);
    }, 0);
  };
  
  const calculateTotalStaffAllowance = () => {
    if (!localWeekData) return 0;
    
    return localWeekData.reduce((sum, day) => sum + day.staffFoodAllowance, 0);
  };
  
  const calculateTotalFoodCost = () => {
    if (!localWeekData) return 0;
    
    const totalPurchases = calculateTotalPurchases();
    const totalCreditNotes = calculateCreditNotesTotal();
    const totalStaffAllowance = calculateTotalStaffAllowance();
    
    return totalPurchases - totalCreditNotes + totalStaffAllowance;
  };
  
  const calculateTotalRevenue = () => {
    if (!localWeekData) return 0;
    
    return localWeekData.reduce((sum, day) => sum + day.revenue, 0);
  };
  
  const calculateWeeklyGP = () => {
    const totalRevenue = calculateTotalRevenue();
    const totalFoodCost = calculateTotalFoodCost();
    
    return calculateGP(totalRevenue, totalFoodCost);
  };

  const isLoading = isLoadingSuppliers || isLoadingSettings || isLoadingTrackerData || 
                   saveAllDataMutation.isPending;

  if (!weekRecord || !localWeekData || localWeekData.length === 0) {
    return (
      <div className="container py-6">
        <p>Week not found or data is loading...</p>
      </div>
    );
  }

  const sortedDays = [...localWeekData];
  
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
            onClick={() => navigate(`/${moduleType}/month/${currentYear}/${currentMonth}`)}
            className="rounded-full shadow-sm hover:shadow transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-tavern-blue">
            Week {currentWeek} Tracker - {getMonthName(currentMonth)} {currentYear}
          </h1>
        </div>
        
        <Button 
          variant="default" 
          onClick={handleSaveAllData} 
          disabled={!isDataChanged || isLoading}
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
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
                  {sortedDays.map((day, index) => {
                    const dateStr = day.date;
                    const dateParts = dateStr.split('-').map(Number);
                    const dateObj = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2]));
                    
                    return (
                      <th key={index} className="table-header-day">
                        {day.dayOfWeek}<br />
                        {formatDateForDisplay(dateObj)}
                      </th>
                    );
                  })}
                  <th className="table-header rounded-tr-lg">Weekly Total</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map(supplier => (
                  <tr key={supplier.id}>
                    <td className="table-cell text-left font-medium">{supplier.name}</td>
                    {sortedDays.map((day, dayIndex) => {
                      const value = day.purchases[supplier.id];
                      
                      return (
                        <td key={dayIndex} className="table-cell p-0">
                          <Input 
                            type="number"
                            min="0"
                            step="0.01"
                            value={value || ''} 
                            onChange={(e) => handleInputChange(
                              dayIndex, 
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
                    return (
                      <td key={dayIndex} className="table-cell table-row-totals">
                        {formatCurrency(calculateTotalPurchases(dayIndex))}
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
                      const value = day.creditNotes[creditIndex];
                      
                      return (
                        <td key={dayIndex} className="table-cell p-0">
                          <Input 
                            type="number"
                            min="0"
                            step="0.01"
                            value={value || ''} 
                            onChange={(e) => handleInputChange(
                              dayIndex, 
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
                    const value = day.staffFoodAllowance;
                    
                    return (
                      <td key={dayIndex} className="table-cell p-0">
                        <Input 
                          type="number"
                          min="0"
                          step="0.01"
                          value={value || ''} 
                          onChange={(e) => handleInputChange(
                            dayIndex, 
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
                    return (
                      <td key={dayIndex} className="table-cell table-row-totals font-semibold">
                        {formatCurrency(calculateDailyCost(dayIndex))}
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
                    const value = day.revenue;
                    
                    return (
                      <td key={dayIndex} className="table-cell p-0">
                        <Input 
                          type="number"
                          min="0"
                          step="0.01"
                          value={value || ''} 
                          onChange={(e) => handleInputChange(
                            dayIndex, 
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
                    const dailyGP = calculateDailyGP(dayIndex);
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
