import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { FileUp, Info, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useBudgetProcessor, fetchBudgetItems } from '@/utils/budget-processor';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

const chartData = [
  { name: 'Budget', revenue: 73000, costs: 56450, ebitda: 16550 },
  { name: 'MTD Actual', revenue: 71000, costs: 56000, ebitda: 15000 },
  { name: 'Forecast', revenue: 75000, costs: 58500, ebitda: 16500 },
];

export default function PLDashboard() {
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth() + 1);
  const [currentMonthName, setCurrentMonthName] = useState<string>(
    new Date().toLocaleString('default', { month: 'long' })
  );
  const [currentYear, setCurrentYear] = useState<number>(2025);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const { processBudget } = useBudgetProcessor();
  
  const { data: budgetItems, isLoading: isLoadingBudget, refetch } = useQuery({
    queryKey: ['budget-items', currentYear, currentMonth],
    queryFn: () => fetchBudgetItems(currentYear, currentMonth),
    enabled: true,
  });
  
  const processedBudgetData = useMemo(() => {
    if (!budgetItems) return [];
    
    const grouped = budgetItems.reduce((acc, item) => {
      const category = acc.find(c => c.category === item.category);
      if (category) {
        category.items.push(item);
      } else {
        acc.push({ 
          category: item.category, 
          items: [item] 
        });
      }
      return acc;
    }, [] as Array<{ category: string; items: typeof budgetItems }>);
    
    return grouped.flatMap(group => [
      ...group.items.map(item => ({
        category: group.category,
        name: item.name,
        budget: item.budget_amount,
        actual: item.actual_amount || 0,
        forecast: item.forecast_amount || item.budget_amount,
      })),
    ]);
  }, [budgetItems]);
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setProcessingError(null);
    setIsProcessed(false);
    
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      if (file.type === 'text/csv' || 
          file.type === 'application/vnd.ms-excel' || 
          file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        setFileInput(file);
        toast({
          title: "File Selected",
          description: `${file.name} is ready to be processed.`,
        });
      } else {
        setProcessingError("Invalid file format. Please upload a CSV or Excel file.");
        toast({
          title: "Invalid File Format",
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
      setProcessingError(null);
      
      toast({
        title: "Processing Budget File",
        description: "Your budget file is being processed...",
      });
      
      try {
        console.log("Starting budget processing for file:", fileInput.name);
        const success = await processBudget(
          fileInput, 
          currentYear, 
          currentMonth
        );
        
        console.log("Budget processing complete, success:", success);
        
        if (success) {
          toast({
            title: "Success!",
            description: `Budget data for ${currentMonthName} ${currentYear} imported successfully!`,
            variant: "default",
          });
          setIsProcessed(true);
          await refetch();
        } else {
          setProcessingError("Failed to process the budget file. No valid data was found.");
          toast({
            title: "Processing Failed",
            description: "Failed to process the budget file. No valid data was found.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error processing budget file:', error);
        const errorMessage = error instanceof Error ? error.message : "An error occurred while processing the budget file.";
        setProcessingError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    }
  };
  
  useEffect(() => {
    const monthName = new Date(currentYear, currentMonth - 1, 1)
      .toLocaleString('default', { month: 'long' });
    setCurrentMonthName(monthName);
  }, [currentMonth, currentYear]);

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
  
  const handleMonthChange = (value: string) => {
    setCurrentMonth(parseInt(value));
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold text-purple-600 mb-6 text-center">P&L Tracker Dashboard</h1>
      
      <div className="flex justify-end gap-4 mb-6">
        <Select value={currentMonth.toString()} onValueChange={handleMonthChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue>{currentMonthName}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">January</SelectItem>
            <SelectItem value="2">February</SelectItem>
            <SelectItem value="3">March</SelectItem>
            <SelectItem value="4">April</SelectItem>
            <SelectItem value="5">May</SelectItem>
            <SelectItem value="6">June</SelectItem>
            <SelectItem value="7">July</SelectItem>
            <SelectItem value="8">August</SelectItem>
            <SelectItem value="9">September</SelectItem>
            <SelectItem value="10">October</SelectItem>
            <SelectItem value="11">November</SelectItem>
            <SelectItem value="12">December</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={currentYear.toString()} onValueChange={(value) => setCurrentYear(parseInt(value))}>
          <SelectTrigger className="w-[120px]">
            <SelectValue>{currentYear}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2024">2024</SelectItem>
            <SelectItem value="2025">2025</SelectItem>
            <SelectItem value="2026">2026</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="shadow-md rounded-xl overflow-hidden lg:col-span-2">
          <CardHeader className="bg-white/40 border-b">
            <CardTitle className="flex items-center justify-between">
              <span>Monthly Performance Overview - {currentMonthName} {currentYear}</span>
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
              <p className="mb-2">Upload your Excel budget for {currentMonthName} {currentYear}.</p>
              <p>Supported formats: CSV, Excel (.xls, .xlsx)</p>
            </div>
            
            <div className="flex justify-center items-center">
              <Input
                type="file"
                accept=".csv, .xls, .xlsx"
                onChange={handleFileUpload}
                className="
                  w-full 
                  max-w-sm 
                  file:mr-4 
                  file:py-2 
                  file:px-4 
                  file:rounded-full 
                  file:text-sm 
                  file:font-semibold 
                  file:bg-purple-50 
                  file:text-purple-700 
                  hover:file:bg-purple-100
                  file:cursor-pointer
                  text-center
                  self-center
                "
                placeholder="Choose File"
                disabled={isProcessing}
              />
            </div>
            
            {fileInput && (
              <div className="text-sm text-center">
                <p className="font-medium">Selected file:</p> 
                <p className="text-purple-600">{fileInput.name}</p>
              </div>
            )}
            
            <Button 
              onClick={processFile} 
              disabled={!fileInput || isProcessing}
              className="mt-2 w-full bg-purple-600 hover:bg-purple-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
            
            {processingError && (
              <div className="text-red-600 text-sm flex items-center justify-center mt-2">
                <AlertCircle className="mr-1 h-4 w-4" />
                {processingError}
              </div>
            )}
            
            <div className="text-xs text-gray-500 mt-2">
              <p>Budget data is now stored in your Supabase database.</p>
              <p>It will be used to calculate variances and forecasts.</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 gap-6 mb-6">
        <Card className="shadow-md rounded-xl overflow-hidden">
          <CardHeader className="bg-white/40 border-b">
            <CardTitle>P&L Flash Report - {currentMonthName} {currentYear}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoadingBudget ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            ) : processedBudgetData.length > 0 ? (
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
                    {processedBudgetData.map((item, i) => {
                      const variance = item.actual - item.budget;
                      const variancePercent = item.budget !== 0 ? (variance / item.budget) * 100 : 0;
                      const forecastVariance = item.forecast - item.budget;
                      const forecastVariancePercent = item.budget !== 0 ? (forecastVariance / item.budget) * 100 : 0;
                      
                      const isPositiveVariance = 
                        (item.category === 'Food Revenue' || item.category === 'Beverage Revenue' || item.category.includes('Profit')) 
                          ? variance > 0 
                          : variance < 0;
                      
                      const isPositiveForecast = 
                        (item.category === 'Food Revenue' || item.category === 'Beverage Revenue' || item.category.includes('Profit')) 
                          ? forecastVariance > 0 
                          : forecastVariance < 0;
                      
                      return (
                        <TableRow key={i} className={item.name.includes('Total') || item.name.includes('Gross Profit') ? 'font-semibold' : ''}>
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
            ) : (
              <div className="text-center p-8 text-gray-500">
                {isProcessed ? 
                  "Processing your budget data... Please wait." : 
                  "No budget data available. Please upload a budget file."}
              </div>
            )}
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
