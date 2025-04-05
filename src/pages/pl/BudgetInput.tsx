
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUp, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useBudgetProcessor } from '@/utils/budget-processor';
import { toast } from 'sonner';

export default function BudgetInput() {
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [currentYear, setCurrentYear] = useState<number>(2025);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const { processBudget } = useBudgetProcessor();
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setProcessingError(null);
    setIsProcessed(false);
    
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      if (file.type === 'text/csv' || 
          file.type === 'application/vnd.ms-excel' || 
          file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        setFileInput(file);
        toast.success(`${file.name} selected. Ready to process.`);
      } else {
        setProcessingError("Invalid file format. Please upload a CSV or Excel file.");
        toast.error("Please upload a CSV or Excel file.");
      }
    }
  };

  const processFile = async () => {
    if (fileInput) {
      setIsProcessing(true);
      setIsProcessed(false);
      setProcessingError(null);
      
      toast.success("Processing your budget file...");
      
      try {
        console.log("Starting budget processing for file:", fileInput.name);
        const success = await processBudget(fileInput, currentYear, 0); // 0 means process all months
        
        console.log("Budget processing complete, success:", success);
        
        if (success) {
          toast.success(`Budget data for ${currentYear} imported successfully!`);
          setIsProcessed(true);
        } else {
          setProcessingError("Failed to process the budget file. No valid data was found.");
          toast.error("Failed to process the budget file. No valid data was found.");
        }
      } catch (error) {
        console.error('Error processing budget file:', error);
        const errorMessage = error instanceof Error ? error.message : "An error occurred while processing the budget file.";
        setProcessingError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsProcessing(false);
      }
    }
  };
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold text-purple-600 mb-6">Budget Input</h1>
      
      <Card className="shadow-md rounded-xl overflow-hidden mb-8">
        <CardHeader className="bg-white/40 border-b">
          <CardTitle>Annual Budget Upload</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="text-gray-600">
            <p className="mb-2">Upload your Excel budget sheet for the entire fiscal year. This should contain monthly budget data for all 12 months.</p>
            <p>The system will extract and store all monthly data, which will then be available in the dashboard views for each month.</p>
            <p className="mt-2 text-sm">Supported formats: CSV, Excel (.xls, .xlsx)</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Budget Year</label>
                <Select value={currentYear.toString()} onValueChange={(value) => setCurrentYear(parseInt(value))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue>{currentYear}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Budget File</label>
                <Input
                  type="file"
                  accept=".csv, .xls, .xlsx"
                  onChange={handleFileUpload}
                  className="
                    mt-1
                    file:mr-4 
                    file:py-2 
                    file:px-4 
                    file:rounded-full 
                    file:text-sm 
                    file:font-semibold 
                    file:bg-purple-50 
                    file:text-purple-700 
                    hover:file:bg-purple-100
                  "
                  disabled={isProcessing}
                />
              </div>
              
              {fileInput && (
                <div className="p-3 bg-purple-50 rounded-md">
                  <p className="font-medium">Selected file:</p> 
                  <p className="text-purple-800 truncate">{fileInput.name}</p>
                </div>
              )}
            </div>
            
            <div className="flex flex-col justify-end space-y-4">
              <Button 
                onClick={processFile} 
                disabled={!fileInput || isProcessing}
                className="w-full bg-purple-600 hover:bg-purple-700 h-12"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Annual Budget...
                  </>
                ) : (
                  <>
                    {isProcessed ? (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    ) : (
                      <FileUp className="mr-2 h-4 w-4" />
                    )}
                    {isProcessed ? 'Budget Processed' : 'Process Annual Budget'}
                  </>
                )}
              </Button>
              
              {isProcessed && (
                <div className="text-green-600 text-sm flex items-center p-3 bg-green-50 rounded-md">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  <div>
                    <p className="font-medium">Budget data imported successfully!</p>
                    <p>All monthly budgets are now available in the dashboard.</p>
                  </div>
                </div>
              )}
              
              {processingError && (
                <div className="text-red-600 text-sm flex items-center p-3 bg-red-50 rounded-md">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  <div>
                    <p className="font-medium">Error processing budget</p>
                    <p>{processingError}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-md mt-6">
            <h3 className="font-medium text-blue-800 mb-1">Expected Format</h3>
            <p className="text-sm text-blue-600 mb-2">Your Excel file should include:</p>
            <ul className="text-sm text-blue-700 list-disc pl-5 space-y-1">
              <li>Monthly columns for each period</li>
              <li>Revenue lines (Food Revenue, Beverage Revenue, etc.)</li>
              <li>Cost lines organized by category</li>
              <li>Clear headers identifying each month</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
