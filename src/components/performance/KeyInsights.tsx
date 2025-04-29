
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStore } from '@/lib/store';
import { formatCurrency, formatPercentage } from '@/lib/date-utils';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { 
  fetchTrackerDataByMonth, 
  getTrackerSummaryByMonth,
  fetchTrackerPurchases,
  fetchTrackerCreditNotes 
} from '@/services/kitchen-service';
import { TrackerSummary, ModuleType } from '@/types/kitchen-ledger';
import { calculateGrossProfit } from '@/utils/finance-utils';

interface WeeklySummary {
  week: string;
  foodRevenue: number;
  bevRevenue: number;
  revenue: number;
  foodGP: number;
  bevGP: number;
  combinedGP: number;
}

export default function KeyInsights() {
  const { currentYear, currentMonth } = useStore();
  const [revenueData, setRevenueData] = useState<WeeklySummary[]>([]);
  const [gpData, setGpData] = useState<WeeklySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  const { 
    data: foodSummary,
    isLoading: isFoodLoading 
  } = useQuery<TrackerSummary>({
    queryKey: ['tracker-summary', currentYear, currentMonth, 'food'],
    queryFn: () => getTrackerSummaryByMonth(currentYear, currentMonth, 'food'),
    staleTime: 10 * 60 * 1000
  });

  const { 
    data: bevSummary,
    isLoading: isBevLoading 
  } = useQuery<TrackerSummary>({
    queryKey: ['tracker-summary', currentYear, currentMonth, 'beverage'],
    queryFn: () => getTrackerSummaryByMonth(currentYear, currentMonth, 'beverage'),
    staleTime: 10 * 60 * 1000
  });

  const { data: prevFoodSummary } = useQuery<TrackerSummary>({
    queryKey: ['tracker-summary', prevYear, prevMonth, 'food'],
    queryFn: () => getTrackerSummaryByMonth(prevYear, prevMonth, 'food'),
    staleTime: 10 * 60 * 1000
  });

  const { data: prevBevSummary } = useQuery<TrackerSummary>({
    queryKey: ['tracker-summary', prevYear, prevMonth, 'beverage'],
    queryFn: () => getTrackerSummaryByMonth(prevYear, prevMonth, 'beverage'),
    staleTime: 10 * 60 * 1000
  });

  const { data: foodTrackerData } = useQuery({
    queryKey: ['tracker-data', currentYear, currentMonth, 'food'],
    queryFn: () => fetchTrackerDataByMonth(currentYear, currentMonth, 'food'),
    staleTime: 10 * 60 * 1000
  });

  const { data: bevTrackerData } = useQuery({
    queryKey: ['tracker-data', currentYear, currentMonth, 'beverage'],
    queryFn: () => fetchTrackerDataByMonth(currentYear, currentMonth, 'beverage'),
    staleTime: 10 * 60 * 1000
  });

  useEffect(() => {
    setIsLoading(isFoodLoading || isBevLoading);
    
    if (foodTrackerData && bevTrackerData) {
      processWeeklyData();
    }
  }, [foodTrackerData, bevTrackerData, isFoodLoading, isBevLoading]);

  const processWeeklyData = async () => {
    try {
      const foodWeekMap: Record<string, { revenue: number, cost: number }> = {};
      const bevWeekMap: Record<string, { revenue: number, cost: number }> = {};
      
      if (foodTrackerData && foodTrackerData.length > 0) {
        console.log("Processing food tracker data by week:", foodTrackerData);
        
        for (const day of foodTrackerData) {
          if (!day.date) continue;
          
          const weekNum = day.week_number || Math.ceil(new Date(day.date).getDate() / 7);
          const weekKey = `Week ${weekNum}`;
          
          if (!foodWeekMap[weekKey]) {
            foodWeekMap[weekKey] = { revenue: 0, cost: 0 };
          }
          
          const revenue = Number(day.revenue) || 0;
          foodWeekMap[weekKey].revenue += revenue;
          console.log(`Added food revenue for ${day.date} (${weekKey}): ${revenue}`);
        }
        
        for (const day of foodTrackerData) {
          if (!day.date) continue;
          
          const weekNum = day.week_number || Math.ceil(new Date(day.date).getDate() / 7);
          const weekKey = `Week ${weekNum}`;
          
          try {
            const purchases = await fetchTrackerPurchases(day.id);
            const creditNotes = await fetchTrackerCreditNotes(day.id);
            
            const purchasesTotal = purchases.reduce((sum, p) => sum + Number(p.amount || 0), 0);
            const creditNotesTotal = creditNotes.reduce((sum, cn) => sum + Number(cn.amount || 0), 0);
            const staffFood = Number(day.staff_food_allowance) || 0;
            
            const dayCost = purchasesTotal - creditNotesTotal + staffFood;
            foodWeekMap[weekKey].cost += dayCost;
            console.log(`Added food cost for ${day.date} (${weekKey}): ${dayCost}`);
          } catch (error) {
            console.error(`Error processing food costs for day ${day.date}:`, error);
          }
        }
      }
      
      if (bevTrackerData && bevTrackerData.length > 0) {
        console.log("Processing beverage tracker data by week:", bevTrackerData);
        
        for (const day of bevTrackerData) {
          if (!day.date) continue;
          
          const weekNum = day.week_number || Math.ceil(new Date(day.date).getDate() / 7);
          const weekKey = `Week ${weekNum}`;
          
          if (!bevWeekMap[weekKey]) {
            bevWeekMap[weekKey] = { revenue: 0, cost: 0 };
          }
          
          const revenue = Number(day.revenue) || 0;
          bevWeekMap[weekKey].revenue += revenue;
          console.log(`Added beverage revenue for ${day.date} (${weekKey}): ${revenue}`);
        }
        
        for (const day of bevTrackerData) {
          if (!day.date) continue;
          
          const weekNum = day.week_number || Math.ceil(new Date(day.date).getDate() / 7);
          const weekKey = `Week ${weekNum}`;
          
          try {
            const purchases = await fetchTrackerPurchases(day.id);
            const creditNotes = await fetchTrackerCreditNotes(day.id);
            
            const purchasesTotal = purchases.reduce((sum, p) => sum + Number(p.amount || 0), 0);
            const creditNotesTotal = creditNotes.reduce((sum, cn) => sum + Number(cn.amount || 0), 0);
            const staffFood = Number(day.staff_food_allowance) || 0;
            
            const dayCost = purchasesTotal - creditNotesTotal + staffFood;
            bevWeekMap[weekKey].cost += dayCost;
            console.log(`Added beverage cost for ${day.date} (${weekKey}): ${dayCost}`);
          } catch (error) {
            console.error(`Error processing beverage costs for day ${day.date}:`, error);
          }
        }
      }
      
      const allWeekKeys = new Set([...Object.keys(foodWeekMap), ...Object.keys(bevWeekMap)]);
      
      const weeklyRevenueData: WeeklySummary[] = [];
      const weeklyGpData: WeeklySummary[] = [];
      
      const sortedWeeks = Array.from(allWeekKeys).sort((a, b) => {
        const aNum = parseInt(a.replace('Week ', ''));
        const bNum = parseInt(b.replace('Week ', ''));
        return aNum - bNum;
      });
      
      console.log("Food weekly data summary:", foodWeekMap);
      console.log("Beverage weekly data summary:", bevWeekMap);
      
      sortedWeeks.forEach(week => {
        const foodRevenue = foodWeekMap[week]?.revenue || 0;
        const foodCost = foodWeekMap[week]?.cost || 0;
        const bevRevenue = bevWeekMap[week]?.revenue || 0;
        const bevCost = bevWeekMap[week]?.cost || 0;
        
        // Calculate actual GP percentages from the true revenue and cost values
        const foodGP = calculateGrossProfit(foodRevenue, foodCost);
        const bevGP = calculateGrossProfit(bevRevenue, bevCost);
        const combinedRevenue = foodRevenue + bevRevenue;
        const combinedCosts = foodCost + bevCost;
        const combinedGP = calculateGrossProfit(combinedRevenue, combinedCosts);
        
        console.log(`${week} summary - Food: £${foodRevenue} (${foodGP.toFixed(1)}%), Bev: £${bevRevenue} (${bevGP.toFixed(1)}%), Combined: £${combinedRevenue} (${combinedGP.toFixed(1)}%)`);
        
        weeklyRevenueData.push({
          week,
          foodRevenue,
          bevRevenue,
          revenue: foodRevenue + bevRevenue,
          foodGP,
          bevGP,
          combinedGP
        });
        
        weeklyGpData.push({
          week,
          foodRevenue,
          bevRevenue,
          revenue: foodRevenue + bevRevenue,
          foodGP,
          bevGP,
          combinedGP
        });
      });
      
      setRevenueData(weeklyRevenueData);
      setGpData(weeklyGpData);
    } catch (error) {
      console.error("Error processing weekly data:", error);
    }
  };

  const combinedRevenue = (foodSummary?.revenue || 0) + (bevSummary?.revenue || 0);
  const combinedCost = (foodSummary?.cost || 0) + (bevSummary?.cost || 0);
  const combinedGP = combinedRevenue > 0 ? (combinedRevenue - combinedCost) / combinedRevenue : 0;
  
  const prevCombinedGP = prevFoodSummary && prevBevSummary
    ? ((prevFoodSummary.revenue + prevBevSummary.revenue) > 0
      ? ((prevFoodSummary.revenue + prevBevSummary.revenue) - (prevFoodSummary.cost + prevBevSummary.cost)) / 
        (prevFoodSummary.revenue + prevBevSummary.revenue)
      : 0)
    : 0;
  
  const gpTrend = combinedGP - prevCombinedGP;
  const gpTrendPercentage = prevCombinedGP ? (gpTrend / prevCombinedGP) * 100 : 0;

  const chartConfig = {
    revenue: { color: "#344861", label: "Revenue" },
    foodRevenue: { color: "#16A34A", label: "Food Revenue" },
    bevRevenue: { color: "#2563EB", label: "Beverage Revenue" },
    foodGP: { color: "#16A34A", label: "Food GP %" },
    bevGP: { color: "#2563EB", label: "Beverage GP %" },
    combinedGP: { color: "#9333EA", label: "Combined GP %" }
  };
  
  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-semibold text-tavern-blue flex items-center gap-2">
        <TrendingUp className="h-6 w-6" />
        Key Insights
      </h2>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="shadow-lg rounded-xl overflow-hidden border-none bg-gradient-to-br from-white to-gray-50">
              <CardHeader className="pb-2 border-b border-gray-100">
                <CardTitle className="text-lg font-medium animate-pulse bg-gray-200 h-6 w-32 rounded"></CardTitle>
              </CardHeader>
              <CardContent className="p-6 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-tavern-blue-light" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-lg rounded-xl overflow-hidden border-none bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="pb-2 border-b border-gray-100">
              <CardTitle className="text-lg font-medium flex items-center justify-between">
                <span>Monthly Revenue</span>
                {combinedRevenue > 0 && <TrendingUp className="h-5 w-5 text-green-500" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-tavern-blue">{formatCurrency(combinedRevenue)}</div>
              <div className="mt-2 space-y-1">
                <div className="text-muted-foreground flex items-center gap-1">
                  <span className="text-gray-500">Total Cost:</span>
                  <span className="font-medium">{formatCurrency(combinedCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <div className="flex flex-col">
                    <span className="text-gray-500">Food:</span> 
                    <span className="font-medium">{formatCurrency(foodSummary?.revenue || 0)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500">Beverage:</span> 
                    <span className="font-medium">{formatCurrency(bevSummary?.revenue || 0)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg rounded-xl overflow-hidden border-none bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="pb-2 border-b border-gray-100">
              <CardTitle className="text-lg font-medium flex items-center justify-between">
                <span>Gross Profit</span>
                {gpTrend >= 0 ? 
                  <TrendingUp className="h-5 w-5 text-green-500" /> : 
                  <TrendingDown className="h-5 w-5 text-red-500" />
                }
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-tavern-blue mb-2">{formatPercentage(combinedGP)}</div>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div className="flex flex-col">
                  <span className="text-gray-500 text-sm">Food GP:</span>
                  <span className="font-medium">{formatPercentage(foodSummary?.gpPercentage || 0)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-500 text-sm">Beverage GP:</span>
                  <span className="font-medium">{formatPercentage(bevSummary?.gpPercentage || 0)}</span>
                </div>
              </div>
              <div className={`flex items-center mt-2 text-xs ${gpTrend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {gpTrend >= 0 ? 
                  <ArrowUp className="h-3 w-3 mr-1" /> : 
                  <ArrowDown className="h-3 w-3 mr-1" />
                }
                {isNaN(gpTrendPercentage) || !isFinite(gpTrendPercentage) ? (
                  <span className="font-medium">No previous data</span>
                ) : (
                  <span className="font-medium">{Math.abs(gpTrendPercentage).toFixed(1)}% vs. last month</span>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg rounded-xl overflow-hidden border-none bg-gradient-to-br from-white to-gray-50 md:col-span-1 row-span-1">
            <CardHeader className="pb-2 border-b border-gray-100">
              <CardTitle className="text-lg font-medium">Current Performance</CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-col justify-center h-[calc(100%_-_3.5rem)]">
              <div className={`text-lg font-bold ${combinedGP >= 0.7 ? 'text-green-500' : combinedGP >= 0.65 ? 'text-amber-500' : 'text-red-500'}`}>
                {combinedGP >= 0.7 ? 'Excellent' : combinedGP >= 0.65 ? 'Good' : 'Needs Improvement'}
              </div>
              <p className="text-gray-500 text-sm mt-1">
                {combinedGP >= 0.7 ? 
                  'Your business is performing above target.' : 
                  combinedGP >= 0.65 ? 
                  'Your business is meeting expected levels.' : 
                  'Your business is below target levels.'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-lg rounded-xl overflow-hidden border-none bg-gradient-to-br from-white to-gray-50">
          <CardHeader className="border-b border-gray-100">
            <CardTitle>Weekly Revenue</CardTitle>
          </CardHeader>
          <CardContent className="p-4 h-72">
            {revenueData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                No data available for this month
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-full">
                <ResponsiveContainer>
                  <BarChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <XAxis dataKey="week" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="foodRevenue" name="Food" fill="var(--color-foodRevenue)" stackId="a" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="bevRevenue" name="Beverage" fill="var(--color-bevRevenue)" stackId="a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
        
        <Card className="shadow-lg rounded-xl overflow-hidden border-none bg-gradient-to-br from-white to-gray-50">
          <CardHeader className="border-b border-gray-100">
            <CardTitle>Weekly GP %</CardTitle>
          </CardHeader>
          <CardContent className="p-4 h-72">
            {gpData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                No data available for this month
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-full">
                <ResponsiveContainer>
                  <LineChart data={gpData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <XAxis dataKey="week" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="foodGP" 
                      name="Food GP" 
                      stroke="var(--color-foodGP)" 
                      strokeWidth={2} 
                      dot={{ r: 4 }}
                      activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="bevGP" 
                      name="Beverage GP" 
                      stroke="var(--color-bevGP)" 
                      strokeWidth={2} 
                      dot={{ r: 4 }}
                      activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="combinedGP" 
                      name="Combined GP" 
                      stroke="var(--color-combinedGP)" 
                      strokeWidth={2} 
                      dot={{ r: 4 }}
                      activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
