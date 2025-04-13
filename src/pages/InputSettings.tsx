import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useStore, useMonthRecord } from '@/lib/store';
import MonthSelector from '@/components/MonthSelector';
import { Plus, Trash2, Save, FileUp } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { getMonthName } from '@/lib/date-utils';
import { ModuleType } from '@/types/kitchen-ledger';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchSuppliers, createSupplier, updateSupplier, deleteSupplier, 
  fetchMonthlySettings, createMonthlySettings, updateMonthlySettings
} from '@/services/kitchen-service';
import { useBudgetProcessor } from '@/utils/budget/hooks';
import { getControlCentreData } from '@/services/control-centre-service';

interface InputSettingsProps {
  modulePrefix?: string;
  moduleType?: ModuleType;
}

export default function InputSettings({ modulePrefix = "", moduleType = "food" }: InputSettingsProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const monthRecord = useMonthRecord(currentYear, currentMonth, moduleType);
  
  const [gpTarget, setGpTarget] = useState(Math.round(monthRecord.gpTarget * 100));
  const [costTarget, setCostTarget] = useState(Math.round(monthRecord.costTarget * 100));
  const [staffAllowance, setStaffAllowance] = useState(monthRecord.staffFoodAllowance);
  const [suppliers, setSuppliers] = useState(monthRecord.suppliers);
  const [isLoading, setIsLoading] = useState(true);
  const [budgetFile, setBudgetFile] = useState<File | null>(null);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const { processBudget } = useBudgetProcessor();
  const [businessTargets, setBusinessTargets] = useState<any>(null);

  // Fetch business targets from Control Centre
  const { data: controlCentreData, isLoading: isLoadingTargets } = useQuery({
    queryKey: ['control-centre-data'],
    queryFn: async () => {
      try {
        const data = await getControlCentreData();
        console.log("Fetched Control Centre Data:", data);
        return data;
      } catch (error) {
        console.error("Error fetching control centre data:", error);
        return null;
      }
    }
  });

  // Fetch suppliers from Supabase
  const { data: supabaseSuppliers, isLoading: isFetchingSuppliers } = useQuery({
    queryKey: ['suppliers', moduleType],
    queryFn: async () => {
      const data = await fetchSuppliers(moduleType);
      return data;
    }
  });

  // Fetch monthly settings from Supabase
  const { data: monthlySettings, isLoading: isFetchingSettings } = useQuery({
    queryKey: ['monthly-settings', currentYear, currentMonth, moduleType],
    queryFn: async () => {
      try {
        const settings = await fetchMonthlySettings(currentYear, currentMonth, moduleType);
        console.log(`Monthly settings for ${currentYear}-${currentMonth} (${moduleType}):`, settings);
        return settings;
      } catch (error) {
        console.error('Error fetching monthly settings:', error);
        return null;
      }
    }
  });

  // Load business targets from Control Centre
  useEffect(() => {
    if (controlCentreData && !isLoadingTargets) {
      console.log("Control Centre Data:", controlCentreData.targetSettings);
      setBusinessTargets(controlCentreData.targetSettings);
    }
  }, [controlCentreData, isLoadingTargets]);

  // Mutations for suppliers
  const createSupplierMutation = useMutation({
    mutationFn: createSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', moduleType] });
      toast.success('Supplier added successfully');
    },
    onError: (error) => {
      toast.error(`Error adding supplier: ${error.message}`);
    }
  });

  const updateSupplierMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: any }) => updateSupplier(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', moduleType] });
      toast.success('Supplier updated successfully');
    },
    onError: (error) => {
      toast.error(`Error updating supplier: ${error.message}`);
    }
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', moduleType] });
      toast.success('Supplier deleted successfully');
    },
    onError: (error) => {
      toast.error(`Error deleting supplier: ${error.message}`);
    }
  });

  // Mutations for monthly settings
  const createMonthlySettingsMutation = useMutation({
    mutationFn: createMonthlySettings,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['monthly-settings', currentYear, currentMonth, moduleType] });
      setSettingsId(data.id);
      toast.success('Monthly settings saved to database');
    },
    onError: (error) => {
      toast.error(`Error saving monthly settings: ${error.message}`);
    }
  });

  const updateMonthlySettingsMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: any }) => updateMonthlySettings(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly-settings', currentYear, currentMonth, moduleType] });
      toast.success('Monthly settings updated in database');
    },
    onError: (error) => {
      toast.error(`Error updating monthly settings: ${error.message}`);
    }
  });

  // Load suppliers from Supabase
  useEffect(() => {
    if (supabaseSuppliers && !isFetchingSuppliers) {
      const mappedSuppliers = supabaseSuppliers.map(s => ({
        id: s.id,
        name: s.name
      }));
      
      if (mappedSuppliers.length > 0) {
        setSuppliers(mappedSuppliers);
      }
      setIsLoading(false);
    }
  }, [supabaseSuppliers, isFetchingSuppliers]);

  // Set GP and Cost targets based on monthly settings or business targets
  useEffect(() => {
    // First priority: Use monthly_settings if available
    if (monthlySettings && !isFetchingSettings) {
      console.log("Using monthly settings:", monthlySettings);
      setSettingsId(monthlySettings.id);
      
      // If we have monthly settings, use those values
      setGpTarget(Math.round(monthlySettings.gp_target * 100));
      setCostTarget(Math.round(monthlySettings.cost_target * 100));
      setStaffAllowance(monthlySettings.staff_food_allowance);
    } 
    // Second priority: Use business targets from Control Centre
    else if (businessTargets) {
      console.log("Using business targets:", businessTargets);
      if (moduleType === 'food') {
        // Ensure we're using the current business target value
        setGpTarget(Math.round(businessTargets.foodGpTarget));
        setCostTarget(100 - Math.round(businessTargets.foodGpTarget));
      } else if (moduleType === 'beverage') {
        setGpTarget(Math.round(businessTargets.beverageGpTarget));
        setCostTarget(100 - Math.round(businessTargets.beverageGpTarget));
      }
      setStaffAllowance(monthRecord.staffFoodAllowance);
    }
    // Fallback to local state
    else {
      console.log("Using local state (monthRecord)");
      setGpTarget(Math.round(monthRecord.gpTarget * 100));
      setCostTarget(Math.round(monthRecord.costTarget * 100));
      setStaffAllowance(monthRecord.staffFoodAllowance);
    }
  }, [monthlySettings, isFetchingSettings, businessTargets, moduleType, monthRecord]);

  const handleMonthChange = (year: number, month: number) => {
    // Invalidate the queries when month changes
    queryClient.invalidateQueries({ queryKey: ['monthly-settings', year, month, moduleType] });
    queryClient.invalidateQueries({ queryKey: ['control-centre-data'] });
    setCurrentYear(year);
    setCurrentMonth(month);
  };

  const handleAddSupplier = () => {
    const newSupplier = { id: uuidv4(), name: '' };
    setSuppliers([...suppliers, newSupplier]);
  };

  const handleRemoveSupplier = (id: string) => {
    const supplierToDelete = supabaseSuppliers?.find(s => s.id === id);
    if (supplierToDelete) {
      deleteSupplierMutation.mutate(id);
    }
    setSuppliers(suppliers.filter(s => s.id !== id));
  };

  const handleSupplierNameChange = (id: string, name: string) => {
    setSuppliers(suppliers.map(s => s.id === id ? { ...s, name } : s));
  };
  
  const handleBudgetFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBudgetFile(file);
      toast.success(`${file.name} selected. Ready to process.`);
    }
  };
  
  const handleBudgetUpload = async () => {
    if (!budgetFile) return;
    
    try {
      const result = await processBudget(budgetFile, currentYear, currentMonth);
      if (result) {
        toast.success(`Budget for ${getMonthName(currentMonth)} ${currentYear} imported successfully`);
        setBudgetFile(null);
      }
    } catch (error) {
      console.error("Budget upload error:", error);
      toast.error("Failed to process budget file");
    }
  };

  const handleSaveSettings = async () => {
    console.log("Saving settings with values:", {
      gpTarget: gpTarget / 100,
      costTarget: costTarget / 100,
      staffAllowance,
      suppliers
    });
    
    const newGpTarget = gpTarget / 100;
    const newCostTarget = costTarget / 100;
    const newStaffAllowance = parseFloat(staffAllowance.toString());
    
    // Update Supabase settings
    const settingsData = {
      year: currentYear,
      month: currentMonth,
      gp_target: newGpTarget,
      cost_target: newCostTarget,
      staff_food_allowance: newStaffAllowance,
      module_type: moduleType
    };
    
    try {
      if (settingsId) {
        // Update existing settings
        console.log("Updating existing settings with ID:", settingsId);
        await updateMonthlySettingsMutation.mutateAsync({
          id: settingsId,
          updates: settingsData
        });
      } else {
        // Create new settings
        console.log("Creating new settings");
        await createMonthlySettingsMutation.mutateAsync(settingsData);
      }
    } catch (error) {
      console.error('Error saving settings to Supabase:', error);
    }
    
    // Also update local state for immediate UI updates
    useStore.setState(state => {
      const updatedMonths = state.annualRecord.months.map(month => {
        if (month.year === currentYear && month.month === currentMonth) {
          return {
            ...month,
            gpTarget: newGpTarget,
            costTarget: newCostTarget,
            staffFoodAllowance: newStaffAllowance,
            suppliers: suppliers.filter(s => s.name.trim() !== '')
          };
        }
        return month;
      });
      
      return {
        ...state,
        annualRecord: {
          ...state.annualRecord,
          months: updatedMonths
        }
      };
    });
    
    // Save suppliers to Supabase
    const validSuppliers = suppliers.filter(s => s.name.trim() !== '');
    
    for (const supplier of validSuppliers) {
      const existingSupplier = supabaseSuppliers?.find(s => s.id === supplier.id);
      
      if (existingSupplier) {
        if (existingSupplier.name !== supplier.name) {
          await updateSupplierMutation.mutateAsync({ 
            id: supplier.id, 
            updates: { 
              name: supplier.name,
              module_type: moduleType
            } 
          });
        }
      } else {
        await createSupplierMutation.mutateAsync({ 
          name: supplier.name, 
          module_type: moduleType,
          contact_name: null,
          email: null,
          phone: null,
          notes: null
        });
      }
    }
    
    toast.success("Settings saved successfully");
    
    // Immediately refresh data to ensure UI is up to date
    queryClient.invalidateQueries({ queryKey: ['monthly-settings', currentYear, currentMonth, moduleType] });
    queryClient.invalidateQueries({ queryKey: ['control-centre-data'] });
  };

  const pageTitle = modulePrefix ? `${modulePrefix} Input Settings` : "Input Settings";

  // Determine if we should disable the target input fields
  const isGpTargetReadOnly = moduleType === 'food' || moduleType === 'beverage';
  
  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-tavern-blue">{pageTitle}</h1>
        <MonthSelector 
          currentYear={currentYear} 
          currentMonth={currentMonth}
          onChangeMonth={handleMonthChange} 
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Settings - {getMonthName(currentMonth)} {currentYear}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gpTarget">GP Target (%)</Label>
              <Input 
                id="gpTarget" 
                type="number" 
                min="0" 
                max="100"
                value={gpTarget} 
                onChange={(e) => {
                  const value = Math.min(100, Math.max(0, parseInt(e.target.value || '0')));
                  setGpTarget(value);
                  setCostTarget(100 - value);
                }}
                readOnly={isGpTargetReadOnly}
                className={isGpTargetReadOnly ? "bg-gray-100" : ""}
              />
              {isGpTargetReadOnly && (
                <p className="text-xs text-muted-foreground mt-1">
                  Value set in Control Centre
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="costTarget">Cost Target (%)</Label>
              <Input 
                id="costTarget" 
                type="number"
                min="0" 
                max="100" 
                value={costTarget}
                onChange={(e) => {
                  const value = Math.min(100, Math.max(0, parseInt(e.target.value || '0')));
                  setCostTarget(value);
                  setGpTarget(100 - value);
                }}
                readOnly={isGpTargetReadOnly}
                className={isGpTargetReadOnly ? "bg-gray-100" : ""}
              />
              {isGpTargetReadOnly && (
                <p className="text-xs text-muted-foreground mt-1">
                  Value set in Control Centre
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="staffAllowance">Staff {moduleType === 'food' ? 'Food' : moduleType === 'beverage' ? 'Beverage' : ''} Allowance (£)</Label>
              <Input 
                id="staffAllowance" 
                type="number" 
                min="0"
                step="0.01"
                value={staffAllowance} 
                onChange={(e) => setStaffAllowance(parseFloat(e.target.value))} 
              />
            </div>
          </div>
          
          {moduleType === 'pl' && (
            <div className="space-y-4 border p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Budget Import</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budgetFile">Upload Excel Budget File</Label>
                  <Input
                    id="budgetFile"
                    type="file"
                    accept=".csv, .xls, .xlsx"
                    onChange={handleBudgetFileChange}
                    className="
                      file:mr-4 
                      file:py-2 
                      file:px-4 
                      file:rounded-full 
                      file:text-sm 
                      file:font-semibold 
                      file:bg-blue-50 
                      file:text-blue-700 
                      hover:file:bg-blue-100
                    "
                  />
                  <p className="text-xs text-gray-500">Upload the monthly budget Excel file format</p>
                </div>
                
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={handleBudgetUpload}
                    disabled={!budgetFile}
                    className="w-full"
                  >
                    <FileUp className="h-4 w-4 mr-2" /> Process Budget File
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">{moduleType === 'food' ? 'Food' : 'Beverage'} Suppliers</h3>
              <Button onClick={handleAddSupplier} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add Supplier
              </Button>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {suppliers.map((supplier) => (
                <div key={supplier.id} className="flex items-center space-x-2">
                  <Input
                    value={supplier.name}
                    onChange={(e) => handleSupplierNameChange(supplier.id, e.target.value)}
                    placeholder="Supplier name"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => handleRemoveSupplier(supplier.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button 
              variant="default" 
              onClick={handleSaveSettings}
              disabled={createSupplierMutation.isPending || updateSupplierMutation.isPending || deleteSupplierMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" /> Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
