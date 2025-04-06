
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WagesMonthlyTable } from '@/components/wages/WagesMonthlyTable';
import { WagesAnalytics } from '@/components/wages/WagesAnalytics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MonthYearSelector } from '@/components/wages/MonthYearSelector';
import { getCurrentUser } from '@/lib/supabase';
import { toast } from 'sonner';

export default function WagesDashboard() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        setIsAuthenticated(!!user);
      } catch (error) {
        console.error('Error checking authentication:', error);
        toast.error('Authentication error');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="container py-6 max-w-[1400px] mx-auto">
        <div className="flex justify-center items-center py-20">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container py-6 max-w-[1400px] mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please log in to access the Wages Tracker Dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-[1400px] mx-auto">
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
