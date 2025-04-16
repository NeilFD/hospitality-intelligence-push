
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { DatabasePanel } from '@/components/control-centre/DatabasePanel';
import { PermissionMatrixPanel } from '@/components/control-centre/PermissionMatrixPanel';
import { ThemeSettingsPanel } from '@/components/control-centre/ThemeSettingsPanel';
import { TargetSettingsPanel } from '@/components/control-centre/TargetSettingsPanel';
import TeamManagementPanel from '@/components/control-centre/TeamManagementPanel';
import RequireAuth from '@/components/auth/RequireAuth';
import { getControlCentreData } from '@/services/control-centre-service';
import { PermissionMatrix, ThemeSettings, TargetSettings } from '@/types/control-centre-types';

const ControlCentre: React.FC = () => {
  const [activeTab, setActiveTab] = useState('targets');
  const [controlCentreData, setControlCentreData] = useState<{
    permissionMatrix: PermissionMatrix[];
    currentTheme: ThemeSettings | null;
    availableThemes: ThemeSettings[];
    targetSettings: TargetSettings;
  }>({
    permissionMatrix: [],
    currentTheme: null,
    availableThemes: [],
    targetSettings: {
      foodGpTarget: 68,
      beverageGpTarget: 72,
      wageCostTarget: 28,
    }
  });
  
  const fetchData = async () => {
    try {
      const data = await getControlCentreData();
      setControlCentreData(data);
    } catch (error) {
      console.error('Error fetching control centre data:', error);
    }
  };
  
  useEffect(() => {
    fetchData();
    
    // Add event listener for business targets updates
    window.addEventListener('business-targets-updated', fetchData);
    
    return () => {
      window.removeEventListener('business-targets-updated', fetchData);
    };
  }, []);

  // Wrap the entire Control Centre with RequireAuth that requires Super User or higher
  return (
    <RequireAuth requiredRole="Super User">
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
            <TargetSettingsPanel targetSettings={controlCentreData.targetSettings} />
          </TabsContent>

          <TabsContent value="team">
            <TeamManagementPanel />
          </TabsContent>

          <TabsContent value="permissions">
            <PermissionMatrixPanel permissionMatrix={controlCentreData.permissionMatrix} />
          </TabsContent>

          <TabsContent value="themes">
            <ThemeSettingsPanel 
              currentTheme={controlCentreData.currentTheme} 
              availableThemes={controlCentreData.availableThemes} 
            />
          </TabsContent>

          <TabsContent value="database">
            <DatabasePanel />
          </TabsContent>
        </Tabs>
      </div>
    </RequireAuth>
  );
};

export default ControlCentre;
