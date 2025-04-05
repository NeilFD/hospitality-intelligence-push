import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useStore, useMonthRecord } from '@/lib/store';
import MonthSelector from '@/components/MonthSelector';
import { Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { getMonthName } from '@/lib/date-utils';

export default function InputSettings() {
  const navigate = useNavigate();
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const monthRecord = useMonthRecord(currentYear, currentMonth);
  
  const [gpTarget, setGpTarget] = useState(Math.round(monthRecord.gpTarget * 100));
  const [costTarget, setCostTarget] = useState(Math.round(monthRecord.costTarget * 100));
  const [staffAllowance, setStaffAllowance] = useState(monthRecord.staffFoodAllowance);
  const [suppliers, setSuppliers] = useState(monthRecord.suppliers);

  useEffect(() => {
    setGpTarget(Math.round(monthRecord.gpTarget * 100));
    setCostTarget(Math.round(monthRecord.costTarget * 100));
    setStaffAllowance(monthRecord.staffFoodAllowance);
    setSuppliers([...monthRecord.suppliers]);
  }, [monthRecord]);

  const handleMonthChange = (year: number, month: number) => {
    setCurrentYear(year);
    setCurrentMonth(month);
  };

  const handleAddSupplier = () => {
    const newSupplier = { id: uuidv4(), name: '' };
    setSuppliers([...suppliers, newSupplier]);
  };

  const handleRemoveSupplier = (id: string) => {
    setSuppliers(suppliers.filter(s => s.id !== id));
  };

  const handleSupplierNameChange = (id: string, name: string) => {
    setSuppliers(suppliers.map(s => s.id === id ? { ...s, name } : s));
  };

  const handleSaveSettings = () => {
    const newGpTarget = gpTarget / 100;
    const newCostTarget = costTarget / 100;
    
    useStore.setState(state => {
      const updatedMonths = state.annualRecord.months.map(month => {
        if (month.year === currentYear && month.month === currentMonth) {
          return {
            ...month,
            gpTarget: newGpTarget,
            costTarget: newCostTarget,
            staffFoodAllowance: parseFloat(staffAllowance.toString()),
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
    
    toast.success("Settings saved successfully");
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-tavern-blue">Input Settings</h1>
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
              />
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staffAllowance">Staff Food Allowance (£)</Label>
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

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Suppliers</h3>
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
            >
              <Save className="h-4 w-4 mr-2" /> Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
