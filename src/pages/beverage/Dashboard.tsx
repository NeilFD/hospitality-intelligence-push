
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
    currentYear,
    currentMonth
  } = useStore();
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [gpPercentage, setGpPercentage] = useState(0);
  const [currentMonthRevenue, setCurrentMonthRevenue] = useState(0);
  const [currentMonthCost, setCurrentMonthCost] = useState(0);
  const [currentMonthGP, setCurrentMonthGP] = useState(0);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch master records for the current month as the single source of truth
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
        
        console.log(`Dashboard: Found ${masterRecords.length} master records for ${currentYear}-${currentMonth}`);
        
        // Fetch tracker data for costs
        const trackerData = await fetchTrackerDataByMonth(currentYear, currentMonth, 'beverage');
        
        const trackerByDate: Record<string, any> = {};
        for (const tracker of trackerData) {
          trackerByDate[tracker.date] = tracker;
        }
        
        let monthTotalRevenue = 0;
        let monthTotalCosts = 0;
        
        // Calculate revenue from master records and costs from tracker data
        for (const record of masterRecords) {
          const bevRevenue = Number(record.beverage_revenue) || 0;
          monthTotalRevenue += bevRevenue;
          
          const trackerRecord = trackerByDate[record.date];
          if (trackerRecord) {
            const purchases = await fetchTrackerPurchases(trackerRecord.id);
            const creditNotes = await fetchTrackerCreditNotes(trackerRecord.id);
            
            const purchasesTotal = purchases.reduce((sum, p) => sum + Number(p.amount || 0), 0);
            const creditNotesTotal = creditNotes.reduce((sum, cn) => sum + Number(cn.amount || 0), 0);
            const staffFoodAllowance = Number(trackerRecord.staff_food_allowance) || 0;
            
            const dayCost = purchasesTotal - creditNotesTotal + staffFoodAllowance;
            monthTotalCosts += dayCost;
          }
        }
        
        const monthGP = calculateGP(monthTotalRevenue, monthTotalCosts);
        
        console.log(`Dashboard: Beverage - Month Revenue: ${monthTotalRevenue}, Costs: ${monthTotalCosts}, GP: ${monthGP}`);
        
        // Now fetch annual data
        const { data: annualMasterRecords, error: annualError } = await supabase
          .from('master_daily_records')
          .select('*')
          .eq('year', currentYear)
          .order('date');
          
        if (annualError) {
          console.error('Error fetching annual master records:', annualError);
          throw annualError;
        }
        
        let annualRevenue = 0;
        let annualCosts = 0;
        
        // Get all tracker data for the year
        const annualTrackerData = await Promise.all(
          Array.from({ length: 12 }, (_, i) => i + 1).map(month => 
            fetchTrackerDataByMonth(currentYear, month, 'beverage')
          )
        );
        
        // Flatten the array of arrays
        const allTrackerData = annualTrackerData.flat();
        
        // Create a map of tracker data by date
        const allTrackerByDate: Record<string, any> = {};
        for (const tracker of allTrackerData) {
          allTrackerByDate[tracker.date] = tracker;
        }
        
        // Calculate annual totals
        for (const record of annualMasterRecords) {
          const bevRevenue = Number(record.beverage_revenue) || 0;
          annualRevenue += bevRevenue;
          
          const trackerRecord = allTrackerByDate[record.date];
          if (trackerRecord) {
            const purchases = await fetchTrackerPurchases(trackerRecord.id);
            const creditNotes = await fetchTrackerCreditNotes(trackerRecord.id);
            
            const purchasesTotal = purchases.reduce((sum, p) => sum + Number(p.amount || 0), 0);
            const creditNotesTotal = creditNotes.reduce((sum, cn) => sum + Number(cn.amount || 0), 0);
            const staffFoodAllowance = Number(trackerRecord.staff_food_allowance) || 0;
            
            const dayCost = purchasesTotal - creditNotesTotal + staffFoodAllowance;
            annualCosts += dayCost;
          }
        }
        
        const annualGP = calculateGP(annualRevenue, annualCosts);
        
        console.log(`Dashboard: Beverage - Annual Revenue: ${annualRevenue}, Costs: ${annualCosts}, GP: ${annualGP}`);
        
        // Update state
        setCurrentMonthRevenue(monthTotalRevenue);
        setCurrentMonthCost(monthTotalCosts);
        setCurrentMonthGP(monthGP);
        setTotalRevenue(annualRevenue);
        setTotalCost(annualCosts);
        setGpPercentage(annualGP);
        
      } catch (error) {
        console.error("Error calculating from beverage tracker data:", error);
        // Fall back to local store data if there was an error
        fallbackToLocalStore();
      }
    };
    
    const fallbackToLocalStore = () => {
      console.log("Falling back to local store for beverage dashboard");
      const { annualRecord } = useStore.getState();
      
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
    fetchData();
    
  }, [currentYear, currentMonth]);

  const getGpStatus = (gp: number, target: number) => {
    if (gp >= target) return 'good';
    if (gp >= target - 0.05) return 'warning';
    return 'bad';
  };

  return (
    <div className="container py-4 space-y-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-4 text-center">Beverage Hub Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-md border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 bg-white">
          <CardHeader className="pb-2 border-b border-gray-200">
            <CardTitle className="text-gray-900 text-xl">
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

        <Card className="shadow-md border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 bg-white">
          <CardHeader className="pb-2 border-b border-gray-200">
            <CardTitle className="text-gray-900 text-xl">
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
