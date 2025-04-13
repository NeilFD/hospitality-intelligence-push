
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PermissionMatrix } from '@/types/control-centre-types';
import { toast } from 'sonner';

interface PermissionMatrixPanelProps {
  permissionMatrix: PermissionMatrix[];
}

export function PermissionMatrixPanel({ permissionMatrix }: PermissionMatrixPanelProps) {
  const [matrix, setMatrix] = useState<PermissionMatrix[]>(permissionMatrix);
  const [saving, setSaving] = useState(false);

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

  // Save changes
  const saveChanges = async () => {
    try {
      setSaving(true);
      // Here we would send the updated matrix to the server
      // For now, we'll just simulate a delay and show a success message
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Permission matrix saved successfully');
    } catch (error) {
      toast.error('Failed to save permission matrix');
      console.error('Error saving permission matrix:', error);
    } finally {
      setSaving(false);
    }
  };

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
                        {role.modulePermissions.map(module => (
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
                            {module.pagePermissions.map(page => (
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
                        ))}
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
