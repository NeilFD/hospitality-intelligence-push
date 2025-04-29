import React, { useEffect, useState } from 'react';
import { useSetCurrentModule } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Calendar, ClipboardList, Settings, Users, FileEdit } from 'lucide-react';
import WeeklyOverviewPanel from '@/components/rotas/WeeklyOverviewPanel';
import TeamMemberProfiles from '@/components/rotas/TeamMemberProfiles';
import GlobalRulesSettings from '@/components/rotas/GlobalRulesSettings';
import ShiftBuilder from '@/components/rotas/ShiftBuilder';
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";
import { Skeleton } from '@/components/ui/skeleton';
import { RotasLogo } from '@/components/RotasLogo';
import { updateJobRoles } from '@/components/rotas/JobRolesUtils';

export default function HiQRotas() {
  const setCurrentModule = useSetCurrentModule();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('weekly-overview');
  const [location, setLocation] = useState<any>(null);
  const [jobRoles, setJobRoles] = useState<any[]>([]);
  const [globalConstraints, setGlobalConstraints] = useState<any>(null);
  
  // Force set current module to 'hiq' when component mounts
  useEffect(() => {
    console.log('HiQRotas: Setting current module to hiq');
    setCurrentModule('hiq');
    
    // Also update localStorage directly for consistency
    try {
      // Update tavern-kitchen-ledger store
      const storeData = localStorage.getItem('tavern-kitchen-ledger');
      if (storeData) {
        const parsedData = JSON.parse(storeData);
        if (parsedData.state) {
          parsedData.state.currentModule = 'hiq';
          localStorage.setItem('tavern-kitchen-ledger', JSON.stringify(parsedData));
        }
      }
      
      // Update hospitality-intelligence store
      const hiData = localStorage.getItem('hospitality-intelligence');
      if (hiData) {
        const parsedData = JSON.parse(hiData);
        if (parsedData.state) {
          parsedData.state.currentModule = 'hiq';
          localStorage.setItem('hospitality-intelligence', JSON.stringify(parsedData));
        }
      }
    } catch (e) {
      console.error('HiQRotas: Error updating localStorage:', e);
    }
    
    // Add a class to help with debugging
    document.body.classList.add('hiq-rotas-page');
    
    // Fetch initial data
    fetchInitialData();
    
    return () => {
      document.body.classList.remove('hiq-rotas-page');
    };
  }, [setCurrentModule]);
  
  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      // Fetch location data
      const { data: locationData, error: locationError } = await supabase
        .from('locations')
        .select('*')
        .limit(1)
        .single();
      
      if (locationError) {
        throw locationError;
      }
      
      setLocation(locationData);
      
      // Update job roles (add Chef Manager and change Kitchen Assistant to Kitchen Porter)
      await updateJobRoles(locationData.id);
      
      // Fetch job roles (after updating them)
      const { data: jobRolesData, error: jobRolesError } = await supabase
        .from('job_roles')
        .select('*')
        .eq('location_id', locationData.id);
        
      if (jobRolesError) {
        throw jobRolesError;
      }
      
      setJobRoles(jobRolesData);
      
      // Fetch global constraints
      const { data: constraintsData, error: constraintsError } = await supabase
        .from('global_constraints')
        .select('*')
        .eq('location_id', locationData.id)
        .limit(1)
        .single();
        
      if (constraintsError && constraintsError.code !== 'PGRST116') {
        throw constraintsError;
      }
      
      setGlobalConstraints(constraintsData || null);
      
    } catch (error) {
      console.error('Error fetching rota data:', error);
      toast.error("Error loading data", {
        description: "There was a problem loading rota configuration data."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in h-full w-full overflow-auto">
      <div className="px-0 space-y-4">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-[#3a86ff]/60 to-[#0072ff]/80 rounded-lg shadow-glass">
              <ClipboardList className="h-5 w-5 text-white/90" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#3a86ff] via-[#0072ff] to-[#3a86ff] bg-clip-text text-transparent">
              Staff Rota Configuration
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <RotasLogo size="md" className="hidden md:block animate-float" />
          </div>
        </div>
        
        <Card className="shadow-md rounded-none border-x-0 m-0 w-full">
          <CardHeader className="pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Rota Manager</CardTitle>
                <CardDescription>Configure staff scheduling rules and constraints</CardDescription>
              </div>
              <Button variant="outline" onClick={fetchInitialData}>Refresh Data</Button>
            </div>
          </CardHeader>
          <CardContent className="pt-2 px-4">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <div className="grid gap-4 md:grid-cols-3">
                  <Skeleton className="h-[400px] w-full" />
                  <Skeleton className="h-[400px] w-full" />
                  <Skeleton className="h-[400px] w-full" />
                </div>
              </div>
            ) : (
              <Tabs defaultValue="weekly-overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full grid grid-cols-4 mb-6">
                  <TabsTrigger value="weekly-overview" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="hidden sm:inline">Weekly Overview</span>
                    <span className="sm:hidden">Overview</span>
                  </TabsTrigger>
                  <TabsTrigger value="shift-builder" className="flex items-center gap-2">
                    <FileEdit className="h-4 w-4" />
                    <span className="hidden sm:inline">Shift Builder</span>
                    <span className="sm:hidden">Shifts</span>
                  </TabsTrigger>
                  <TabsTrigger value="team-members" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="hidden sm:inline">Team Members</span>
                    <span className="sm:hidden">Team</span>
                  </TabsTrigger>
                  <TabsTrigger value="global-rules" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">Global Rules</span>
                    <span className="sm:hidden">Rules</span>
                  </TabsTrigger>
                </TabsList>
                
                <div className="mb-4">
                  <Separator />
                </div>
                
                <TabsContent value="weekly-overview" className="mt-0 space-y-4">
                  <WeeklyOverviewPanel 
                    location={location} 
                    jobRoles={jobRoles} 
                  />
                </TabsContent>
                
                <TabsContent value="shift-builder" className="mt-0 space-y-4">
                  <ShiftBuilder
                    location={location}
                    jobRoles={jobRoles}
                  />
                </TabsContent>
                
                <TabsContent value="team-members" className="mt-0 space-y-4">
                  <TeamMemberProfiles 
                    location={location} 
                    jobRoles={jobRoles}
                  />
                </TabsContent>
                
                <TabsContent value="global-rules" className="mt-0 space-y-4">
                  <GlobalRulesSettings 
                    location={location} 
                    globalConstraints={globalConstraints} 
                    setGlobalConstraints={setGlobalConstraints}
                  />
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
