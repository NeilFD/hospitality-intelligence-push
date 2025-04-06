
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WagesMonthlyTable } from '@/components/wages/WagesMonthlyTable';
import { WagesAnalytics } from '@/components/wages/WagesAnalytics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MonthYearSelector } from '@/components/wages/MonthYearSelector';

export default function WagesDashboard() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold text-tavern-blue mb-4 text-center">Wages Tracker Dashboard</h1>
      
      <div className="mb-6">
        <MonthYearSelector 
          year={selectedYear}
          month={selectedMonth}
          onYearChange={setSelectedYear}
          onMonthChange={setSelectedMonth}
        />
      </div>
      
      <Tabs defaultValue="monthly" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="monthly">Monthly View</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Analysis</TabsTrigger>
          <TabsTrigger value="trends">Trends & Analytics</TabsTrigger>
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
