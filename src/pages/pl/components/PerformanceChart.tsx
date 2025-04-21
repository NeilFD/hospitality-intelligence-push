import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChartContainer } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, Legend, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { Info, Loader2 } from 'lucide-react';
import { toast } from "sonner";

interface ChartDataItem {
  name: string;
  revenue: number;
  cosCosts: number;
  adminCosts: number;
  ebitda: number;
}

interface PerformanceChartProps {
  chartData: ChartDataItem[];
  currentMonthName: string;
  currentYear: number;
  isLoading: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
  }>;
  label?: string;
}

interface VisibleSeries {
  revenue: boolean;
  cosCosts: boolean;
  adminCosts: boolean;
  ebitda: boolean;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return <div className="bg-white border rounded-md p-2 shadow-lg">
      <p className="font-bold">{label}</p>
      {payload.map((entry, index) => (
        <p key={index}>
          {entry.name}: £{entry.value.toLocaleString('en-GB', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          })}
        </p>
      ))}
    </div>;
  }
  return null;
}

export function PerformanceChart({ chartData, currentMonthName, currentYear, isLoading }: PerformanceChartProps) {
  const [visibleSeries, setVisibleSeries] = useState<VisibleSeries>({
    revenue: true,
    cosCosts: true,
    adminCosts: true,
    ebitda: true
  });

  const CustomLegend = () => {
    const allSeries = [
      { dataKey: 'revenue', value: 'Revenue', color: '#7E69AB' },
      { dataKey: 'cosCosts', value: 'COS Costs', color: '#A5C0E2' },
      { dataKey: 'adminCosts', value: 'Admin Costs', color: '#FF9F76' },
      { dataKey: 'ebitda', value: 'EBITDA', color: '#6C7787' }
    ];
    
    const toggleItem = (dataKey: keyof VisibleSeries) => {
      const visibleCount = Object.values(visibleSeries).filter(Boolean).length;
      
      if (visibleSeries[dataKey] && visibleCount <= 1) {
        toast.info("At least one series must remain visible");
        return;
      }
      
      setVisibleSeries(prev => ({
        ...prev,
        [dataKey]: !prev[dataKey]
      }));
    };
    
    return (
      <div className="flex flex-wrap justify-center gap-4 pt-4">
        {allSeries.map((entry, index) => {
          const isActive = visibleSeries[entry.dataKey as keyof VisibleSeries];
          return (
            <div 
              key={`item-${index}`}
              className={`flex items-center gap-2 px-3 py-1 cursor-pointer rounded-md transition-all ${isActive ? 'opacity-100' : 'opacity-50'}`}
              onClick={() => toggleItem(entry.dataKey as keyof VisibleSeries)}
            >
              <div 
                className="w-3 h-3 rounded-sm" 
                style={{ backgroundColor: entry.color }} 
              />
              <span>{entry.value}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="shadow-md rounded-xl overflow-hidden lg:col-span-3">
      <CardHeader className="bg-white/40 border-b">
        <CardTitle className="flex items-center justify-between">
          <span>Monthly Performance Overview - {currentMonthName} {currentYear}</span>
          <Button variant="outline" size="sm" className="flex items-center gap-1 border-[#48495e] text-[#48495e] hover:bg-[#48495e] hover:text-white">
            <Info size={14} /> Details
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : (
          <ChartContainer config={{
            revenue: { color: '#7E69AB' },
            cosCosts: { color: '#A5C0E2' },
            adminCosts: { color: '#FF9F76' },
            ebitda: { color: '#6C7787' }
          }}>
            <BarChart data={chartData}>
              <CartesianGrid 
                vertical={false} 
                horizontal={true} 
                stroke="#F1F0FB"
                strokeWidth={1}
                strokeDasharray="0" 
              />
              <ReferenceLine 
                y={0} 
                stroke="#9F9EA1"
                strokeWidth={1} 
                isFront={true} 
              />
              <XAxis 
                dataKey="name" 
                axisLine={{ stroke: '#48495e', strokeWidth: 2 }}
              />
              <YAxis 
                axisLine={{ stroke: '#48495e', strokeWidth: 2 }} 
                tickLine={{ stroke: '#48495e' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
              {visibleSeries.revenue && (
                <Bar dataKey="revenue" name="Revenue" fill="var(--color-revenue)" />
              )}
              {visibleSeries.cosCosts && (
                <Bar dataKey="cosCosts" name="COS Costs" fill="var(--color-cosCosts)" stackId="costs" />
              )}
              {visibleSeries.adminCosts && (
                <Bar dataKey="adminCosts" name="Admin Costs" fill="var(--color-adminCosts)" stackId="costs" />
              )}
              {visibleSeries.ebitda && (
                <Bar dataKey="ebitda" name="EBITDA" fill="var(--color-ebitda)" />
              )}
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
