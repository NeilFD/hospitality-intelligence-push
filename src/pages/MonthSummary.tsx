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

export default function MonthSummary() {
  const { year: yearParam, month: monthParam } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentYear, setCurrentYear] = useState<number>(
    yearParam ? parseInt(yearParam) : new Date().getFullYear()
  );
  const [currentMonth, setCurrentMonth] = useState<number>(
    monthParam ? parseInt(monthParam) : new Date().getMonth() + 1
  );
  
  const monthRecord = useMonthRecord(currentYear, currentMonth);
  
  useEffect(() => {
    if (yearParam && monthParam) {
      setCurrentYear(parseInt(yearParam));
      setCurrentMonth(parseInt(monthParam));
    }
  }, [yearParam, monthParam]);
  
  const handleMonthChange = (year: number, month: number) => {
    setCurrentYear(year);
    setCurrentMonth(month);
    navigate(`/month/${year}/${month}`);
  };
  
  const totalRevenue = monthRecord.weeks.reduce((sum, week) => {
    const weekRevenue = week.days.reduce((daySum, day) => daySum + day.revenue, 0);
    return sum + weekRevenue;
  }, 0);
  
  const totalCosts = monthRecord.weeks.reduce((sum, week) => {
    const weekCosts = week.days.reduce((daySum, day) => {
      const dayCosts = Object.values(day.purchases).reduce((purchaseSum, amount) => purchaseSum + amount, 0);
      const creditNotes = day.creditNotes.reduce((creditSum, credit) => creditSum + credit, 0);
      return daySum + dayCosts - creditNotes + day.staffFoodAllowance;
    }, 0);
    return sum + weekCosts;
  }, 0);
  
  const gpPercentage = calculateGP(totalRevenue, totalCosts);
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

  const weeklyData = monthRecord.weeks.map(week => {
    const weekRevenue = week.days.reduce((sum, day) => sum + day.revenue, 0);
    
    const weekCosts = week.days.reduce((sum, day) => {
      const dayCosts = Object.values(day.purchases).reduce((purchaseSum, amount) => purchaseSum + amount, 0);
      const creditNotes = day.creditNotes.reduce((creditSum, credit) => creditSum + credit, 0);
      return sum + dayCosts - creditNotes + day.staffFoodAllowance;
    }, 0);
    
    const weekGp = calculateGP(weekRevenue, weekCosts);
    
    return {
      weekNumber: week.weekNumber,
      revenue: weekRevenue,
      costs: weekCosts,
      gp: weekGp
    };
  });

  return (
    <div className="container py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-tavern-blue">
          Monthly Summary - {getMonthName(currentMonth)} {currentYear}
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
          label="Total Food Revenue" 
          value={formatCurrency(totalRevenue)} 
          status="neutral" 
        />
        <StatusBox 
          label="Total Food Costs" 
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
          <div className="overflow-x-auto rounded-lg">
            <table className="w-full border-collapse rounded-lg overflow-hidden">
              <thead>
                <tr>
                  <th className="table-header rounded-tl-lg">Week</th>
                  <th className="table-header">Revenue</th>
                  <th className="table-header">Food Costs</th>
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
                        <Link to={`/week/${currentYear}/${currentMonth}/${week.weekNumber}`}>
                          View Details
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
        </CardContent>
      </Card>
    </div>
  );
}
