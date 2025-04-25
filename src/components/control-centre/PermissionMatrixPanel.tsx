
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PermissionMatrix } from '@/types/control-centre-types';
import { toast } from 'sonner';
import { updatePermissionMatrix } from '@/services/control-centre-service';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

interface PermissionMatrixPanelProps {
  permissionMatrix: PermissionMatrix[];
}

export function PermissionMatrixPanel({ permissionMatrix: initialMatrix }: PermissionMatrixPanelProps) {
  const [matrix, setMatrix] = useState<PermissionMatrix[]>(initialMatrix || []);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch permission matrix directly from Supabase on component mount
  useEffect(() => {
    const fetchPermissionMatrix = async () => {
      try {
        setLoading(true);
        
        // Call the RPC function to get the permission matrix
        const { data, error: rpcError } = await supabase.rpc('get_permission_matrix');
        
        if (rpcError) {
          console.error('Error fetching permission matrix:', rpcError);
          setError('Failed to load permission matrix. Please try refreshing the page.');
          return;
        }
        
        // Log the raw response data to help with debugging
        console.log('Raw permission matrix response:', data);
        
        if (data && Array.isArray(data)) {
          console.log('Fetched permission matrix (array):', data);
          setMatrix(data);
        } else if (data) {
          // Handle case where data is not an array (e.g., JSON object)
          console.log('Fetched permission matrix (non-array):', data);
          // Try to use the data as is, it might be already in the correct format
          setMatrix(Array.isArray(data) ? data : [data]);
        } else {
          // If no data returned but also no error, use the initial data
          console.log('Using initial permission matrix data');
          setMatrix(initialMatrix || []);
        }
      } catch (err) {
        console.error('Exception fetching permission matrix:', err);
        setError('An unexpected error occurred while loading the permission matrix.');
      } finally {
        setLoading(false);
      }
    };

    fetchPermissionMatrix();
  }, [initialMatrix]);

  // Toggle module access with error handling and proper null checks
  const toggleModuleAccess = (roleId: string, moduleId: string) => {
    try {
      setMatrix(prevMatrix => 
        prevMatrix.map(role => 
          role.roleId === roleId 
            ? {
                ...role,
                modulePermissions: role.modulePermissions.map(module => 
                  module.moduleId === moduleId 
                    ? {
                        ...module,
                        hasAccess: !module.hasAccess,
                        // If turning off module access, also turn off page access
                        // Only map if pagePermissions exists and is an array
                        pagePermissions: Array.isArray(module.pagePermissions) 
                          ? module.pagePermissions.map(page => ({
                              ...page,
                              hasAccess: !module.hasAccess ? false : page.hasAccess
                            }))
                          : []
                      }
                    : module
                )
              }
            : role
        )
      );
    } catch (err) {
      console.error('Error toggling module access:', err);
      toast.error('Failed to update permissions. Please try again.');
    }
  };

  // Toggle page access with error handling and proper null checks
  const togglePageAccess = (roleId: string, moduleId: string, pageId: string) => {
    try {
      setMatrix(prevMatrix => 
        prevMatrix.map(role => 
          role.roleId === roleId 
            ? {
                ...role,
                modulePermissions: role.modulePermissions.map(module => 
                  module.moduleId === moduleId 
                    ? {
                        ...module,
                        pagePermissions: Array.isArray(module.pagePermissions)
                          ? module.pagePermissions.map(page => 
                              page.pageId === pageId 
                                ? { ...page, hasAccess: !page.hasAccess }
                                : page
                            )
                          : [],
                        // If any page has access, the module must have access
                        hasAccess: module.hasAccess || 
                          (Array.isArray(module.pagePermissions) && 
                            module.pagePermissions.some(page => 
                              page.pageId === pageId && !page.hasAccess
                            ))
                      }
                    : module
                )
              }
            : role
        )
      );
    } catch (err) {
      console.error('Error toggling page access:', err);
      toast.error('Failed to update permissions. Please try again.');
    }
  };

  // Save changes to the database with improved error handling
  const saveChanges = async () => {
    try {
      setSaving(true);
      
      console.log('Saving permission matrix:', JSON.stringify(matrix, null, 2));
      
      // Validate matrix structure before sending
      if (!Array.isArray(matrix) || matrix.length === 0) {
        throw new Error('Invalid matrix structure: matrix must be a non-empty array');
      }
      
      // Ensure that each role has valid modulePermissions
      const validMatrix = matrix.map(role => ({
        ...role,
        modulePermissions: Array.isArray(role.modulePermissions) ? role.modulePermissions : []
      }));
      
      // Call the RPC function directly using Supabase client
      const { data, error: updateError } = await supabase.rpc('update_permission_matrix', {
        matrix: validMatrix
      });
      
      if (updateError) {
        console.error('Error updating permission matrix:', updateError);
        toast.error('Failed to save permission matrix: ' + updateError.message);
        return;
      }
      
      console.log('Save response:', data);
      toast.success('Permission matrix saved successfully');
    } catch (error) {
      console.error('Exception saving permission matrix:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to save permission matrix: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Permission Matrix</CardTitle>
          <CardDescription>
            Control which user roles can access modules and their specific pages
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center p-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <p>Loading permission matrix...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Permission Matrix</CardTitle>
          <CardDescription>
            Control which user roles can access modules and their specific pages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-6 bg-red-50 text-red-800 rounded-md">
            <p className="font-medium">Error loading permission matrix</p>
            <p className="mt-1">{error}</p>
            <Button 
              variant="outline" 
              className="mt-3"
              onClick={() => window.location.reload()}
            >
              Refresh page
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check if matrix is empty or not properly formatted
  if (!matrix || matrix.length === 0 || !Array.isArray(matrix)) {
    console.error('Matrix data is invalid:', matrix);
    return (
      <Card>
        <CardHeader>
          <CardTitle>Permission Matrix</CardTitle>
          <CardDescription>
            Control which user roles can access modules and their specific pages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-6 bg-yellow-50 text-yellow-800 rounded-md">
            <p className="font-medium">No permission data available</p>
            <p className="mt-1">The permission matrix data is not in the expected format.</p>
            <Button 
              variant="outline" 
              className="mt-3"
              onClick={() => window.location.reload()}
            >
              Refresh page
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permission Matrix</CardTitle>
        <CardDescription>
          Control which user roles can access modules and their specific pages
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="overflow-x-auto">
            <Accordion type="multiple" className="w-full">
              {matrix.map(role => (
                <AccordionItem key={role.roleId} value={role.roleId}>
                  <AccordionTrigger>
                    <span className="font-semibold">{role.roleId}</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[300px]">Module / Page</TableHead>
                          <TableHead className="text-center">Access</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.isArray(role.modulePermissions) && role.modulePermissions.length > 0 ? (
                          role.modulePermissions.map(module => (
                            <React.Fragment key={module.moduleId}>
                              <TableRow className="bg-muted/50">
                                <TableCell className="font-medium">{module.moduleName}</TableCell>
                                <TableCell className="text-center">
                                  <Checkbox 
                                    checked={module.hasAccess} 
                                    onCheckedChange={() => toggleModuleAccess(role.roleId, module.moduleId)}
                                    // Disable toggling for GOD role to prevent locking them out
                                    disabled={role.roleId === 'GOD'}
                                  />
                                </TableCell>
                              </TableRow>
                              {module.pagePermissions && Array.isArray(module.pagePermissions) && module.pagePermissions.map(page => (
                                <TableRow key={page.pageId}>
                                  <TableCell className="pl-6">{page.pageName}</TableCell>
                                  <TableCell className="text-center">
                                    <Checkbox 
                                      checked={page.hasAccess && module.hasAccess} 
                                      onCheckedChange={() => togglePageAccess(role.roleId, module.moduleId, page.pageId)}
                                      disabled={!module.hasAccess || role.roleId === 'GOD'}
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </React.Fragment>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center py-4 text-gray-500">
                              No modules defined for this role.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={saveChanges} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
