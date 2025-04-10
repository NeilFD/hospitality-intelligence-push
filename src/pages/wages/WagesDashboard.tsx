
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WagesMonthlyTable } from '@/components/wages/WagesMonthlyTable';
import { WagesAnalytics } from '@/components/wages/WagesAnalytics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MonthYearSelector } from '@/components/wages/MonthYearSelector';
import { Button } from '@/components/ui/button';
import { TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function WagesDashboard() {
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = React.useState(new Date().getMonth() + 1);

  return (
    <div className="container py-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <h1 className="text-3xl font-bold text-tavern-blue mb-4 md:mb-0">Wages Tracker Dashboard</h1>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="flex items-center gap-2" asChild>
            <Link to="/performance/wage-optimization">
              <TrendingUp className="h-4 w-4 text-tavern-blue" />
              <span>Advanced Wage Optimization</span>
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="mb-6">
        <MonthYearSelector 
          year={selectedYear}
          month={selectedMonth}
          onYearChange={setSelectedYear}
          onMonthChange={setSelectedMonth}
        />
      </div>
      
      <Tabs defaultValue="monthly" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4 bg-gray-100">
          <TabsTrigger 
            value="monthly" 
            className="data-[state=active]:bg-tavern-green data-[state=active]:text-white"
          >
            Monthly View
          </TabsTrigger>
          <TabsTrigger 
            value="weekly" 
            className="data-[state=active]:bg-tavern-green data-[state=active]:text-white"
          >
            Weekly Analysis
          </TabsTrigger>
          <TabsTrigger 
            value="trends" 
            className="data-[state=active]:bg-tavern-green data-[state=active]:text-white"
          >
            Trends & Analytics
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="monthly" className="space-y-6">
          <WagesMonthlyTable year={selectedYear} month={selectedMonth} />
        </TabsContent>
        
        <TabsContent value="weekly" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Performance Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <WagesAnalytics 
                year={selectedYear} 
                month={selectedMonth}
                viewType="weekly" 
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Wage Trends & Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <WagesAnalytics 
                year={selectedYear} 
                month={selectedMonth}
                viewType="trends" 
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
