import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Save, Trash2, Info } from 'lucide-react';
import { ModuleType } from '@/types/kitchen-ledger';
import { 
  Table, TableHeader, TableBody, TableHead, 
  TableRow, TableCell, TableStickyHeader 
} from '@/components/ui/table';
import { 
  fetchTrackerDataByWeek, 
  fetchSuppliers, 
  fetchTrackerPurchases, 
  fetchTrackerCreditNotes, 
  upsertTrackerData, 
  upsertTrackerPurchase, 
  upsertTrackerCreditNote 
} from '@/services/kitchen-service';
import { fetchMasterDailyRecordsForWeek } from '@/services/master-record-service';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TrackerData {
  id: string;
  date: string;
  dayOfWeek: string;
  revenue: number;
  purchases: { [supplierId: string]: number };
  creditNotes: number[];
  staffFoodAllowance: number;
}

interface Supplier {
  id: string;
  name: string;
}

interface WeeklyTrackerProps {
  modulePrefix: string;
  moduleType: ModuleType;
}

const WeeklyTracker = React.memo(({ modulePrefix, moduleType }: WeeklyTrackerProps) => {
  const params = useParams<{ year: string; month: string; week: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [trackerData, setTrackerData] = useState<TrackerData[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [masterRecords, setMasterRecords] = useState<Record<string, {
    foodRevenue: number;
    beverageRevenue: number;
  }>>({});
  
  const year = useMemo(() => params.year ? parseInt(params.year, 10) : new Date().getFullYear(), [params.year]);
  const month = useMemo(() => params.month ? parseInt(params.month, 10) : new Date().getMonth() + 1, [params.month]);
  const weekNumber = useMemo(() => params.week ? parseInt(params.week, 10) : 1, [params.week]);
  
  const loadMasterRecords = useCallback(async () => {
    try {
      const records = await fetchMasterDailyRecordsForWeek(year, month, weekNumber);
      const recordMap: Record<string, { foodRevenue: number; beverageRevenue: number }> = {};
      
      records.forEach(record => {
        recordMap[record.date] = {
          foodRevenue: record.foodRevenue || 0,
          beverageRevenue: record.beverageRevenue || 0
        };
      });
      
      setMasterRecords(recordMap);
    } catch (error) {
      console.error('Error loading master records:', error);
      toast.error('Failed to load revenue data from master records');
    }
  }, [year, month, weekNumber]);

  useEffect(() => {
    loadMasterRecords();
  }, [loadMasterRecords]);

  const loadTrackerData = useCallback(async () => {
    setLoading(true);
    try {
      const suppliersData = await fetchSuppliers(moduleType);
      setSuppliers(suppliersData.map(s => ({ id: s.id, name: s.name })));
      
      const data = await fetchTrackerDataByWeek(year, month, weekNumber, moduleType);
      console.info(`Processing ${moduleType} tracker data: ${data.length} records`);
      
      const purchasesByTrackerId: Record<string, Record<string, number>> = {};
      const creditNotesByTrackerId: Record<string, number[]> = {};
      
      for (const item of data) {
        console.info(`Day ${item.date}: Revenue = ${item.revenue}`);
        
        const purchases = await fetchTrackerPurchases(item.id);
        purchasesByTrackerId[item.id] = {};
        
        for (const purchase of purchases) {
          purchasesByTrackerId[item.id][purchase.supplier_id] = purchase.amount;
        }
        
        const creditNotes = await fetchTrackerCreditNotes(item.id);
        creditNotesByTrackerId[item.id] = creditNotes.map(cn => cn.amount);
      }
      
      const formattedData = data.map(item => {
        const masterRecord = masterRecords[item.date] || { foodRevenue: 0, beverageRevenue: 0 };
        let revenue = 0;
        
        if (moduleType === 'food') {
          revenue = masterRecord.foodRevenue;
        } else if (moduleType === 'beverage') {
          revenue = masterRecord.beverageRevenue;
        }
        
        return {
          id: item.id,
          date: item.date,
          dayOfWeek: item.day_of_week,
          revenue: revenue,
          purchases: purchasesByTrackerId[item.id] || {},
          creditNotes: creditNotesByTrackerId[item.id] || [],
          staffFoodAllowance: item.staff_food_allowance || 0
        };
      });
      
      setTrackerData(formattedData);
    } catch (error) {
      console.error(`Error loading ${moduleType} tracker data:`, error);
      toast.error(`Failed to load ${moduleType} tracker data`);
    } finally {
      setLoading(false);
    }
  }, [year, month, weekNumber, moduleType, masterRecords]);

  useEffect(() => {
    if (Object.keys(masterRecords).length > 0) {
      loadTrackerData();
    }
  }, [loadTrackerData, masterRecords]);

  const calculateTotalPurchases = (day: TrackerData) => {
    return Object.values(day.purchases).reduce((sum, amount) => sum + amount, 0);
  };
  
  const calculateTotalCreditNotes = (day: TrackerData) => {
    return day.creditNotes.reduce((sum, amount) => sum + amount, 0);
  };
  
  const calculateNetPurchases = (day: TrackerData) => {
    return calculateTotalPurchases(day) - calculateTotalCreditNotes(day);
  };
  
  const calculateCost = (day: TrackerData) => {
    return calculateNetPurchases(day) - day.staffFoodAllowance;
  };
  
  const calculateGrossProfit = (day: TrackerData) => {
    return day.revenue - calculateCost(day);
  };
  
  const calculateGPPercentage = (day: TrackerData) => {
    if (day.revenue === 0) return 0;
    return (calculateGrossProfit(day) / day.revenue) * 100;
  };

  const calculateWeeklyTotalForSupplier = (supplierId: string) => {
    return trackerData.reduce((sum, day) => sum + (day.purchases[supplierId] || 0), 0);
  };

  const handlePurchaseChange = (dayId: string, supplierId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setTrackerData(prev => prev.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          purchases: {
            ...day.purchases,
            [supplierId]: numValue
          }
        };
      }
      return day;
    }));
  };

  const handleCreditNoteChange = (dayId: string, index: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    setTrackerData(prev => prev.map(day => {
      if (day.id === dayId) {
        const updatedCreditNotes = [...day.creditNotes];
        updatedCreditNotes[index] = numValue;
        return {
          ...day,
          creditNotes: updatedCreditNotes
        };
      }
      return day;
    }));
  };

  const handleStaffFoodChange = (dayId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setTrackerData(prev => prev.map(day => 
      day.id === dayId ? { ...day, staffFoodAllowance: numValue } : day
    ));
  };

  const handleAddCreditNote = () => {
    setTrackerData(prev => prev.map(day => {
      return {
        ...day,
        creditNotes: [...day.creditNotes, 0]
      };
    }));
  };

  const handleDeleteCreditNote = (index: number) => {
    setTrackerData(prev => prev.map(day => {
      return {
        ...day,
        creditNotes: day.creditNotes.filter((_, i) => i !== index)
      };
    }));
  };

  const saveTrackerData = async () => {
    setSaving(true);
    try {
      for (const day of trackerData) {
        await upsertTrackerData({
          year,
          month,
          week_number: weekNumber,
          date: day.date,
          day_of_week: day.dayOfWeek,
          module_type: moduleType,
          revenue: day.revenue,
          staff_food_allowance: day.staffFoodAllowance
        });
        
        for (const [supplierId, amount] of Object.entries(day.purchases)) {
          await upsertTrackerPurchase({
            tracker_data_id: day.id,
            supplier_id: supplierId,
            amount
          });
        }
        
        for (let i = 0; i < day.creditNotes.length; i++) {
          await upsertTrackerCreditNote({
            tracker_data_id: day.id,
            credit_index: i,
            amount: day.creditNotes[i]
          });
        }
      }
      
      toast.success(`${modulePrefix} tracker data saved successfully`);
    } catch (error) {
      console.error(`Error saving ${moduleType} tracker data:`, error);
      toast.error(`Failed to save ${moduleType} tracker data`);
    } finally {
      setSaving(false);
    }
  };

  const calculateWeeklyTotals = () => {
    const totalRevenue = trackerData.reduce((sum, day) => sum + day.revenue, 0);
    const totalPurchases = trackerData.reduce((sum, day) => sum + calculateTotalPurchases(day), 0);
    const totalCredits = trackerData.reduce((sum, day) => sum + calculateTotalCreditNotes(day), 0);
    const totalStaffFood = trackerData.reduce((sum, day) => sum + day.staffFoodAllowance, 0);
    const totalCost = totalPurchases - totalCredits + totalStaffFood;
    const grossProfit = totalRevenue - totalCost;
    const gpPercentage = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalPurchases,
      totalCredits,
      totalStaffFood,
      totalCost,
      grossProfit,
      gpPercentage
    };
  };

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const weeklyTotals = calculateWeeklyTotals();

  return (
    <div className="p-4">
      <Card className="border shadow-sm">
        <CardHeader className="bg-gray-50 border-b pb-4 flex flex-row items-center justify-between">
          <CardTitle className="text-xl">{modulePrefix} Weekly Tracker - Week {weekNumber}, {month}/{year}</CardTitle>
          <Button 
            onClick={saveTrackerData} 
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {trackerData.length > 0 ? (
            <Table>
              <TableStickyHeader>
                <TableRow className="bg-gray-100 border-b">
                  <TableHead className="w-[200px] font-bold">Week {weekNumber}</TableHead>
                  {trackerData.map((day, index) => (
                    <TableHead key={day.id} className="text-center min-w-[120px] font-medium">
                      {format(new Date(day.date), 'EEEE')}
                      <br />
                      <span className="text-xs text-gray-500">{format(new Date(day.date), 'dd/MM/yyyy')}</span>
                    </TableHead>
                  ))}
                  <TableHead className="text-center bg-gray-200 font-bold">Weekly Total</TableHead>
                </TableRow>
              </TableStickyHeader>

              <TableBody>
                <TableRow className="bg-blue-50">
                  <TableCell className="font-medium flex justify-between items-center">
                    <span>Daily Net Revenue</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-gray-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Revenue data is synchronized from Master Input records</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  {trackerData.map(day => (
                    <TableCell key={`revenue-${day.id}`} className="text-right">
                      £{day.revenue.toFixed(2)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-medium bg-gray-100">
                    £{weeklyTotals.totalRevenue.toFixed(2)}
                  </TableCell>
                </TableRow>

                {/* Supplier rows */}
                {suppliers.map(supplier => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    {trackerData.map(day => (
                      <TableCell key={`${supplier.id}-${day.id}`} className="p-0">
                        <Input
                          type="number"
                          value={day.purchases[supplier.id] || 0}
                          onChange={(e) => handlePurchaseChange(day.id, supplier.id, e.target.value)}
                          className="border-0 text-right h-8"
                        />
                      </TableCell>
                    ))}
                    <TableCell className="text-right font-medium bg-gray-100">
                      £{calculateWeeklyTotalForSupplier(supplier.id).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}

                {/* Total purchases row */}
                <TableRow className="bg-gray-100 font-medium">
                  <TableCell>Total Purchases</TableCell>
                  {trackerData.map((day, index) => (
                    <TableCell key={`total-purchases-${day.id}`} className="text-right">
                      £{calculateTotalPurchases(day).toFixed(2)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-bold bg-gray-200">
                    £{weeklyTotals.totalPurchases.toFixed(2)}
                  </TableCell>
                </TableRow>

                {/* Credit notes rows */}
                {[...Array(Math.max(...trackerData.map(d => d.creditNotes.length), 1))].map((_, index) => (
                  <TableRow key={`credit-note-${index}`} className="text-red-600">
                    <TableCell className="font-medium flex items-center justify-between">
                      Credit note {index + 1}
                      <div className="flex space-x-1">
                        {index === 0 && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleAddCreditNote}
                            className="h-6 w-6 p-0"
                          >
                            <Plus size={14} />
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteCreditNote(index)}
                          className="h-6 w-6 p-0 border-red-300 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                    {trackerData.map(day => (
                      <TableCell key={`credit-${day.id}-${index}`} className="p-0">
                        {day.creditNotes[index] !== undefined ? (
                          <Input
                            type="number"
                            value={day.creditNotes[index]}
                            onChange={(e) => handleCreditNoteChange(day.id, index, e.target.value)}
                            className="border-0 text-right h-8 text-red-600"
                          />
                        ) : (
                          <Input
                            type="number"
                            value={0}
                            disabled
                            className="border-0 text-right h-8 bg-gray-50"
                          />
                        )}
                      </TableCell>
                    ))}
                    <TableCell className="text-right font-medium bg-gray-100 text-red-600">
                      £{trackerData.reduce((sum, day) => sum + (day.creditNotes[index] || 0), 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}

                {/* Staff food allowance */}
                <TableRow className="bg-blue-50">
                  <TableCell className="font-medium">Staff Food Allowance</TableCell>
                  {trackerData.map(day => (
                    <TableCell key={`staff-food-${day.id}`} className="p-0">
                      <Input
                        type="number"
                        value={day.staffFoodAllowance}
                        onChange={(e) => handleStaffFoodChange(day.id, e.target.value)}
                        className="border-0 text-right h-8"
                      />
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-medium bg-gray-100">
                    £{weeklyTotals.totalStaffFood.toFixed(2)}
                  </TableCell>
                </TableRow>

                {/* Daily total food cost */}
                <TableRow className="bg-gray-200 font-medium">
                  <TableCell>Daily Total Food Cost</TableCell>
                  {trackerData.map(day => (
                    <TableCell key={`cost-${day.id}`} className="text-right">
                      £{calculateCost(day).toFixed(2)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-bold bg-gray-300">
                    £{weeklyTotals.totalCost.toFixed(2)}
                  </TableCell>
                </TableRow>

                {/* Gross profit */}
                <TableRow className="bg-blue-100">
                  <TableCell className="font-medium">Gross Profit</TableCell>
                  {trackerData.map(day => (
                    <TableCell key={`gp-${day.id}`} className="text-right">
                      £{calculateGrossProfit(day).toFixed(2)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-bold bg-blue-200">
                    £{weeklyTotals.grossProfit.toFixed(2)}
                  </TableCell>
                </TableRow>

                {/* GP percentage */}
                <TableRow className="bg-blue-100">
                  <TableCell className="font-medium">GP Percentage</TableCell>
                  {trackerData.map(day => (
                    <TableCell 
                      key={`gp-pct-${day.id}`} 
                      className={`text-right ${calculateGPPercentage(day) >= 65 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {calculateGPPercentage(day).toFixed(1)}%
                    </TableCell>
                  ))}
                  <TableCell 
                    className={`text-right font-bold bg-blue-200 ${weeklyTotals.gpPercentage >= 65 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {weeklyTotals.gpPercentage.toFixed(1)}%
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
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
