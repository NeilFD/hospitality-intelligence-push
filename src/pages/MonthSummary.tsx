
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
import { fetchTrackerDataByMonth, fetchTrackerPurchases, fetchTrackerCreditNotes } from '@/services/kitchen-service';

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
  
  // Fetch tracker data from Supabase
  const { data: trackerData, isLoading: isLoadingTracker } = useQuery({
    queryKey: ['tracker-data', currentYear, currentMonth, moduleType],
    queryFn: async () => {
      return await fetchTrackerDataByMonth(currentYear, currentMonth, moduleType);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
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
  
  // Function to generate all weeks for the current month
  const generateAllWeeksForMonth = (): WeekSummary[] => {
    // Get the number of weeks in the month
    const totalWeeks = 5; // Most months have 4-5 weeks
    const allWeeks: WeekSummary[] = [];
    
    for (let i = 1; i <= totalWeeks; i++) {
      allWeeks.push({
        weekNumber: i,
        revenue: 0,
        costs: 0,
        gp: 0
      });
    }
    
    return allWeeks;
  };
  
  // Calculate summary data from tracker data or fall back to local store
  useEffect(() => {
    const calculateFromTrackerData = async () => {
      if (!trackerData || trackerData.length === 0) {
        // Fall back to local store if no tracker data
        calculateFromLocalStore();
        return;
      }

      try {
        let monthRev = 0;
        let monthCost = 0;
        const weekSummaries: Record<number, WeekSummary> = {};
        
        // Initialize week summaries for all weeks of the month
        const allWeeks = generateAllWeeksForMonth();
        allWeeks.forEach(week => {
          weekSummaries[week.weekNumber] = week;
        });
        
        // Process each tracker day
        for (const day of trackerData) {
          // Add revenue to week and month totals
          const revenue = Number(day.revenue) || 0;
          weekSummaries[day.week_number].revenue += revenue;
          monthRev += revenue;
          
          // Fetch purchases for this tracker day
          const purchases = await fetchTrackerPurchases(day.id);
          const dayCosts = purchases.reduce((sum, p) => sum + Number(p.amount), 0);
          
          // Fetch credit notes for this tracker day
          const creditNotes = await fetchTrackerCreditNotes(day.id);
          const dayCreditNotes = creditNotes.reduce((sum, cn) => sum + Number(cn.amount), 0);
          
          // Staff food allowance
          const staffFood = Number(day.staff_food_allowance) || 0;
          
          // Calculate net costs (purchases - credit notes + staff food)
          const netDayCosts = dayCosts - dayCreditNotes + staffFood;
          weekSummaries[day.week_number].costs += netDayCosts;
          monthCost += netDayCosts;
        }
        
        // Calculate GP for each week and create week array
        const weeklyDataArray = Object.values(weekSummaries).map(week => {
          week.gp = calculateGP(week.revenue, week.costs);
          return week;
        });
        
        // Sort by week number
        weeklyDataArray.sort((a, b) => a.weekNumber - b.weekNumber);
        
        setWeeklyData(weeklyDataArray);
        setTotalRevenue(monthRev);
        setTotalCosts(monthCost);
        setGpPercentage(calculateGP(monthRev, monthCost));
        
      } catch (error) {
        console.error("Error calculating from tracker data:", error);
        // Fall back to local store on error
        calculateFromLocalStore();
        toast({
          title: "Error loading tracker data",
          description: "Falling back to local data",
          variant: "destructive",
        });
      }
    };
    
    // Fallback to local store data if needed
    const calculateFromLocalStore = () => {
      // Create a mapping of week numbers to week data objects for proper processing
      const weekMap: Record<number, WeekSummary> = {};
      
      // Initialize all weeks in the month
      const allWeeks = generateAllWeeksForMonth();
      allWeeks.forEach(week => {
        weekMap[week.weekNumber] = week;
      });
      
      // Process each week in the month record
      monthRecord.weeks.forEach(week => {
        const weekRevenue = week.days.reduce((sum, day) => sum + day.revenue, 0);
        
        const weekCosts = week.days.reduce((sum, day) => {
          const dayCosts = Object.values(day.purchases).reduce((purchaseSum, amount) => purchaseSum + amount, 0);
          const creditNotes = day.creditNotes.reduce((creditSum, credit) => creditSum + credit, 0);
          return sum + dayCosts - creditNotes + day.staffFoodAllowance;
        }, 0);
        
        const weekGp = calculateGP(weekRevenue, weekCosts);
        
        // Store week data in the map using the week number as key
        weekMap[week.weekNumber] = {
          weekNumber: week.weekNumber,
          revenue: weekRevenue,
          costs: weekCosts,
          gp: weekGp
        };
      });
      
      // Convert the map to an array and sort by week number
      const localWeeklyData = Object.values(weekMap).sort((a, b) => a.weekNumber - b.weekNumber);
      
      const localTotalRevenue = monthRecord.weeks.reduce((sum, week) => {
        const weekRevenue = week.days.reduce((daySum, day) => daySum + day.revenue, 0);
        return sum + weekRevenue;
      }, 0);
      
      const localTotalCosts = monthRecord.weeks.reduce((sum, week) => {
        const weekCosts = week.days.reduce((daySum, day) => {
          const dayCosts = Object.values(day.purchases).reduce((purchaseSum, amount) => purchaseSum + amount, 0);
          const creditNotes = day.creditNotes.reduce((creditSum, credit) => creditSum + credit, 0);
          return daySum + dayCosts - creditNotes + day.staffFoodAllowance;
        }, 0);
        return sum + weekCosts;
      }, 0);
      
      setWeeklyData(localWeeklyData);
      setTotalRevenue(localTotalRevenue);
      setTotalCosts(localTotalCosts);
      setGpPercentage(calculateGP(localTotalRevenue, localTotalCosts));
    };

    // Execute the calculations
    calculateFromTrackerData();
    
  }, [trackerData, monthRecord, currentYear, currentMonth, toast]);
  
  const gpDifference = gpPercentage - monthRecord.gpTarget;
  const gpStatus = 
    gpDifference >= 0.02 ? 'good' : 
    gpDifference >= -0.02 ? 'warning' : 
    'bad';

  const targetSpend = totalRevenue * monthRecord.costTarget;
  const spendDifference = targetSpend - totalCosts;
  const spendStatus = 
    spendDifference >= 0 ? 'good' : 
    spendDifference >= -targetSpend * 0.05 ? 'warning' : 
    'bad';

  const pageTitle = modulePrefix ? `${modulePrefix} Monthly Summary` : "Monthly Summary";
  const costLabel = moduleType === 'food' ? 'Food Costs' : moduleType === 'beverage' ? 'Beverage Costs' : 'Costs';

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
        />
      </div>

      <Card className="rounded-xl shadow-md border-tavern-blue-light/20 overflow-hidden bg-tavern-blue-light/5 backdrop-blur-sm">
        <CardHeader className="bg-white/40 border-b border-tavern-blue-light/20">
          <CardTitle>Weekly Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {isLoadingTracker ? (
            <div className="py-10 text-center text-muted-foreground">Loading tracker data...</div>
          ) : weeklyData.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">No weekly data available</div>
          ) : (
            <div className="overflow-x-auto rounded-lg">
              <table className="w-full border-collapse rounded-lg overflow-hidden">
                <thead>
                  <tr>
                    <th className="table-header rounded-tl-lg">Week</th>
                    <th className="table-header">Revenue</th>
                    <th className="table-header">{costLabel}</th>
                    <th className="table-header">GP %</th>
                    <th className="table-header rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyData.map((week) => (
                    <tr key={week.weekNumber}>
                      <td className="table-cell">Week {week.weekNumber}</td>
                      <td className="table-cell">{formatCurrency(week.revenue)}</td>
                      <td className="table-cell">{formatCurrency(week.costs)}</td>
                      <td className={`table-cell ${
                        week.gp >= monthRecord.gpTarget ? 'text-tavern-green' : 
                        week.gp >= monthRecord.gpTarget - 0.03 ? 'text-tavern-amber' : 
                        'text-tavern-red'
                      }`}>
                        {formatPercentage(week.gp)}
                      </td>
                      <td className="table-cell">
                        <Button variant="outline" size="sm" asChild className="rounded-full shadow-sm hover:shadow transition-all">
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
                    <td className="table-header rounded-bl-lg">Total</td>
                    <td className="table-header">{formatCurrency(totalRevenue)}</td>
                    <td className="table-header">{formatCurrency(totalCosts)}</td>
                    <td className={`table-header ${
                      gpPercentage >= monthRecord.gpTarget ? 'bg-tavern-green-light/50' : 
                      gpPercentage >= monthRecord.gpTarget - 0.02 ? 'bg-tavern-amber/50' : 
                      'bg-tavern-blue-light/50 text-tavern-blue-dark'
                    } backdrop-blur-sm`}>
                      {formatPercentage(gpPercentage)}
                    </td>
                    <td className="table-header rounded-br-lg"></td>
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
