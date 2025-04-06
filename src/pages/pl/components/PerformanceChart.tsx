
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChartContainer } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, Legend, Tooltip } from 'recharts';
import { Info } from 'lucide-react';
import { toast } from "sonner";

interface ChartDataItem {
  name: string;
  revenue: number;
  costs: number;
  ebitda: number;
}

interface PerformanceChartProps {
  chartData: ChartDataItem[];
  currentMonthName: string;
  currentYear: number;
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
  costs: boolean;
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

export function PerformanceChart({ chartData, currentMonthName, currentYear }: PerformanceChartProps) {
  // Add state to track visible series
  const [visibleSeries, setVisibleSeries] = useState<VisibleSeries>({
    revenue: true,
    costs: true,
    ebitda: true
  });

  // Custom Legend component that handles toggle functionality
  const CustomLegend = () => {
    // Define all available series regardless of what's in the chart payload
    const allSeries = [
      { dataKey: 'revenue', value: 'Revenue', color: '#7E69AB' },
      { dataKey: 'costs', value: 'Costs', color: '#A5C0E2' },
      { dataKey: 'ebitda', value: 'EBITDA', color: '#6C7787' }
    ];
    
    // Toggle visibility when clicking on a legend item
    const toggleItem = (dataKey: keyof VisibleSeries) => {
      // Count how many series are currently visible
      const visibleCount = Object.values(visibleSeries).filter(Boolean).length;
      
      // If trying to hide the last visible item, show a message and return without changing state
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
        <ChartContainer config={{
          revenue: {
            color: '#7E69AB' // Complementary purple
          },
          costs: {
            color: '#A5C0E2' // Complementary blue
          },
          ebitda: {
            color: '#6C7787' // Muted complementary color
          }
        }}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
            {visibleSeries.revenue && <Bar dataKey="revenue" name="Revenue" fill="var(--color-revenue)" />}
            {visibleSeries.costs && <Bar dataKey="costs" name="Costs" fill="var(--color-costs)" />}
            {visibleSeries.ebitda && <Bar dataKey="ebitda" name="EBITDA" fill="var(--color-ebitda)" />}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
