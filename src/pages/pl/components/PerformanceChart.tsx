
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChartContainer } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, Legend, Tooltip } from 'recharts';
import { Info } from 'lucide-react';

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
            <Legend />
            <Bar dataKey="revenue" name="Revenue" fill="var(--color-revenue)" />
            <Bar dataKey="costs" name="Costs" fill="var(--color-costs)" />
            <Bar dataKey="ebitda" name="EBITDA" fill="var(--color-ebitda)" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
