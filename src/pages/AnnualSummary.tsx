
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStore } from '@/lib/store';
import { formatCurrency, formatPercentage } from '@/lib/date-utils';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { 
  fetchTrackerDataByMonth
} from '@/services/kitchen-service';
import { ModuleType } from '@/types/kitchen-ledger';

interface CalculationResult {
  totalRevenue: number;
  totalCost: number;
  totalGP: number;
  averageRevenue: number;
  averageCost: number;
  averageGP: number;
}

// Add props interface with modulePrefix and moduleType
interface AnnualSummaryProps {
  modulePrefix?: string;
  moduleType?: ModuleType;
  chartMargins?: {
    top: number;
    right: number;
    left: number;
    bottom: number;
  };
}

export default function AnnualSummary({
  modulePrefix = '',
  moduleType = 'food',
  chartMargins = { top: 20, right: 20, left: 0, bottom: 20 }
}: AnnualSummaryProps) {
  const { currentYear } = useStore();
  const [isLoading, setIsLoading] = useState(true);
  const [calculation, setCalculation] = useState<CalculationResult>({
    totalRevenue: 0,
    totalCost: 0,
    totalGP: 0,
    averageRevenue: 0,
    averageCost: 0,
    averageGP: 0
  });

  const { data: foodTrackerData } = useQuery({
    queryKey: ['tracker-data', currentYear, 'food', 'annual'],
    queryFn: () => {
      const promises = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        return fetchTrackerDataByMonth(currentYear, month, moduleType);
      });
      return Promise.all(promises);
    },
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (foodTrackerData) {
      processAnnualData();
    }
  }, [foodTrackerData]);

  const processAnnualData = async () => {
    setIsLoading(true);
    try {
      let totalRevenue = 0;
      let totalCost = 0;
      let dayCount = 0;

      for (const monthData of foodTrackerData) {
        if (monthData) {
          for (const day of monthData) {
            totalRevenue += Number(day.revenue || 0);
            dayCount++;
          }
        }
      }

      const averageRevenue = dayCount > 0 ? totalRevenue / dayCount : 0;
      const averageCost = 0;
      const averageGP = averageRevenue - averageCost;

      setCalculation({
        totalRevenue,
        totalCost,
        totalGP: totalRevenue - totalCost,
        averageRevenue,
        averageCost,
        averageGP
      });
    } catch (error) {
      console.error("Error processing annual data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const chartData = [
    { name: 'Revenue', value: calculation.totalRevenue },
    { name: 'Cost', value: calculation.totalCost },
    { name: 'GP', value: calculation.totalGP },
  ];

  // Add the modulePrefix to the title if provided
  const titlePrefix = modulePrefix ? `${modulePrefix} ` : '';

  return (
    <div className="container max-w-7xl py-6 space-y-6 animate-fade-in">
      <h1 className="text-3xl font-bold text-tavern-blue">{titlePrefix}Annual Summary - {currentYear}</h1>

      {isLoading ? (
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-tavern-blue-light" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-lg rounded-xl overflow-hidden border-none bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="pb-2 border-b border-gray-100">
              <CardTitle className="text-lg font-medium flex items-center justify-between">
                <span>Total Revenue</span>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-tavern-blue">{formatCurrency(calculation.totalRevenue)}</div>
              <div className="mt-2 space-y-1">
                <div className="text-muted-foreground flex items-center gap-1">
                  <span className="text-gray-500">Total Cost:</span>
                  <span className="font-medium">{formatCurrency(calculation.totalCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <div className="flex flex-col">
                    <span className="text-gray-500">Average Revenue:</span>
                    <span className="font-medium">{formatCurrency(calculation.averageRevenue)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500">Average Cost:</span>
                    <span className="font-medium">{formatCurrency(calculation.averageCost)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg rounded-xl overflow-hidden border-none bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="pb-2 border-b border-gray-100">
              <CardTitle className="text-lg font-medium flex items-center justify-between">
                <span>Gross Profit</span>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-tavern-blue mb-2">{formatCurrency(calculation.totalGP)}</div>
              <div className="grid grid-cols-1 gap-2 mt-1">
                <div className="flex flex-col">
                  <span className="text-gray-500 text-sm">Average GP:</span>
                  <span className="font-medium">{formatCurrency(calculation.averageGP)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg rounded-xl overflow-hidden border-none bg-gradient-to-br from-white to-gray-50 md:col-span-1 row-span-1">
            <CardHeader className="pb-2 border-b border-gray-100">
              <CardTitle className="text-lg font-medium">Annual Performance</CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-col justify-center h-[calc(100%_-_3.5rem)]">
              <div className={`text-lg font-bold ${calculation.averageGP >= 5000 ? 'text-green-500' : calculation.averageGP >= 3000 ? 'text-amber-500' : 'text-red-500'}`}>
                {calculation.averageGP >= 5000 ? 'Excellent' : calculation.averageGP >= 3000 ? 'Good' : 'Needs Improvement'}
              </div>
              <p className="text-gray-500 text-sm mt-1">
                {calculation.averageGP >= 5000 ?
                  'Your business is performing above target.' :
                  calculation.averageGP >= 3000 ?
                    'Your business is meeting expected levels.' :
                    'Your business is below target levels.'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
