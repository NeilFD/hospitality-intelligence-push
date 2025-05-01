
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Save, Trash2, Check, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type RoleMappingProps = {
  location: any;
  jobRoles: any[];
};

export default function RoleMappingPanel({ location, jobRoles }: RoleMappingProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [roleMappings, setRoleMappings] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [newJobTitle, setNewJobTitle] = useState<string>('');
  const [isAddingTitle, setIsAddingTitle] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [commonJobTitles, setCommonJobTitles] = useState<string[]>([
    'General Manager',
    'Assistant Manager',
    'Bar Supervisor',
    'FOH Supervisor',
    'Bar Team',
    'FOH Team',
    'Head Chef', 
    'Sous Chef',
    'Chef de Partie',
    'Commis Chef',
    'KP',
    'Runner',
    'Owner'
  ]);

  useEffect(() => {
    if (location?.id && jobRoles?.length > 0) {
      fetchRoleMappings();
    }
  }, [location, jobRoles]);

  const fetchRoleMappings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('job_role_mappings')
        .select('*')
        .eq('location_id', location.id)
        .order('priority', { ascending: true });

      if (error) throw error;

      // Group mappings by job_role_id
      const mappingsByRole = jobRoles.reduce((acc, role) => {
        const roleId = role.id;
        const mappingsForRole = data?.filter(mapping => mapping.job_role_id === roleId) || [];
        acc[roleId] = mappingsForRole;
        return acc;
      }, {});

      setRoleMappings(mappingsByRole);
      // Default select the first role
      if (jobRoles.length > 0 && !selectedRole) {
        setSelectedRole(jobRoles[0].id);
      }
    } catch (err) {
      console.error('Error fetching role mappings:', err);
      toast.error('Failed to load role mappings');
    } finally {
      setIsLoading(false);
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    // Re-order the mappings for the selected role
    const roleId = selectedRole;
    const currentMappings = [...roleMappings[roleId]];
    const [movedItem] = currentMappings.splice(source.index, 1);
    currentMappings.splice(destination.index, 0, movedItem);

    // Update priority numbers
    const updatedMappings = currentMappings.map((mapping, index) => ({
      ...mapping,
      priority: index + 1
    }));

    // Update the state
    setRoleMappings({
      ...roleMappings,
      [roleId]: updatedMappings
    });
    
    // Save changes to the database
    try {
      // Create update promises for each mapping
      const updatePromises = updatedMappings.map(mapping => 
        supabase
          .from('job_role_mappings')
          .update({ priority: mapping.priority })
          .eq('id', mapping.id)
      );
      
      await Promise.all(updatePromises);
      toast.success('Priority order updated');
    } catch (err) {
      console.error('Error updating priorities:', err);
      toast.error('Failed to update priority order');
      // Revert the state on error
      fetchRoleMappings();
    }
  };

  const addJobTitle = async () => {
    if (!newJobTitle.trim() || !selectedRole) {
      toast.error('Please enter a job title');
      return;
    }

    try {
      setIsSaving(true);
      
      // Find the highest priority number for the selected role
      const currentMappings = roleMappings[selectedRole] || [];
      const highestPriority = currentMappings.length > 0
        ? Math.max(...currentMappings.map(m => m.priority))
        : 0;
      
      // Insert new mapping
      const { data, error } = await supabase
        .from('job_role_mappings')
        .insert({
          job_role_id: selectedRole,
          job_title: newJobTitle.trim(),
          priority: highestPriority + 1,
          location_id: location.id
        })
        .select();

      if (error) throw error;

      // Update local state
      setRoleMappings({
        ...roleMappings,
        [selectedRole]: [...(roleMappings[selectedRole] || []), data[0]]
      });

      setNewJobTitle('');
      setIsAddingTitle(false);
      toast.success('Job title added');
    } catch (err) {
      console.error('Error adding job title:', err);
      toast.error('Failed to add job title');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteMapping = async (mappingId: string) => {
    try {
      // Find which role this mapping belongs to
      let mappingRoleId = '';
      for (const [roleId, mappings] of Object.entries(roleMappings)) {
        if (mappings.some(m => m.id === mappingId)) {
          mappingRoleId = roleId;
          break;
        }
      }

      if (!mappingRoleId) return;

      const { error } = await supabase
        .from('job_role_mappings')
        .delete()
        .eq('id', mappingId);

      if (error) throw error;

      // Update local state
      const updatedMappings = roleMappings[mappingRoleId].filter(m => m.id !== mappingId);
      setRoleMappings({
        ...roleMappings,
        [mappingRoleId]: updatedMappings
      });

      toast.success('Mapping removed');
    } catch (err) {
      console.error('Error deleting mapping:', err);
      toast.error('Failed to delete mapping');
    }
  };

  const regenerateDefaultMappings = async () => {
    try {
      setIsLoading(true);
      
      // Call the backend to regenerate default mappings
      // First delete all existing mappings
      await supabase
        .from('job_role_mappings')
        .delete()
        .eq('location_id', location.id);
      
      // Then regenerate them by calling the SQL migration we already set up
      await supabase.rpc('regenerate_default_job_role_mappings', {
        location_id_param: location.id
      });

      toast.success('Default mappings regenerated');
      fetchRoleMappings();
    } catch (err) {
      console.error('Error regenerating mappings:', err);
      toast.error('Failed to regenerate mappings');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentRoleName = () => {
    if (!selectedRole) return '';
    const role = jobRoles.find(r => r.id === selectedRole);
    return role ? role.title : '';
  };

  return (
    <Card className="shadow-lg rounded-xl border-0">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Role Mapping Matrix</CardTitle>
            <CardDescription>
              Define which job titles can fulfill each role and set their priority order
            </CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">Reset to Default</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reset Role Mappings</DialogTitle>
                <DialogDescription>
                  This will delete all your custom role mappings and restore the default settings.
                  Are you sure you want to continue?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => {}}>Cancel</Button>
                <Button 
                  variant="destructive" 
                  onClick={regenerateDefaultMappings}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Reset Mappings
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <div>
                <label className="text-sm font-medium">Select Role:</label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobRoles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="ml-0 md:ml-4">
                {selectedRole && (
                  <Alert className="bg-blue-50 text-blue-800 border-blue-200">
                    <AlertDescription>
                      Drag and drop job titles to arrange them by priority order. The top-listed job title will be given higher priority in the scheduling algorithm.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            {selectedRole && (
              <>
                <div className="border rounded-md p-4">
                  <h3 className="text-lg font-medium mb-2">
                    Job Titles for "{getCurrentRoleName()}" Role
                  </h3>
                  
                  {roleMappings[selectedRole]?.length === 0 ? (
                    <div className="py-4 text-center text-muted-foreground">
                      No job titles defined for this role. Add a job title to continue.
                    </div>
                  ) : (
                    <DragDropContext onDragEnd={onDragEnd}>
                      <Droppable droppableId="role-mappings">
                        {(provided) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="space-y-2"
                          >
                            {roleMappings[selectedRole]?.map((mapping, index) => (
                              <Draggable
                                key={mapping.id}
                                draggableId={mapping.id}
                                index={index}
                              >
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className="flex items-center justify-between p-3 bg-white rounded-md border shadow-sm"
                                  >
                                    <div className="flex items-center gap-3">
                                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                        {mapping.priority}
                                      </Badge>
                                      <span className="font-medium">
                                        {mapping.job_title}
                                      </span>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => deleteMapping(mapping.id)}
                                    >
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  )}
                  
                  {isAddingTitle ? (
                    <div className="mt-4 flex items-center gap-2">
                      <Select value={newJobTitle} onValueChange={setNewJobTitle}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select or type a job title" />
                        </SelectTrigger>
                        <SelectContent>
                          {commonJobTitles.map((title) => (
                            <SelectItem key={title} value={title}>
                              {title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input 
                        value={newJobTitle} 
                        onChange={(e) => setNewJobTitle(e.target.value)}
                        placeholder="Or type a custom job title"
                        className="flex-1"
                      />
                      <Button 
                        onClick={addJobTitle} 
                        disabled={isSaving || !newJobTitle.trim()}
                      >
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                        Add
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsAddingTitle(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="mt-4"
                      variant="outline"
                      onClick={() => setIsAddingTitle(true)}
                    >
                      Add Job Title
                    </Button>
                  )}
                </div>
              </>
            )}

            <Alert className="mt-4 border-gray-200">
              <AlertCircle className="h-5 w-5" />
              <AlertDescription>
                <p className="text-sm text-muted-foreground">
                  The role mapping matrix defines which job titles can perform each role when generating schedules. 
                  The priority order determines which job titles are preferred for a role when multiple options are available.
                </p>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
