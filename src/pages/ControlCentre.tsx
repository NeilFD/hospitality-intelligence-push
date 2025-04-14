
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { DatabasePanel } from '@/components/control-centre/DatabasePanel';
import { PermissionMatrixPanel } from '@/components/control-centre/PermissionMatrixPanel';
import { ThemeSettingsPanel } from '@/components/control-centre/ThemeSettingsPanel';
import { TargetSettingsPanel } from '@/components/control-centre/TargetSettingsPanel';
import TeamManagementPanel from '@/components/control-centre/TeamManagementPanel';
import RequireAuth from '@/components/auth/RequireAuth';
import { useAuth } from '@/contexts/AuthContext';

const ControlCentre: React.FC = () => {
  const [activeTab, setActiveTab] = useState('targets');
  const { isAuthenticated, userRole } = useAuth();

  // Only GOD and Super Users can access Control Centre
  if (!isAuthenticated || (userRole !== 'GOD' && userRole !== 'Super User')) {
    return <RequireAuth />;
  }

  return (
    <div className="container mx-auto p-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full grid grid-cols-5 gap-2">
          <TabsTrigger value="targets">Business Targets</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="permissions">Permission Matrix</TabsTrigger>
          <TabsTrigger value="themes">Theme Settings</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
        </TabsList>

        <TabsContent value="targets">
          <TargetSettingsPanel />
        </TabsContent>

        <TabsContent value="team">
          <TeamManagementPanel />
        </TabsContent>

        <TabsContent value="permissions">
          <PermissionMatrixPanel />
        </TabsContent>

        <TabsContent value="themes">
          <ThemeSettingsPanel />
        </TabsContent>

        <TabsContent value="database">
          <DatabasePanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ControlCentre;
