
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ChartContainer } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { FileUp, Info, CheckCircle } from 'lucide-react';
import { useBudgetProcessor } from '@/utils/budget-processor';

const sampleBudgetData = [
  { category: 'Revenue', name: 'Food Sales', budget: 45000, actual: 44200, forecast: 47500 },
  { category: 'Revenue', name: 'Beverage Sales', budget: 28000, actual: 26800, forecast: 27500 },
  { category: 'Cost', name: 'Food COGS', budget: 15750, actual: 16300, forecast: 16800 },
  { category: 'Cost', name: 'Beverage COGS', budget: 7000, actual: 6500, forecast: 6900 },
  { category: 'Cost', name: 'Wages', budget: 22000, actual: 21800, forecast: 22500 },
  { category: 'Overhead', name: 'Rent', budget: 8500, actual: 8500, forecast: 8500 },
  { category: 'Overhead', name: 'Utilities', budget: 3200, actual: 3400, forecast: 3450 },
  { category: 'Profit', name: 'Gross Profit', budget: 50250, actual: 48200, forecast: 51300 },
  { category: 'Profit', name: 'EBITDA', budget: 16550, actual: 15000, forecast: 16500 },
];

const chartData = [
  { name: 'Budget', revenue: 73000, costs: 56450, ebitda: 16550 },
  { name: 'MTD Actual', revenue: 71000, costs: 56000, ebitda: 15000 },
  { name: 'Forecast', revenue: 75000, costs: 58500, ebitda: 16500 },
];

