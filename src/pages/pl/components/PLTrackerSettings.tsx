
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { fetchBudgetItemTracking, upsertBudgetItemTracking } from '@/services/kitchen-service';
import { ProcessedBudgetItem } from '../hooks/useBudgetData';

interface PLTrackerBudgetItem extends ProcessedBudgetItem {
  tracking_type: 'Discrete' | 'Pro-Rated';
}

interface PLTrackerSettingsProps {
  isLoading: boolean;
  processedBudgetData: ProcessedBudgetItem[];
  currentMonthName: string;
  currentYear: number;
  onBackToTracker: () => void;
  onSettingsSaved: (updatedItems: PLTrackerBudgetItem[]) => void;
}

export function PLTrackerSettings({
  isLoading,
  processedBudgetData,
  currentMonthName,
  currentYear,
  onBackToTracker,
  onSettingsSaved
}: PLTrackerSettingsProps) {
  const [trackedBudgetData, setTrackedBudgetData] = useState<PLTrackerBudgetItem[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Fixed the variable initialization
  const { toast } = useToast();

  const loadTrackingSettings = async (items: ProcessedBudgetItem[]): Promise<PLTrackerBudgetItem[]> => {
    try {
      const itemIds = items.filter(item => item.id).map(item => item.id);
      
      if (itemIds.length === 0) {
        return items.map(item => ({
          ...item,
          tracking_type: 'Discrete' as const
        }));
      }
      
      const trackingData = await fetchBudgetItemTracking(itemIds as string[]);
      
      if (trackingData && trackingData.length > 0) {
        const trackingMap = trackingData.reduce((acc, curr) => {
          acc[curr.budget_item_id] = curr.tracking_type;
          return acc;
        }, {} as Record<string, string>);
        
        return items.map(item => {
          if (item.id && trackingMap[item.id]) {
            return {
              ...item,
              tracking_type: trackingMap[item.id] as 'Discrete' | 'Pro-Rated'
            };
          }
          return {
            ...item,
            tracking_type: 'Discrete' as const
          };
        });
      }
      
      return items.map(item => ({
        ...item,
        tracking_type: 'Discrete' as const
      }));
    } catch (error) {
      console.error('Error in loadTrackingSettings:', error);
      return items.map(item => ({
        ...item,
        tracking_type: 'Discrete' as const
      }));
    }
  };

  useEffect(() => {
    // Add CSS for custom theme support
    const styleId = 'custom-theme-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        /* Custom theme variables application */
        .theme-custom .sidebar {
          background-color: var(--custom-sidebar-color);
        }
        .theme-custom .bg-primary {
          background-color: var(--custom-primary-color);
        }
        .theme-custom .text-primary {
          color: var(--custom-primary-color);
        }
        .theme-custom .border-primary {
          border-color: var(--custom-primary-color);
        }
        .theme-custom .hover\\:bg-primary:hover {
          background-color: var(--custom-primary-color);
        }
        /* Add more custom theme CSS variables as needed */
      `;
      document.head.appendChild(style);
      console.log('Added custom theme styles to document head');
    }
    
    if (processedBudgetData.length > 0) {
      const initializeData = async () => {
        let trackedData = processedBudgetData.map(item => {
          let trackingType: 'Discrete' | 'Pro-Rated' = 'Discrete';
          
          const proRatedCategories = [
            'Marketing',
            'Bank charges',
            'Insurance',
            'Heat and power',
            'Telephone and internet',
            'Rates',
            'Rent',
            'Subscriptions'
          ];
          
          const proRatedNames = [
            'Marketing',
            'Bank charges',
            'Entertainment',
            'Insurance',
            'Heat and power',
            'Telephone and internet',
            'Rates',
            'Rent',
            'Subscriptions'
          ];
          
          if (
            (item.category && proRatedCategories.includes(item.category)) || 
            (item.name && proRatedNames.some(name => item.name.includes(name)))
          ) {
            trackingType = 'Pro-Rated';
          }
          
          return {
            ...item,
            tracking_type: item.tracking_type || trackingType
          } as PLTrackerBudgetItem;
        });
        
        trackedData = await loadTrackingSettings(processedBudgetData);
        
        setTrackedBudgetData(trackedData);
        setHasUnsavedChanges(false);
      };
      
      initializeData();
    }
  }, [processedBudgetData]);

  const updateTrackingType = (index: number, value: 'Discrete' | 'Pro-Rated') => {
    const updatedData = [...trackedBudgetData];
    updatedData[index] = {
      ...updatedData[index],
      tracking_type: value
    };
    setTrackedBudgetData(updatedData);
    setHasUnsavedChanges(true);
  };

  const saveTrackingSettings = async () => {
    if (!hasUnsavedChanges) return;
    
    setIsSaving(true);
    
    try {
      const itemsWithId = trackedBudgetData.filter(item => item.id);
      
      const trackingUpserts = itemsWithId
        .filter(item => item.tracking_type)
        .map(item => ({
          budget_item_id: item.id as string,
          tracking_type: item.tracking_type as 'Discrete' | 'Pro-Rated'
        }));
      
      if (trackingUpserts.length > 0) {
        await upsertBudgetItemTracking(trackingUpserts);
      }
      
      toast({
        title: "Settings saved",
        description: "Your tracking settings have been saved.",
      });
      
      setHasUnsavedChanges(false);
      onSettingsSaved(trackedBudgetData);
    } catch (error) {
      console.error('Error in saveTrackingSettings:', error);
      toast({
        title: "Error saving settings",
        description: "An unexpected error occurred while saving settings.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const shouldShowTrackingType = (item: PLTrackerBudgetItem): boolean => {
    const isSummaryItem = 
      item.isHeader || 
      item.isGrossProfit || 
      item.isOperatingProfit || 
      item.name.toLowerCase().includes('turnover') || 
      item.name === 'Cost of Sales' ||
      item.name === 'Total Admin expenses' ||
      item.name === 'Operating profit' ||
      item.name === 'Gross Profit/(Loss)' ||
      item.name.toLowerCase() === 'turnover';
    
    return !isSummaryItem;
  };

  return (
    <Card className="shadow-md rounded-xl overflow-hidden">
      <CardHeader className="bg-white/40 border-b flex flex-row items-center justify-between">
        <CardTitle>P&L Tracker Settings - {currentMonthName} {currentYear}</CardTitle>
        <div className="flex items-center gap-2">
          <Button 
            onClick={saveTrackingSettings} 
            variant="outline" 
            disabled={!hasUnsavedChanges || isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
          <Button 
            onClick={onBackToTracker} 
            variant="outline"
            className="flex items-center gap-1"
          >
            <ArrowLeft size={16} />
            Back to Tracker
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : trackedBudgetData.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-purple-50">
                  <TableHead className="w-[250px]">Line Item</TableHead>
                  <TableHead>Tracking Type</TableHead>
                  <TableHead className="text-right">Budget Amount</TableHead>
                  <TableHead className="text-right">Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trackedBudgetData.map((item, i) => {
                  if (item.isHeader) {
                    return (
                      <TableRow key={i} className={'bg-[#48495e]/90 text-white'}>
                        <TableCell 
                          colSpan={4} 
                          className="font-bold text-sm tracking-wider py-2"
                        >
                          {item.name}
                        </TableCell>
                      </TableRow>
                    );
                  }
                  
                  let fontClass = item.isHighlighted || 
                                 item.name.toLowerCase().includes('total admin') || 
                                 item.name.toLowerCase().includes('turnover') || 
                                 item.name.toLowerCase().includes('cost of sales') || 
                                 (item.isGrossProfit && 
                                  !item.name.toLowerCase().includes('food gross profit') && 
                                  !item.name.toLowerCase().includes('beverage gross profit')) 
                                 ? 'font-bold' : '';
                  
                  return (
                    <TableRow key={i}>
                      <TableCell className={fontClass}>
                        {item.name}
                      </TableCell>
                      <TableCell>
                        {shouldShowTrackingType(item) ? (
                          <Select
                            value={item.tracking_type}
                            onValueChange={(value) => updateTrackingType(i, value as 'Discrete' | 'Pro-Rated')}
                          >
                            <SelectTrigger className="h-8 w-36">
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Discrete">Discrete</SelectItem>
                              <SelectItem value="Pro-Rated">Pro-Rated</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className={`text-right ${fontClass}`}>
                        {item.budget_amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.category}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center p-8 text-gray-500">
            <p>No budget data available for {currentMonthName} {currentYear}.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
