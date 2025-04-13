
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from '@/services/auth-service';
import { getControlCentreData } from '@/services/control-centre-service';
import { PermissionMatrixPanel } from '@/components/control-centre/PermissionMatrixPanel';
import { ThemeSettingsPanel } from '@/components/control-centre/ThemeSettingsPanel';
import { TargetSettingsPanel } from '@/components/control-centre/TargetSettingsPanel';
import { DatabasePanel } from '@/components/control-centre/DatabasePanel';
import { Navigate } from 'react-router-dom';
export default function ControlCentre() {
  const {
    profile
  } = useAuthStore();
  const [activeTab, setActiveTab] = useState('permissions');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const controlCentreData = await getControlCentreData();
        setData(controlCentreData);
        setError(null);
      } catch (err) {
        setError('Failed to load Control Centre data');
        console.error('Error loading Control Centre data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Only allow GOD and Super User access
  if (profile?.role !== 'GOD' && profile?.role !== 'Super User') {
    return <Navigate to="/" replace />;
  }

  // Only GOD users can access the database panel
  const isGodUser = profile?.role === 'GOD';
  return <div className="container py-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Control Centre</h1>
        <p className="text-muted-foreground mt-1">
          Configure system settings and user permissions
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger 
            value="permissions" 
            className="bg-[#8e44ad] hover:bg-[#7d3c98] text-white font-medium transition-colors duration-200 data-[state=active]:bg-[#6c3483] data-[state=active]:shadow-md"
          >
            Permissions
          </TabsTrigger>
          <TabsTrigger 
            value="theme" 
            className="bg-[#8e44ad] hover:bg-[#7d3c98] text-white font-medium transition-colors duration-200 data-[state=active]:bg-[#6c3483] data-[state=active]:shadow-md"
          >
            Brand & Theme
          </TabsTrigger>
          <TabsTrigger 
            value="targets" 
            className="bg-[#8e44ad] hover:bg-[#7d3c98] text-white font-medium transition-colors duration-200 data-[state=active]:bg-[#6c3483] data-[state=active]:shadow-md"
          >
            Business Targets
          </TabsTrigger>
          {isGodUser && <TabsTrigger 
            value="database" 
            className="bg-[#e84393] hover:bg-[#d63384] text-white font-medium transition-colors duration-200 data-[state=active]:bg-[#c2185b] data-[state=active]:shadow-md"
          >
            Database
          </TabsTrigger>}
        </TabsList>

        <TabsContent value="permissions" className="space-y-6">
          {loading ? <Card>
              <CardContent className="pt-6">
                <div className="h-96 flex items-center justify-center">
                  <p>Loading permissions data...</p>
                </div>
              </CardContent>
            </Card> : <PermissionMatrixPanel permissionMatrix={data?.permissionMatrix || []} />}
        </TabsContent>

        <TabsContent value="theme" className="space-y-6">
          {loading ? <Card>
              <CardContent className="pt-6">
                <div className="h-96 flex items-center justify-center">
                  <p>Loading theme settings...</p>
                </div>
              </CardContent>
            </Card> : <ThemeSettingsPanel currentTheme={data?.currentTheme} availableThemes={data?.availableThemes || []} />}
        </TabsContent>

        <TabsContent value="targets" className="space-y-6">
          {loading ? <Card>
              <CardContent className="pt-6">
                <div className="h-96 flex items-center justify-center">
                  <p>Loading target settings...</p>
                </div>
              </CardContent>
            </Card> : <TargetSettingsPanel targetSettings={data?.targetSettings} />}
        </TabsContent>

        {isGodUser && <TabsContent value="database" className="space-y-6">
            <DatabasePanel />
          </TabsContent>}
      </Tabs>

      {error && <div className="mt-4 p-4 bg-red-50 text-red-800 rounded-md">
          {error}
        </div>}
    </div>;
}
