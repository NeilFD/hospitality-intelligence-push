
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useStore } from '@/lib/store';
import { 
  calculateGP, 
  formatCurrency, 
  formatPercentage,
  getMonthName 
} from '@/lib/date-utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import StatusBox from '@/components/StatusBox';

export default function AnnualSummary() {
  const annualRecord = useStore(state => state.annualRecord);
  const [selectedYear, setSelectedYear] = useState<number>(annualRecord.year);
  
  // Calculate annual data
  const calculateAnnualData = () => {
    const months = annualRecord.months.filter(month => month.year === selectedYear);
    const monthsData = [];
    
    for (let i = 1; i <= 12; i++) {
      const monthRecord = months.find(m => m.month === i);
      
      if (monthRecord) {
        // Calculate total revenue
        const totalRevenue = monthRecord.weeks.reduce((sum, week) => {
          const weekRevenue = week.days.reduce((daySum, day) => daySum + day.revenue, 0);
          return sum + weekRevenue;
        }, 0);
        
        // Calculate total costs
        const totalCosts = monthRecord.weeks.reduce((sum, week) => {
          const weekCosts = week.days.reduce((daySum, day) => {
            const dayCosts = Object.values(day.purchases).reduce((purchaseSum, amount) => purchaseSum + amount, 0);
            const creditNotes = day.creditNotes.reduce((creditSum, credit) => creditSum + credit, 0);
            return daySum + dayCosts - creditNotes + day.staffFoodAllowance;
          }, 0);
          return sum + weekCosts;
        }, 0);
        
        // Calculate GP
        const gpPercentage = calculateGP(totalRevenue, totalCosts);
        
        monthsData.push({
          name: getMonthName(i),
          month: i,
          revenue: totalRevenue,
          costs: totalCosts,
          gp: gpPercentage,
          target: monthRecord.gpTarget
        });
      } else {
        // Empty data for months without records
        monthsData.push({
          name: getMonthName(i),
          month: i,
          revenue: 0,
          costs: 0,
          gp: 0,
          target: 0.68 // Default target
        });
      }
    }
    
    return monthsData;
  };
  
  const annualData = calculateAnnualData();
  
  // Calculate annual totals
  const annualTotals = annualData.reduce(
    (acc, month) => {
      return {
        revenue: acc.revenue + month.revenue,
        costs: acc.costs + month.costs
      };
    },
    { revenue: 0, costs: 0 }
  );
  
  const annualGP = calculateGP(annualTotals.revenue, annualTotals.costs);
  
  // Calculate average GP target
  const nonEmptyMonths = annualData.filter(month => month.target > 0);
  const averageTarget = nonEmptyMonths.length > 0
    ? nonEmptyMonths.reduce((sum, month) => sum + month.target, 0) / nonEmptyMonths.length
    : 0.68;
  
  const gpStatus = annualGP >= averageTarget ? 'good' : 'bad';
  
  // Calculate quarter data
  const calculateQuarterlyData = () => {
    const quarterlyData = [];
    
    for (let quarter = 1; quarter <= 4; quarter++) {
      const startMonth = (quarter - 1) * 3 + 1;
      const endMonth = startMonth + 2;
      
      const quarterMonths = annualData.filter(
        month => month.month >= startMonth && month.month <= endMonth
      );
      
      const quarterRevenue = quarterMonths.reduce((sum, month) => sum + month.revenue, 0);
      const quarterCosts = quarterMonths.reduce((sum, month) => sum + month.costs, 0);
      const quarterGP = calculateGP(quarterRevenue, quarterCosts);
      
      quarterlyData.push({
        name: `Q${quarter}`,
        revenue: quarterRevenue,
        costs: quarterCosts,
        gp: quarterGP
      });
    }
    
    return quarterlyData;
  };
  
  const quarterlyData = calculateQuarterlyData();
  
  // Years with data for selector
  const yearsWithData = Array.from(
    new Set(annualRecord.months.map(month => month.year))
  ).sort();
  
  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-tavern-blue">Annual Summary</h1>
        <Select 
          value={selectedYear.toString()} 
          onValueChange={(value) => setSelectedYear(parseInt(value))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Year" />
          </SelectTrigger>
          <SelectContent>
            {yearsWithData.map(year => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatusBox 
          label="Annual GP %" 
          value={formatPercentage(annualGP)} 
          status={gpStatus} 
          className="md:col-span-2"
        />
        <StatusBox 
          label="Total Revenue" 
          value={formatCurrency(annualTotals.revenue)} 
          status="neutral" 
        />
        <StatusBox 
          label="Total Food Costs" 
          value={formatCurrency(annualTotals.costs)} 
          status="neutral" 
        />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Monthly Performance</CardTitle>
          <CardDescription>Revenue, costs and GP% by month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={annualData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                  domain={[0, 1]}
                />
                <Tooltip 
                  formatter={(value: any, name: string) => {
                    if (name === 'GP %') {
                      return formatPercentage(value as number);
                    }
                    return formatCurrency(value as number);
                  }}
                />
                <Legend />
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="revenue" 
                  name="Revenue" 
                  stroke="#4B6584" 
                  strokeWidth={2}
                />
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="costs" 
                  name="Food Costs" 
                  stroke="#EB5757" 
                  strokeWidth={2}
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="gp" 
                  name="GP %" 
                  stroke="#78E08F" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quarterly GP %</CardTitle>
            <CardDescription>Performance by quarter</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={quarterlyData}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis 
                    tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                    domain={[0, 1]}
                  />
                  <Tooltip formatter={(value: number) => formatPercentage(value)} />
                  <Legend />
                  <Bar dataKey="gp" name="GP %" fill="#78E08F" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Monthly Data</CardTitle>
            <CardDescription>Tabular view of all months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header">Month</th>
                    <th className="table-header">Revenue</th>
                    <th className="table-header">Food Costs</th>
                    <th className="table-header">GP %</th>
                  </tr>
                </thead>
                <tbody>
                  {annualData.map((month) => (
                    <tr key={month.month}>
                      <td className="table-cell">{month.name}</td>
                      <td className="table-cell">{formatCurrency(month.revenue)}</td>
                      <td className="table-cell">{formatCurrency(month.costs)}</td>
                      <td className={`table-cell ${
                        month.revenue === 0 ? '' :
                        month.gp >= month.target ? 'text-tavern-green' : 
                        month.gp >= month.target - 0.02 ? 'text-tavern-amber' : 
                        'text-tavern-red'
                      }`}>
                        {month.revenue > 0 ? formatPercentage(month.gp) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="table-header">Total / Avg</td>
                    <td className="table-header">{formatCurrency(annualTotals.revenue)}</td>
                    <td className="table-header">{formatCurrency(annualTotals.costs)}</td>
                    <td className="table-header">{formatPercentage(annualGP)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
