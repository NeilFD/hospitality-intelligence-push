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
  
  const generateAllWeeksForMonth = (): WeekSummary[] => {
    const totalWeeks = 5;
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
  
  useEffect(() => {
    const fetchData = async () => {
      try {
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
        
        for (const record of masterRecords) {
          const weekNumber = record.week_number;
          
          const dayRevenue = moduleType === 'food' ? 
            Number(record.food_revenue) || 0 : 
            Number(record.beverage_revenue) || 0;
            
          weekMap[weekNumber].revenue += dayRevenue;
          
          const trackerRecord = trackerByDate[record.date];
          if (trackerRecord) {
            const purchases = await fetchTrackerPurchases(trackerRecord.id);
            const creditNotes = await fetchTrackerCreditNotes(trackerRecord.id);
            
            const purchasesTotal = purchases.reduce((sum, p) => sum + Number(p.amount || 0), 0);
            const creditNotesTotal = creditNotes.reduce((sum, cn) => sum + Number(cn.amount || 0), 0);
            const staffFoodAllowance = Number(trackerRecord.staff_food_allowance) || 0;
            
            const dayCost = purchasesTotal - creditNotesTotal + staffFoodAllowance;
            weekMap[weekNumber].costs += dayCost;
            
            console.log(`${record.date} (Week ${weekNumber}): Revenue=${dayRevenue}, Cost=${dayCost}`);
          }
        }
        
        let monthTotalRevenue = 0;
        let monthTotalCosts = 0;
        
        const weeklyDataArray: WeekSummary[] = Object.values(weekMap).map(week => {
          monthTotalRevenue += week.revenue;
          monthTotalCosts += week.costs;
          
          return {
            ...week,
            gp: calculateGP(week.revenue, week.costs)
          };
        });
        
        weeklyDataArray.sort((a, b) => a.weekNumber - b.weekNumber);
        
        console.log('Weekly breakdown:', weeklyDataArray.map(w => 
          `Week ${w.weekNumber}: Revenue=${w.revenue}, Costs=${w.costs}, GP=${w.gp}`
        ));
        
        setWeeklyData(weeklyDataArray);
        setTotalRevenue(monthTotalRevenue);
        setTotalCosts(monthTotalCosts);
        setGpPercentage(calculateGP(monthTotalRevenue, monthTotalCosts));
        
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
          
          monthRecord.weeks.forEach(week => {
            const weekNumber = week.weekNumber;
            let weekRevenue = 0;
            let weekCosts = 0;
            
            week.days.forEach(day => {
              weekRevenue += day.revenue;
              
              const dayCosts = Object.values(day.purchases).reduce((sum, amount) => sum + amount, 0);
              const creditNotes = day.creditNotes.reduce((sum, credit) => sum + credit, 0);
              weekCosts += dayCosts - creditNotes + day.staffFoodAllowance;
            });
            
            weekMap[weekNumber] = {
              weekNumber,
              revenue: weekRevenue,
              costs: weekCosts,
              gp: calculateGP(weekRevenue, weekCosts)
            };
          });
          
          const localWeeklyData = Object.values(weekMap).sort((a, b) => a.weekNumber - b.weekNumber);
          
          let localTotalRevenue = 0;
          let localTotalCosts = 0;
          
          localWeeklyData.forEach(week => {
            localTotalRevenue += week.revenue;
            localTotalCosts += week.costs;
          });
          
          setWeeklyData(localWeeklyData);
          setTotalRevenue(localTotalRevenue);
          setTotalCosts(localTotalCosts);
          setGpPercentage(calculateGP(localTotalRevenue, localTotalCosts));
        };
        
        calculateFromLocalStore();
      }
    };
    
    fetchData();
  }, [currentYear, currentMonth, toast, moduleType]);
  
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

      <Card className="rounded-xl shadow-md border-tavern-blue-light/20 overflow-hidden bg-tavern-blue-light/5 backdrop-blur-sm">
        <CardHeader className="bg-white/40 border-b border-tavern-blue-light/20">
          <CardTitle>Weekly Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {weeklyData.length === 0 ? (
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
                        week.gp >= monthRecord.gpTarget ? 'text-green-600' : 
                        week.gp >= monthRecord.gpTarget - 0.03 ? 'text-amber-600' : 
                        'text-red-600'
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
                      'bg-tavern-red/50'
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