export default function PLDashboard() {
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [currentMonth, setCurrentMonth] = useState("April");
  const [currentYear, setCurrentYear] = useState(2025);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const { toast } = useToast();
  const { processBudget } = useBudgetProcessor();
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      if (file.type === 'text/csv' || 
          file.type === 'application/vnd.ms-excel' || 
          file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        setFileInput(file);
        toast({
          title: "File uploaded successfully",
          description: `${file.name} is ready to be processed.`,
        });
      } else {
        toast({
          title: "Invalid file format",
          description: "Please upload a CSV or Excel file.",
          variant: "destructive",
        });
      }
    }
  };

  const processFile = async () => {
    if (fileInput) {
      setIsProcessing(true);
      setIsProcessed(false);
      
      toast({
        title: "Processing file",
        description: "Your budget file is being processed...",
      });
      
      try {
        // Process the file with actual budget processing logic
        const success = await processBudget(fileInput, currentYear, 
          // Convert month name to number (1-12)
          new Date(`${currentMonth} 1, 2025`).getMonth() + 1
        );
        
        if (success) {
          setIsProcessed(true);
        }
      } catch (error) {
        console.error('Error processing budget file:', error);
        toast({
          title: "Processing Error",
          description: "An error occurred while processing the budget file.",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const CustomTooltip = ({ active, payload, label }: { 
    active?: boolean, 
    payload?: Array<{ value: number, name: string }>, 
    label?: string 
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border rounded-md p-2 shadow-lg">
          <p className="font-bold">{label}</p>
          {payload.map((entry, index) => (
            <p key={index}>
              {entry.name}: £{entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold text-purple-600 mb-6 text-center">P&L Tracker Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="shadow-md rounded-xl overflow-hidden lg:col-span-2">
          <CardHeader className="bg-white/40 border-b">
            <CardTitle className="flex items-center justify-between">
              <span>Monthly Performance Overview - {currentMonth} 2025</span>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Info size={14} /> Details
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ChartContainer config={{
              revenue: { color: '#8B5CF6' },
              costs: { color: '#F97316' },
              ebitda: { color: '#10B981' },
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

        <Card className="shadow-md rounded-xl overflow-hidden">
          <CardHeader className="bg-white/40 border-b">
            <CardTitle>Budget Import</CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex flex-col gap-4">
            <div className="text-sm text-gray-600">
              <p className="mb-2">Upload your annual budget to compare with actual performance.</p>
              <p>Supported formats: CSV, Excel (.xls, .xlsx)</p>
            </div>
            
            <div className="mt-2 flex justify-center items-center">
              <div className="w-full flex justify-center">
                <Input
                  type="file"
                  accept=".csv, .xls, .xlsx"
                  onChange={handleFileUpload}
                  className="
                    file:mr-4 
                    file:py-2 
                    file:px-4 
                    file:rounded-full 
                    file:text-sm 
                    file:font-semibold 
                    file:bg-purple-50 
                    file:text-purple-700 
                    hover:file:bg-purple-100
                    text-transparent  // Hide the default text
                    cursor-pointer
                    w-auto  // Change from max-w-full to w-auto
                    self-center
                  "
                  placeholder="Choose File"
                  disabled={isProcessing}
                />
              </div>
            </div>
            
            <Button 
              onClick={processFile} 
              disabled={!fileInput || isProcessing}
              className="mt-2 w-full bg-purple-600 hover:bg-purple-700"
            >
              {isProcessing ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Processing...
                </>
              ) : (
                <>
                  {isProcessed ? (
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  ) : (
                    <FileUp className="mr-2 h-4 w-4" />
                  )}
                  {isProcessed ? 'Budget Processed' : 'Process Budget'}
                </>
              )}
            </Button>
            
            {isProcessed && (
              <div className="text-green-600 text-sm flex items-center justify-center mt-2">
                <CheckCircle className="mr-1 h-4 w-4" />
                Budget data imported successfully!
              </div>
            )}
            
            <div className="text-xs text-gray-500 mt-2">
              <p>Your budget will be used to calculate variances and forecasts.</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 gap-6 mb-6">
        <Card className="shadow-md rounded-xl overflow-hidden">
          <CardHeader className="bg-white/40 border-b">
            <CardTitle>P&L Flash Report - {currentMonth} 2025</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-purple-50">
                    <TableHead className="w-[250px]">Line Item</TableHead>
                    <TableHead className="text-right">Monthly Budget</TableHead>
                    <TableHead className="text-right">MTD Actual</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                    <TableHead className="text-right">Forecast</TableHead>
                    <TableHead className="text-right">Forecast Variance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sampleBudgetData.map((item, i) => {
                    const variance = item.actual - item.budget;
                    const variancePercent = (variance / item.budget) * 100;
                    const forecastVariance = item.forecast - item.budget;
                    const forecastVariancePercent = (forecastVariance / item.budget) * 100;
                    
                    const isPositiveVariance = 
                      (item.category === 'Revenue' || item.category === 'Profit') 
                        ? variance > 0 
                        : variance < 0;
                    
                    const isPositiveForecast = 
                      (item.category === 'Revenue' || item.category === 'Profit') 
                        ? forecastVariance > 0 
                        : forecastVariance < 0;
                    
                    return (
                      <TableRow key={i} className={item.category === 'Profit' ? 'font-semibold' : ''}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-right">£{item.budget.toLocaleString()}</TableCell>
                        <TableCell className="text-right">£{item.actual.toLocaleString()}</TableCell>
                        <TableCell className={`text-right ${isPositiveVariance ? 'text-green-600' : 'text-red-600'}`}>
                          {variance > 0 ? '+' : ''}{variance.toLocaleString()} ({variancePercent.toFixed(1)}%)
                        </TableCell>
                        <TableCell className="text-right">£{item.forecast.toLocaleString()}</TableCell>
                        <TableCell className={`text-right ${isPositiveForecast ? 'text-green-600' : 'text-red-600'}`}>
                          {forecastVariance > 0 ? '+' : ''}{forecastVariance.toLocaleString()} ({forecastVariancePercent.toFixed(1)}%)
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-md rounded-xl overflow-hidden">
          <CardHeader className="bg-white/40 border-b">
            <CardTitle>Daily Sales Entry</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-4">Enter daily sales data to update your MTD figures and forecasts.</p>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Date</label>
                <Input type="date" defaultValue="2025-04-05" />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Food Sales</label>
                <Input type="number" placeholder="0.00" />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Beverage Sales</label>
                <Input type="number" placeholder="0.00" />
              </div>
              
              <Button className="mt-2 bg-purple-600 hover:bg-purple-700">
                Submit Daily Sales
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-md rounded-xl overflow-hidden">
          <CardHeader className="bg-white/40 border-b">
            <CardTitle>Variable Overhead Costs</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-4">Track and update variable overhead costs for the current month.</p>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Maintenance & Repairs</label>
                <Input type="number" placeholder="0.00" />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Marketing & Promotions</label>
                <Input type="number" placeholder="0.00" />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Miscellaneous</label>
                <Input type="number" placeholder="0.00" />
              </div>
              
              <Button className="mt-2 bg-purple-600 hover:bg-purple-700">
                Update Overheads
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
