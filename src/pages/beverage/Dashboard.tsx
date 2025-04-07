
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStore } from '@/lib/store';
import StatusBox from '@/components/StatusBox';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { formatCurrency, formatPercentage, calculateGP } from '@/lib/date-utils';
import { useQuery } from '@tanstack/react-query';
import { fetchTrackerDataByMonth, fetchTrackerPurchases, fetchTrackerCreditNotes } from '@/services/kitchen-service';
import { supabase } from '@/lib/supabase';

export default function BeverageDashboard() {
  const {
    annualRecord,
    currentYear,
    currentMonth
  } = useStore();
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [gpPercentage, setGpPercentage] = useState(0);
  const [currentMonthRevenue, setCurrentMonthRevenue] = useState(0);
  const [currentMonthCost, setCurrentMonthCost] = useState(0);
  const [currentMonthGP, setCurrentMonthGP] = useState(0);
  
  // Fetch tracker data for the current month
  const { data: trackerData, isLoading: isLoadingTracker } = useQuery({
    queryKey: ['tracker-data', currentYear, currentMonth, 'beverage'],
    queryFn: async () => {
      return await fetchTrackerDataByMonth(currentYear, currentMonth, 'beverage');
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Calculate values based on tracker data from Supabase
  useEffect(() => {
    const calculateFromTrackerData = async () => {
      if (!trackerData || trackerData.length === 0) {
        // Fall back to local store data if no tracker data
        calculateFromLocalStore();
        return;
      }

      try {
        let monthRev = 0;
        let monthCost = 0;
        
        // Process each tracker day
        for (const day of trackerData) {
          monthRev += Number(day.revenue) || 0;
          
          // Fetch purchases for this tracker day
          const purchases = await fetchTrackerPurchases(day.id);
          const dayPurchases = purchases.reduce((sum, p) => sum + Number(p.amount), 0);
          monthCost += dayPurchases;
          
          // Fetch credit notes for this tracker day
          const creditNotes = await fetchTrackerCreditNotes(day.id);
          const dayCreditNotes = creditNotes.reduce((sum, cn) => sum + Number(cn.amount), 0);
          monthCost -= dayCreditNotes; // Subtract credit notes from cost
        }
        
        setCurrentMonthRevenue(monthRev);
        setCurrentMonthCost(monthCost);
        setCurrentMonthGP(calculateGP(monthRev, monthCost));
        
        // Calculate annual totals
        let annualRevenue = 0;
        let annualCost = 0;
        
        // Fetch data for all months in the current year
        for (let month = 1; month <= 12; month++) {
          const monthData = await fetchTrackerDataByMonth(currentYear, month, 'beverage');
          
          for (const day of monthData) {
            annualRevenue += Number(day.revenue) || 0;
            
            // Fetch purchases for this tracker day
            const purchases = await fetchTrackerPurchases(day.id);
            const dayPurchases = purchases.reduce((sum, p) => sum + Number(p.amount), 0);
            annualCost += dayPurchases;
            
            // Fetch credit notes for this tracker day
            const creditNotes = await fetchTrackerCreditNotes(day.id);
            const dayCreditNotes = creditNotes.reduce((sum, cn) => sum + Number(cn.amount), 0);
            annualCost -= dayCreditNotes; // Subtract credit notes from cost
          }
        }
        
        setTotalRevenue(annualRevenue);
        setTotalCost(annualCost);
        setGpPercentage(calculateGP(annualRevenue, annualCost));
        
      } catch (error) {
        console.error("Error calculating from tracker data:", error);
        // Fall back to local store data if there was an error
        calculateFromLocalStore();
      }
    };
    
    // Fallback to local store data if needed
    const calculateFromLocalStore = () => {
      let revenue = 0;
      let cost = 0;
      let monthRevenue = 0;
      let monthCost = 0;
      
      annualRecord.months.forEach(month => {
        month.weeks.forEach(week => {
          week.days.forEach(day => {
            revenue += day.revenue;

            const dayPurchases = Object.values(day.purchases).reduce((sum, amount) => sum + Number(amount), 0);
            cost += dayPurchases;

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
    };

    // Execute the calculations
    calculateFromTrackerData();
    
  }, [trackerData, annualRecord, currentYear, currentMonth]);

  const getGpStatus = (gp: number, target: number) => {
    if (gp >= target) return 'good';
    if (gp >= target - 0.05) return 'warning';
    return 'bad';
  };

  return (
    <div className="container py-4 space-y-4">
      <h1 className="text-3xl font-bold text-tavern-blue mb-4 text-center">Beverage Tracker Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-md border-tavern-blue-light/20 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 bg-tavern-blue-light/5 backdrop-blur-sm">
          <CardHeader className="pb-2 border-b border-tavern-blue-light/20 bg-white/40">
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
                label="Beverage Cost" 
                value={formatCurrency(currentMonthCost)} 
                status="neutral" 
                className="h-28" 
              />
            </div>
            <StatusBox 
              label="GP Percentage" 
              value={formatPercentage(currentMonthGP)} 
              status={getGpStatus(currentMonthGP, 0.68)}
              gpMode={true} 
              className="w-full h-24" 
            />
            <Button asChild className="w-full bg-tavern-blue hover:bg-tavern-blue-dark rounded-lg shadow-sm transition-all duration-300">
              <Link to={`/beverage/month/${currentYear}/${currentMonth}`}>
                View Month Details <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-md border-tavern-blue-light/20 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 bg-tavern-blue-light/5 backdrop-blur-sm">
          <CardHeader className="pb-2 border-b border-tavern-blue-light/20 bg-white/40">
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
                label="Total Beverage Cost" 
                value={formatCurrency(totalCost)} 
                status="neutral" 
                className="h-28" 
              />
            </div>
            <StatusBox 
              label="GP Percentage" 
              value={formatPercentage(gpPercentage)} 
              status={getGpStatus(gpPercentage, 0.68)}
              gpMode={true} 
              className="w-full h-24" 
            />
            <Button asChild variant="outline" className="w-full border-tavern-blue text-tavern-blue hover:bg-tavern-blue hover:text-white rounded-lg shadow-sm transition-all duration-300">
              <Link to="/beverage/annual-summary">
                View Annual Summary <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
