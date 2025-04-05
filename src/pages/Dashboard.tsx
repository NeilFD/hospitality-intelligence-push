
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStore } from '@/lib/store';
import StatusBox from '@/components/StatusBox';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { formatCurrency, formatPercentage, calculateGP } from '@/lib/date-utils';

export default function Dashboard() {
  const { annualRecord, currentYear, currentMonth } = useStore();
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [gpPercentage, setGpPercentage] = useState(0);
  const [currentMonthRevenue, setCurrentMonthRevenue] = useState(0);
  const [currentMonthCost, setCurrentMonthCost] = useState(0);
  const [currentMonthGP, setCurrentMonthGP] = useState(0);

  useEffect(() => {
    // Calculate totals across all months
    let revenue = 0;
    let cost = 0;

    // Calculate current month figures
    let monthRevenue = 0;
    let monthCost = 0;

    annualRecord.months.forEach(month => {
      month.weeks.forEach(week => {
        week.days.forEach(day => {
          // Add to total
          revenue += day.revenue;
          
          // Calculate total purchases for this day
          const dayPurchases = Object.values(day.purchases).reduce((sum, amount) => sum + Number(amount), 0);
          cost += dayPurchases;
          
          // If this is the current month, add to current month totals
          if (month.year === currentYear && month.month === currentMonth) {
            monthRevenue += day.revenue;
            monthCost += dayPurchases;
          }
        });
      });
    });

    setTotalRevenue(revenue);
    setTotalCost(cost);
    setGpPercentage(calculateGP(revenue, cost));

    setCurrentMonthRevenue(monthRevenue);
    setCurrentMonthCost(monthCost);
    setCurrentMonthGP(calculateGP(monthRevenue, monthCost));
  }, [annualRecord, currentYear, currentMonth]);

  const getGpStatus = (gp: number, target: number) => {
    if (gp >= target) return 'good';
    if (gp >= target - 0.05) return 'warning';
    return 'bad';
  };

  return (
    <div className="container py-8 space-y-8">
      <h1 className="text-3xl font-bold text-tavern-blue mb-6">The Tavern Kitchen Ledger</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="shadow-md border-tavern-blue-light/30 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-2 border-b border-tavern-blue-light/20 bg-gradient-to-r from-tavern-blue-light/30 to-tavern-blue-light/10">
            <CardTitle className="text-tavern-blue-dark text-xl">
              Current Month
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-2 gap-4">
              <StatusBox
                label="Revenue"
                value={formatCurrency(currentMonthRevenue)}
                status="neutral"
                className="h-28"
              />
              <StatusBox
                label="Food Cost"
                value={formatCurrency(currentMonthCost)}
                status="neutral"
                className="h-28"
              />
            </div>
            <StatusBox
              label="GP Percentage"
              value={formatPercentage(currentMonthGP)}
              status={getGpStatus(currentMonthGP, 0.68)}
              className="w-full h-24"
            />
            <Button asChild className="w-full bg-tavern-blue hover:bg-tavern-blue-dark rounded-lg shadow-sm transition-all duration-300">
              <Link to={`/month/${currentYear}/${currentMonth}`}>
                View Month Details <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-md border-tavern-blue-light/30 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-2 border-b border-tavern-blue-light/20 bg-gradient-to-r from-tavern-blue-light/30 to-tavern-blue-light/10">
            <CardTitle className="text-tavern-blue-dark text-xl">
              Annual Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-2 gap-4">
              <StatusBox
                label="Total Revenue"
                value={formatCurrency(totalRevenue)}
                status="neutral"
                className="h-28"
              />
              <StatusBox
                label="Total Food Cost"
                value={formatCurrency(totalCost)}
                status="neutral"
                className="h-28"
              />
            </div>
            <StatusBox
              label="GP Percentage"
              value={formatPercentage(gpPercentage)}
              status={getGpStatus(gpPercentage, 0.68)}
              className="w-full h-24"
            />
            <Button asChild variant="outline" className="w-full border-tavern-blue text-tavern-blue hover:bg-tavern-blue hover:text-white rounded-lg shadow-sm transition-all duration-300">
              <Link to="/annual-summary">
                View Annual Summary <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
