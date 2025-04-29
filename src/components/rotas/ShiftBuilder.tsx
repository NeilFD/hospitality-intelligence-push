
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Archive, Check, X, FileEdit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatTime } from '@/lib/date-utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import ShiftRuleForm from './ShiftRuleForm';
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";

interface ShiftBuilderProps {
  location: any;
  jobRoles: any[];
}

export default function ShiftBuilder({ location, jobRoles }: ShiftBuilderProps) {
  const [isAddingShift, setIsAddingShift] = useState(false);
  const [shiftRules, setShiftRules] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [editingShift, setEditingShift] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    if (location?.id) {
      fetchShiftRules();
    }
  }, [location]);

  const fetchShiftRules = async () => {
    setIsLoading(true);
    try {
      const { data: rules, error } = await supabase
        .from('shift_rules')
        .select(`
          *,
          job_roles (*)
        `)
        .eq('location_id', location.id)
        .order('name');
      
      if (error) {
        throw error;
      }
      
      setShiftRules(rules || []);
    } catch (error) {
      console.error('Error fetching shift rules:', error);
      toast.error("Error loading shift rules", {
        description: "There was a problem loading the shift rules."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleArchive = async (shiftId: string, currentArchived: boolean) => {
    try {
      const { error } = await supabase
        .from('shift_rules')
        .update({ archived: !currentArchived })
        .eq('id', shiftId);
      
      if (error) throw error;
      
      // Update local state
      setShiftRules(shiftRules.map(rule => 
        rule.id === shiftId ? {...rule, archived: !currentArchived} : rule
      ));
      
      toast.success(`Shift ${!currentArchived ? 'archived' : 'restored'} successfully`);
    } catch (error) {
      console.error('Error toggling archive status:', error);
      toast.error("Error updating shift", {
        description: "There was a problem updating the shift's archive status."
      });
    }
  };
  
  const handleDeleteShift = async (shiftId: string) => {
    if (confirmDelete !== shiftId) {
      setConfirmDelete(shiftId);
      return;
    }
    
    try {
      const { error } = await supabase
        .from('shift_rules')
        .delete()
        .eq('id', shiftId);
      
      if (error) {
        throw error;
      }
      
      setShiftRules(shiftRules.filter(rule => rule.id !== shiftId));
      setConfirmDelete(null);
      
      toast.success("Shift rule deleted", {
        description: "The shift rule has been removed."
      });
    } catch (error) {
      console.error('Error deleting shift rule:', error);
      toast.error("Error deleting shift rule", {
        description: "There was a problem deleting the shift rule."
      });
    }
  };
  
  const handleEditShift = (shift: any) => {
    setEditingShift(shift);
    setIsAddingShift(true);
  };

  const getDayNames = (dayOfWeek: string) => {
    const days = {
      mon: 'Monday',
      tue: 'Tuesday',
      wed: 'Wednesday',
      thu: 'Thursday',
      fri: 'Friday',
      sat: 'Saturday',
      sun: 'Sunday'
    };
    return days[dayOfWeek as keyof typeof days] || dayOfWeek;
  };

  // Filter shifts based on the active tab
  const filteredShifts = shiftRules.filter(rule => 
    activeTab === 'active' ? !rule.archived : rule.archived
  );

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2">
          <FileEdit className="h-5 w-5 text-blue-500" />
          Shift Builder
        </CardTitle>
        <Button 
          onClick={() => {
            setEditingShift(null);
            setIsAddingShift(true);
          }}
          className="flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          Create Shift
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs 
          defaultValue="active" 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as 'active' | 'archived')}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="active">Active Shifts</TabsTrigger>
            <TabsTrigger value="archived">Archived Shifts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="mt-0">
            {isLoading ? (
              <div className="py-8 text-center">Loading shifts...</div>
            ) : filteredShifts.length === 0 ? (
              <Alert className="bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 my-4">
                <AlertDescription>
                  No active shifts found. Click "Create Shift" to add a new shift rule.
                </AlertDescription>
              </Alert>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Job Role</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShifts.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">
                        {rule.name || 'Unnamed Shift'}
                      </TableCell>
                      <TableCell>{rule.job_roles?.title || 'Unknown'}</TableCell>
                      <TableCell>{getDayNames(rule.day_of_week)}</TableCell>
                      <TableCell>
                        {formatTime(rule.start_time)} - {formatTime(rule.end_time)}
                      </TableCell>
                      <TableCell>
                        {rule.min_staff === rule.max_staff ? 
                          rule.min_staff : 
                          `${rule.min_staff}-${rule.max_staff}`
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditShift(rule)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleArchive(rule.id, !!rule.archived)}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                          {confirmDelete === rule.id ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteShift(rule.id)}
                              >
                                <Check className="h-4 w-4 text-red-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setConfirmDelete(null)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteShift(rule.id)}
                            >
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
          
          <TabsContent value="archived" className="mt-0">
            {isLoading ? (
              <div className="py-8 text-center">Loading archived shifts...</div>
            ) : filteredShifts.length === 0 ? (
              <Alert className="bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 my-4">
                <AlertDescription>
                  No archived shifts found.
                </AlertDescription>
              </Alert>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Job Role</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShifts.map((rule) => (
                    <TableRow key={rule.id} className="opacity-70">
                      <TableCell className="font-medium">
                        {rule.name || 'Unnamed Shift'}
                      </TableCell>
                      <TableCell>{rule.job_roles?.title || 'Unknown'}</TableCell>
                      <TableCell>{getDayNames(rule.day_of_week)}</TableCell>
                      <TableCell>
                        {formatTime(rule.start_time)} - {formatTime(rule.end_time)}
                      </TableCell>
                      <TableCell>
                        {rule.min_staff === rule.max_staff ? 
                          rule.min_staff : 
                          `${rule.min_staff}-${rule.max_staff}`
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleArchive(rule.id, !!rule.archived)}
                          >
                            <Check className="h-4 w-4 text-green-500" />
                          </Button>
                          {confirmDelete === rule.id ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteShift(rule.id)}
                              >
                                <Check className="h-4 w-4 text-red-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setConfirmDelete(null)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteShift(rule.id)}
                            >
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <ShiftRuleForm
        isOpen={isAddingShift}
        onClose={() => {
          setIsAddingShift(false);
          setEditingShift(null);
        }}
        onSubmitComplete={fetchShiftRules}
        locationId={location?.id}
        jobRoles={jobRoles}
        day={null}
        editingShift={editingShift}
      />
    </Card>
  );
}
