import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMonthRecord } from '@/lib/store';
import { Button } from '@/components/ui/button';
import MonthSelector from '@/components/MonthSelector';
import StatusBox from '@/components/StatusBox';
import { 
  calculateGP, 
  formatCurrency, 
  formatPercentage,
  getMonthName 
} from '@/lib/date-utils';
import { useToast } from '@/hooks/use-toast';
import { ModuleType } from '@/types/kitchen-ledger';
import { useQuery } from '@tanstack/react-query';
import { fetchTrackerDataByMonth, fetchTrackerPurchases, fetchTrackerCreditNotes, getTrackerSummaryByMonth } from '@/services/kitchen-service';
import { supabase } from '@/lib/supabase';
import { calculateGrossProfit } from '@/utils/finance-utils';

interface MonthSummaryProps {
  modulePrefix?: string;
  moduleType?: ModuleType;
}

interface WeekSummary {
  weekNumber: number;
  revenue: number;
  costs: number;
  gp: number;
}

interface ExtendedDailyRecord {
  revenue?: number;
  foodRevenue?: number;
  beverageRevenue?: number;
  purchases: Record<string, number>;
  creditNotes: number[];
  staffFoodAllowance: number;
}

export default function MonthSummary({ modulePrefix = "", moduleType = "food" }: MonthSummaryProps) {
  const { year: yearParam, month: monthParam } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentYear, setCurrentYear] = useState<number>(
    yearParam ? parseInt(yearParam) : new Date().getFullYear()
  );
  const [currentMonth, setCurrentMonth] = useState<number>(
    monthParam ? parseInt(monthParam) : new Date().getMonth() + 1
  );
  
  const monthRecord = useMonthRecord(currentYear, currentMonth, moduleType);
  const [weeklyData, setWeeklyData] = useState<WeekSummary[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCosts, setTotalCosts] = useState(0);
  const [gpPercentage, setGpPercentage] = useState(0);
  
  useEffect(() => {
    if (yearParam && monthParam) {
      setCurrentYear(parseInt(yearParam));
      setCurrentMonth(parseInt(monthParam));
    }
  }, [yearParam, monthParam]);
  
  const handleMonthChange = (year: number, month: number) => {
    setCurrentYear(year);
    setCurrentMonth(month);
    navigate(`/${moduleType}/month/${year}/${month}`);
  };
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // First, try to get the dashboard revenue data as it's the most accurate
        const { data: dashboardData, error: dashboardError } = await supabase.rpc(
          'get_monthly_revenue_summary',
          { 
            target_year: currentYear, 
            target_month: currentMonth,
            module_type: moduleType
          }
        );
        
        if (dashboardError) {
          console.error('Error fetching dashboard revenue data:', dashboardError);
        }
        
        let dashboardRevenue = 0;
        if (dashboardData && dashboardData.length > 0) {
          if (moduleType === 'food') {
            dashboardRevenue = dashboardData[0].total_food_revenue || 0;
          } else if (moduleType === 'beverage') {
            dashboardRevenue = dashboardData[0].total_beverage_revenue || 0;
          } else {
            dashboardRevenue = dashboardData[0].total_revenue || 0;
          }
          console.log(`Using dashboard revenue for ${currentYear}-${currentMonth} ${moduleType}: ${dashboardRevenue}`);
        }
        
        const trackerSummary = await getTrackerSummaryByMonth(currentYear, currentMonth, moduleType);
        
        // Determine which revenue figure to use - prioritize dashboard data
        const revenueToUse = dashboardRevenue > 0 ? dashboardRevenue : (trackerSummary ? trackerSummary.revenue : 0);
        console.log(`Final revenue to use: ${revenueToUse} (Dashboard: ${dashboardRevenue}, Tracker: ${trackerSummary ? trackerSummary.revenue : 0})`);
        
        if (trackerSummary && trackerSummary.totalCost > 0) {
          console.log(`Using tracker summary for ${currentYear}-${currentMonth}: Revenue=${revenueToUse}, Cost=${trackerSummary.totalCost}, GP=${trackerSummary.gpPercentage}%`);
          
          const { data: masterRecords, error: masterError } = await supabase
            .from('master_daily_records')
            .select('*')
            .eq('year', currentYear)
            .eq('month', currentMonth)
            .order('date');
            
          if (masterError) {
            console.error('Error fetching master records:', masterError);
            throw masterError;
          }
          
          console.log(`Found ${masterRecords.length} master records for ${currentYear}-${currentMonth}`);
          
          const trackerData = await fetchTrackerDataByMonth(currentYear, currentMonth, moduleType);
          
          const trackerByDate: Record<string, any> = {};
          for (const tracker of trackerData) {
            trackerByDate[tracker.date] = tracker;
          }
          
          const weekMap: Record<number, WeekSummary> = {};
          for (let i = 1; i <= 5; i++) {
            weekMap[i] = {
              weekNumber: i,
              revenue: 0,
              costs: 0,
              gp: 0
            };
          }
          
          let totalRevenueFromWeeks = 0;
          let totalCostsFromTrackers = 0;
          
          for (const record of masterRecords) {
            const weekNumber = record.week_number;
            
            if (!weekMap[weekNumber]) {
              console.log(`Creating missing week ${weekNumber} in map`);
              weekMap[weekNumber] = {
                weekNumber,
                revenue: 0,
                costs: 0,
                gp: 0
              };
            }
            
            const dayRevenue = moduleType === 'food' ? 
              Number(record.food_revenue) || 0 : 
              Number(record.beverage_revenue) || 0;
              
            weekMap[weekNumber].revenue += dayRevenue;
            totalRevenueFromWeeks += dayRevenue;
            
            const trackerRecord = trackerByDate[record.date];
            if (trackerRecord) {
              const purchases = await fetchTrackerPurchases(trackerRecord.id);
              const creditNotes = await fetchTrackerCreditNotes(trackerRecord.id);
              
              const purchasesTotal = purchases.reduce((sum, p) => sum + Number(p.amount || 0), 0);
              const creditNotesTotal = creditNotes.reduce((sum, cn) => sum + Number(cn.amount || 0), 0);
              const staffFoodAllowance = Number(trackerRecord.staff_food_allowance) || 0;
              
              const dayCost = purchasesTotal - creditNotesTotal + staffFoodAllowance;
              weekMap[weekNumber].costs += dayCost;
              totalCostsFromTrackers += dayCost;
              
              console.log(`${record.date} (Week ${weekNumber}): Revenue=${dayRevenue}, Cost=${dayCost}`);
            }
          }
          
          console.log(`Total costs calculated from trackers: ${totalCostsFromTrackers}`);
          
          // Distribute the total revenue based on the proportions from weekly data
          if (totalRevenueFromWeeks > 0) {
            Object.values(weekMap).forEach(week => {
              // Calculate each week's proportion of the total calculated revenue
              const weekRevenueProportion = totalRevenueFromWeeks > 0 ? week.revenue / totalRevenueFromWeeks : 0;
              // Distribute the actual revenue amount based on this proportion
              week.revenue = revenueToUse * weekRevenueProportion;
            });
          }
          
          // IMPORTANT FIX - Remove normalization of costs and calculate GP directly
          // Removed the normalization code and calculate GP for each week based on its actual revenue and costs
          Object.values(weekMap).forEach(week => {
            // Calculate the GP directly using calculateGrossProfit for consistency
            week.gp = calculateGrossProfit(week.revenue, week.costs);
            console.log(`Week ${week.weekNumber} GP calculation: (${week.revenue} - ${week.costs}) / ${week.revenue} = ${week.gp * 100}%`);
          });
          
          const weeklyDataArray = Object.values(weekMap).sort((a, b) => a.weekNumber - b.weekNumber);
          
          console.log('Weekly breakdown:', weeklyDataArray.map(w => 
            `Week ${w.weekNumber}: Revenue=${w.revenue}, Costs=${w.costs}, GP=${w.gp * 100}%`
          ));
          
          setWeeklyData(weeklyDataArray);
          setTotalRevenue(revenueToUse);
          setTotalCosts(trackerSummary.totalCost);
          setGpPercentage(calculateGrossProfit(revenueToUse, trackerSummary.totalCost));
          
          return;
        }
        
        // Fall back to calculate from master records if no tracker summary
        const { data: masterRecords, error: masterError } = await supabase
          .from('master_daily_records')
          .select('*')
          .eq('year', currentYear)
          .eq('month', currentMonth)
          .order('date');
          
        if (masterError) {
          console.error('Error fetching master records:', masterError);
          throw masterError;
        }
        
        console.log(`Found ${masterRecords.length} master records for ${currentYear}-${currentMonth}`);
        
        const trackerData = await fetchTrackerDataByMonth(currentYear, currentMonth, moduleType);
        
        const trackerByDate: Record<string, any> = {};
        for (const tracker of trackerData) {
          trackerByDate[tracker.date] = tracker;
        }
        
        const weekMap: Record<number, WeekSummary> = {};
        for (let i = 1; i <= 5; i++) {
          weekMap[i] = {
            weekNumber: i,
            revenue: 0,
            costs: 0,
            gp: 0
          };
        }
        
        let totalCostsFromTrackers = 0;
        let totalCalculatedRevenue = 0;
        
        for (const record of masterRecords) {
          const weekNumber = record.week_number;
          
          if (!weekMap[weekNumber]) {
            console.log(`Creating missing week ${weekNumber} in map`);
            weekMap[weekNumber] = {
              weekNumber,
              revenue: 0,
              costs: 0,
              gp: 0
            };
          }
          
          const dayRevenue = moduleType === 'food' ? 
            Number(record.food_revenue) || 0 : 
            Number(record.beverage_revenue) || 0;
            
          weekMap[weekNumber].revenue += dayRevenue;
          totalCalculatedRevenue += dayRevenue;
          
          const trackerRecord = trackerByDate[record.date];
          if (trackerRecord) {
            const purchases = await fetchTrackerPurchases(trackerRecord.id);
            const creditNotes = await fetchTrackerCreditNotes(trackerRecord.id);
            
            const purchasesTotal = purchases.reduce((sum, p) => sum + Number(p.amount || 0), 0);
            const creditNotesTotal = creditNotes.reduce((sum, cn) => sum + Number(cn.amount || 0), 0);
            const staffFoodAllowance = Number(trackerRecord.staff_food_allowance) || 0;
            
            const dayCost = purchasesTotal - creditNotesTotal + staffFoodAllowance;
            weekMap[weekNumber].costs += dayCost;
            totalCostsFromTrackers += dayCost;
            
            console.log(`${record.date} (Week ${weekNumber}): Revenue=${dayRevenue}, Cost=${dayCost}`);
          }
        }
        
        console.log(`Total costs calculated from trackers: ${totalCostsFromTrackers}`);
        console.log(`Total revenue calculated from master records: ${totalCalculatedRevenue}`);
        
        let monthTotalRevenue = 0;
        let monthTotalCosts = 0;
        
        // IMPORTANT FIX: Calculate GP directly based on each week's actual revenue and costs
        const weeklyDataArray: WeekSummary[] = Object.values(weekMap).map(week => {
          monthTotalRevenue += week.revenue;
          monthTotalCosts += week.costs;
          
          // Use calculateGrossProfit from finance-utils for consistency
          const weekGp = calculateGrossProfit(week.revenue, week.costs);
          console.log(`Week ${week.weekNumber} (fallback) GP calculation: (${week.revenue} - ${week.costs}) / ${week.revenue} = ${weekGp * 100}%`);
          
          return {
            ...week,
            gp: weekGp
          };
        });
        
        weeklyDataArray.sort((a, b) => a.weekNumber - b.weekNumber);
        
        console.log('Weekly breakdown (fallback):', weeklyDataArray.map(w => 
          `Week ${w.weekNumber}: Revenue=${w.revenue}, Costs=${w.costs}, GP=${w.gp * 100}%`
        ));
        
        setWeeklyData(weeklyDataArray);
        setTotalRevenue(monthTotalRevenue);
        setTotalCosts(monthTotalCosts);
        setGpPercentage(calculateGrossProfit(monthTotalRevenue, monthTotalCosts));
        
      } catch (error) {
        console.error("Error calculating from master records:", error);
        toast({
          title: "Error loading data",
          description: "There was a problem loading the month summary",
          variant: "destructive",
        });
        
        const calculateFromLocalStore = () => {
          const weekMap: Record<number, WeekSummary> = {};
          for (let i = 1; i <= 5; i++) {
            weekMap[i] = {
              weekNumber: i,
              revenue: 0,
              costs: 0,
              gp: 0
            };
          }
          
          let totalCostsFromLocal = 0;
          let totalRevenueFromLocal = 0;
          
          monthRecord.weeks.forEach(week => {
            const weekNumber = week.weekNumber;
            let weekRevenue = 0;
            let weekCosts = 0;
            
            week.days.forEach(day => {
              let dayRevenue = 0;
              const dayRecord = day as unknown as ExtendedDailyRecord;
              
              if (typeof dayRecord.revenue === 'number') {
                dayRevenue = dayRecord.revenue;
              } else {
                if (moduleType === 'food' && typeof dayRecord.foodRevenue === 'number') {
                  dayRevenue = dayRecord.foodRevenue;
                } else if (moduleType === 'beverage' && typeof dayRecord.beverageRevenue === 'number') {
                  dayRevenue = dayRecord.beverageRevenue;
                }
              }
              
              weekRevenue += dayRevenue;
              totalRevenueFromLocal += dayRevenue;
              
              const dayCosts = Object.values(day.purchases).reduce((sum, amount) => sum + amount, 0);
              const creditNotes = day.creditNotes.reduce((sum, credit) => sum + credit, 0);
              const dayCostNet = dayCosts - creditNotes + day.staffFoodAllowance;
              
              weekCosts += dayCostNet;
              totalCostsFromLocal += dayCostNet;
              
              console.log(`Local calculation date (Week ${weekNumber}): Revenue=${dayRevenue}, Cost=${dayCostNet}`);
            });
            
            if (!weekMap[weekNumber]) {
              weekMap[weekNumber] = {
                weekNumber,
                revenue: 0,
                costs: 0,
                gp: 0
              };
            }
            
            weekMap[weekNumber].revenue += weekRevenue;
            weekMap[weekNumber].costs += weekCosts;
            
            // IMPORTANT FIX: Use consistent GP calculation
            weekMap[weekNumber].gp = calculateGrossProfit(weekMap[weekNumber].revenue, weekMap[weekNumber].costs);
            console.log(`Week ${weekNumber} (local) GP calculation: (${weekMap[weekNumber].revenue} - ${weekMap[weekNumber].costs}) / ${weekMap[weekNumber].revenue} = ${weekMap[weekNumber].gp * 100}%`);
          });
          
          console.log(`Total costs calculated from local store: ${totalCostsFromLocal}`);
          console.log(`Total revenue calculated from local store: ${totalRevenueFromLocal}`);
          
          const localWeeklyData = Object.values(weekMap).sort((a, b) => a.weekNumber - b.weekNumber);
          
          let localTotalRevenue = 0;
          let localTotalCosts = 0;
          
          localWeeklyData.forEach(week => {
            localTotalRevenue += week.revenue;
            localTotalCosts += week.costs;
          });
          
          console.log('Local weekly breakdown:', localWeeklyData.map(w => 
            `Week ${w.weekNumber}: Revenue=${w.revenue}, Costs=${w.costs}, GP=${w.gp * 100}%`
          ));
          
          setWeeklyData(localWeeklyData);
          setTotalRevenue(localTotalRevenue);
          setTotalCosts(localTotalCosts);
          setGpPercentage(calculateGrossProfit(localTotalRevenue, localTotalCosts));
        };
        
        calculateFromLocalStore();
      }
    };
    
    fetchData();
  }, [currentYear, currentMonth, toast, moduleType, monthRecord]);
  
  const gpDifference = gpPercentage - monthRecord.gpTarget;
  const gpStatus = 
    gpPercentage >= monthRecord.gpTarget ? 'good' : 
    gpPercentage >= monthRecord.gpTarget - 0.02 ? 'warning' : 
    'bad';

  const targetSpend = totalRevenue * monthRecord.costTarget;
  const spendDifference = targetSpend - totalCosts;
  const spendStatus = 
    spendDifference >= 0 ? 'good' : 
    spendDifference >= -targetSpend * 0.05 ? 'warning' : 
    'bad';

  const pageTitle = modulePrefix ? `${modulePrefix} Monthly Summary` : "Monthly Summary";
  const costLabel = moduleType === 'food' ? 'Food Costs' : moduleType === 'beverage' ? 'Beverage Costs' : 'Costs';
  
  const getGpColorClass = (gp: number) => {
    return gp >= monthRecord.gpTarget 
      ? 'text-green-600' 
      : gp >= monthRecord.gpTarget - 0.03 
        ? 'text-amber-600' 
        : 'text-red-600';
  };
  
  const getTotalGpBackgroundClass = (gp: number) => {
    return gp >= monthRecord.gpTarget 
      ? 'bg-gradient-to-r from-green-500/20 to-green-400/30' 
      : gp >= monthRecord.gpTarget - 0.03 
        ? 'bg-gradient-to-r from-amber-500/20 to-amber-400/30' 
        : 'bg-gradient-to-r from-red-500/20 to-red-400/30';
  };
  
  return (
    <div className="container py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-tavern-blue">
          {pageTitle} - {getMonthName(currentMonth)} {currentYear}
        </h1>
        <MonthSelector 
          currentYear={currentYear} 
          currentMonth={currentMonth}
          onChangeMonth={handleMonthChange} 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatusBox 
          label="Month-to-Date GP %" 
          value={formatPercentage(gpPercentage)} 
          status={gpStatus} 
          gpMode={true} 
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
          gpMode={true} 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatusBox 
          label={`Total ${moduleType === 'food' ? 'Food' : moduleType === 'beverage' ? 'Beverage' : ''} Revenue`}
          value={formatCurrency(totalRevenue)} 
          status="neutral" 
        />
        <StatusBox 
          label={`Total ${costLabel}`}
          value={formatCurrency(totalCosts)} 
          status="neutral" 
        />
        <StatusBox 
          label={spendDifference >= 0 ? "Underspending by" : "Overspending by"} 
          value={formatCurrency(Math.abs(spendDifference))} 
          status={spendStatus} 
          gpMode={true} 
        />
      </div>

      <Card className="rounded-xl shadow-md border-tavern-blue-light/20 overflow-hidden bg-white backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-[#F3E5F5]/50 to-[#E6F2FF]/50 border-b border-tavern-blue-light/20">
          <CardTitle className="text-tavern-blue-dark text-xl font-bold">Weekly Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {weeklyData.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">No weekly data available</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <th className="py-3 px-4 text-left font-semibold text-tavern-blue-dark border-b border-gray-200">Week</th>
                    <th className="py-3 px-4 text-right font-semibold text-tavern-blue-dark border-b border-gray-200">Revenue</th>
                    <th className="py-3 px-4 text-right font-semibold text-tavern-blue-dark border-b border-gray-200">{costLabel}</th>
                    <th className="py-3 px-4 text-right font-semibold text-tavern-blue-dark border-b border-gray-200">GP %</th>
                    <th className="py-3 px-4 text-center font-semibold text-tavern-blue-dark border-b border-gray-200">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyData.map((week) => (
                    <tr key={week.weekNumber} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 border-b border-gray-100 font-medium">Week {week.weekNumber}</td>
                      <td className="py-3 px-4 text-right border-b border-gray-100">{formatCurrency(week.revenue)}</td>
                      <td className="py-3 px-4 text-right border-b border-gray-100">{formatCurrency(week.costs)}</td>
                      <td className={`py-3 px-4 text-right border-b border-gray-100 font-semibold ${getGpColorClass(week.gp)}`}>
                        {formatPercentage(week.gp)}
                      </td>
                      <td className="py-3 px-4 text-center border-b border-gray-100">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          asChild 
                          className="rounded-full bg-white shadow-sm border-purple-300 text-purple-700 hover:bg-purple-50 hover:text-purple-800 transition-all"
                        >
                          <Link to={`/${moduleType}/week/${currentYear}/${currentMonth}/${week.weekNumber}`}>
                            Dive In
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="py-3 px-4 border-t border-gray-200 font-semibold bg-gray-50">Total</td>
                    <td className="py-3 px-4 text-right border-t border-gray-200 font-semibold bg-gray-50">
                      {formatCurrency(totalRevenue)}
                    </td>
                    <td className="py-3 px-4 text-right border-t border-gray-200 font-semibold bg-gray-50">
                      {formatCurrency(totalCosts)}
                    </td>
                    <td className={`py-3 px-4 text-right border-t border-gray-200 font-bold ${getTotalGpBackgroundClass(gpPercentage)} ${getGpColorClass(gpPercentage)}`}>
                      {formatPercentage(gpPercentage)}
                    </td>
                    <td className="py-3 px-4 text-center border-t border-gray-200 bg-gray-50"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
