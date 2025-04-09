
import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ModuleType } from '@/types/kitchen-ledger';
import { fetchTrackerDataByWeek, fetchSuppliers, fetchTrackerPurchases, fetchTrackerCreditNotes } from '@/services/kitchen-service';
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
  const [trackerData, setTrackerData] = useState<TrackerData[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  const year = useMemo(() => params.year ? parseInt(params.year, 10) : new Date().getFullYear(), [params.year]);
  const month = useMemo(() => params.month ? parseInt(params.month, 10) : new Date().getMonth() + 1, [params.month]);
  const weekNumber = useMemo(() => params.week ? parseInt(params.week, 10) : 1, [params.week]);
  
  useEffect(() => {
    const loadTrackerData = async () => {
      setLoading(true);
      try {
        // Load suppliers first
        const suppliersData = await fetchSuppliers(moduleType);
        setSuppliers(suppliersData.map(s => ({ id: s.id, name: s.name })));
        
        // Load tracker data for the week
        const data = await fetchTrackerDataByWeek(year, month, weekNumber, moduleType);
        console.info(`Processing ${moduleType} tracker data: ${data.length} records`);
        
        // Create a map to store purchase data by tracker data ID
        const purchasesByTrackerId: Record<string, Record<string, number>> = {};
        const creditNotesByTrackerId: Record<string, number[]> = {};
        
        // Fetch purchases for all tracker data items
        for (const item of data) {
          // Log revenue for debugging
          console.info(`Day ${item.date}: Revenue = ${item.revenue}`);
          
          // Fetch purchases for this tracker data item
          const purchases = await fetchTrackerPurchases(item.id);
          purchasesByTrackerId[item.id] = {};
          
          for (const purchase of purchases) {
            purchasesByTrackerId[item.id][purchase.supplier_id] = purchase.amount;
          }
          
          // Fetch credit notes for this tracker data item
          const creditNotes = await fetchTrackerCreditNotes(item.id);
          creditNotesByTrackerId[item.id] = creditNotes.map(cn => cn.amount);
        }
        
        // Transform data to our component's format with purchases and credit notes
        const formattedData = data.map(item => ({
          id: item.id,
          date: item.date,
          dayOfWeek: item.day_of_week,
          revenue: item.revenue || 0,
          purchases: purchasesByTrackerId[item.id] || {},
          creditNotes: creditNotesByTrackerId[item.id] || [],
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
    return calculateNetPurchases(day) + day.staffFoodAllowance;
  };
  
  const calculateGrossProfit = (day: TrackerData) => {
    return day.revenue - calculateCost(day);
  };
  
  const calculateGPPercentage = (day: TrackerData) => {
    if (day.revenue === 0) return 0;
    return (calculateGrossProfit(day) / day.revenue) * 100;
  };

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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {trackerData.map(day => (
                  <Card key={day.date} className="shadow-sm">
                    <CardHeader className="py-3 px-4 bg-gray-50">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium">{format(new Date(day.date), 'EEEE')}</h3>
                        <span className="text-xs text-gray-500">{format(new Date(day.date), 'MMM d')}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="py-3 px-4">
                      <div className="space-y-3">
                        <div className="flex justify-between font-medium">
                          <span className="text-sm">Revenue:</span>
                          <span>£{day.revenue.toFixed(2)}</span>
                        </div>
                        
                        {/* Purchases by supplier */}
                        {Object.keys(day.purchases).length > 0 && (
                          <div className="space-y-1">
                            <h4 className="text-xs font-medium text-gray-500">Purchases:</h4>
                            {Object.entries(day.purchases).map(([supplierId, amount]) => {
                              const supplier = suppliers.find(s => s.id === supplierId);
                              return (
                                <div key={supplierId} className="flex justify-between text-sm">
                                  <span className="text-gray-600">{supplier?.name || 'Unknown'}:</span>
                                  <span>£{amount.toFixed(2)}</span>
                                </div>
                              );
                            })}
                            <div className="flex justify-between text-sm font-medium pt-1 border-t border-gray-100">
                              <span>Total Purchases:</span>
                              <span>£{calculateTotalPurchases(day).toFixed(2)}</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Credit Notes */}
                        {day.creditNotes.length > 0 && (
                          <div className="space-y-1">
                            <h4 className="text-xs font-medium text-gray-500">Credit Notes:</h4>
                            {day.creditNotes.map((amount, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span className="text-gray-600">Credit Note {index + 1}:</span>
                                <span>£{amount.toFixed(2)}</span>
                              </div>
                            ))}
                            <div className="flex justify-between text-sm font-medium pt-1 border-t border-gray-100">
                              <span>Total Credits:</span>
                              <span>£{calculateTotalCreditNotes(day).toFixed(2)}</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Staff Food Allowance */}
                        {day.staffFoodAllowance > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Staff Food:</span>
                            <span>£{day.staffFoodAllowance.toFixed(2)}</span>
                          </div>
                        )}
                        
                        {/* Net Cost */}
                        <div className="flex justify-between text-sm font-medium border-t border-gray-200 pt-2">
                          <span>Net Cost:</span>
                          <span>£{calculateCost(day).toFixed(2)}</span>
                        </div>
                        
                        {/* GP and Percentage */}
                        <div className="space-y-1 border-t border-gray-200 pt-2">
                          <div className="flex justify-between text-sm font-medium">
                            <span>Gross Profit:</span>
                            <span>£{calculateGrossProfit(day).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm font-medium">
                            <span>GP %:</span>
                            <span className={`${calculateGPPercentage(day) >= 65 ? 'text-green-600' : 'text-red-600'}`}>
                              {calculateGPPercentage(day).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium mb-3">Weekly Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Revenue:</span>
                    <span className="font-medium">£{trackerData.reduce((sum, day) => sum + day.revenue, 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Purchases:</span>
                    <span className="font-medium">
                      £{trackerData.reduce((sum, day) => sum + calculateTotalPurchases(day), 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Credit Notes:</span>
                    <span className="font-medium">
                      £{trackerData.reduce((sum, day) => sum + calculateTotalCreditNotes(day), 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                    <span>Net Cost:</span>
                    <span className="font-medium">
                      £{trackerData.reduce((sum, day) => sum + calculateCost(day), 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gross Profit:</span>
                    <span className="font-medium">
                      £{trackerData.reduce((sum, day) => sum + calculateGrossProfit(day), 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average GP %:</span>
                    <span className="font-medium">
                      {(() => {
                        const totalRevenue = trackerData.reduce((sum, day) => sum + day.revenue, 0);
                        const totalGP = trackerData.reduce((sum, day) => sum + calculateGrossProfit(day), 0);
                        if (totalRevenue === 0) return '0.0%';
                        const gpPercentage = (totalGP / totalRevenue) * 100;
                        return `${gpPercentage.toFixed(1)}%`;
                      })()}
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
