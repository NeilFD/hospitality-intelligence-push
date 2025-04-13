
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
        
        if (data && Array.isArray(data)) {
          console.log('Fetched permission matrix:', data);
          setMatrix(data);
        } else if (data) {
          // If data is not an array but exists (e.g., a single object), convert to array
          console.log('Fetched permission matrix (converted):', data);
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

  // Toggle module access
  const toggleModuleAccess = (roleId: string, moduleId: string) => {
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
                      pagePermissions: module.pagePermissions.map(page => ({
                        ...page,
                        hasAccess: !module.hasAccess ? false : page.hasAccess
                      }))
                    }
                  : module
              )
            }
          : role
      )
    );
  };

  // Toggle page access
  const togglePageAccess = (roleId: string, moduleId: string, pageId: string) => {
    setMatrix(prevMatrix => 
      prevMatrix.map(role => 
        role.roleId === roleId 
          ? {
              ...role,
              modulePermissions: role.modulePermissions.map(module => 
                module.moduleId === moduleId 
                  ? {
                      ...module,
                      pagePermissions: module.pagePermissions.map(page => 
                        page.pageId === pageId 
                          ? { ...page, hasAccess: !page.hasAccess }
                          : page
                      ),
                      // If any page has access, the module must have access
                      hasAccess: module.hasAccess || 
                        module.pagePermissions.some(page => 
                          page.pageId === pageId && !page.hasAccess
                        )
                    }
                  : module
              )
            }
          : role
      )
    );
  };

  // Save changes to the database
  const saveChanges = async () => {
    try {
      setSaving(true);
      
      // Update permission matrix in the database
      await updatePermissionMatrix(matrix);
      
      toast.success('Permission matrix saved successfully');
    } catch (error) {
      toast.error('Failed to save permission matrix');
      console.error('Error saving permission matrix:', error);
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
          {matrix.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p>No permission data available. Please check database configuration.</p>
            </div>
          ) : (
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
                          {role.modulePermissions && role.modulePermissions.length > 0 ? (
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
                                {module.pagePermissions && module.pagePermissions.map(page => (
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
          )}
          
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
