
import React, { useState, useEffect } from 'react';
import { useSetCurrentModule } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, Settings, Users, FileEdit, BarChart, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";
import { Skeleton } from '@/components/ui/skeleton';
import { RotasLogo } from '@/components/RotasLogo';
import RotaRequestForm from '@/components/rotas/RotaRequestForm';
import RotaThresholdEditor from '@/components/rotas/RotaThresholdEditor';
import RotaScheduleReview from '@/components/rotas/RotaScheduleReview';
import RotaScheduleApproval from '@/components/rotas/RotaScheduleApproval';
import StaffRankingPanel from '@/components/rotas/StaffRankingPanel';
import { useAuthStore } from '@/services/auth-service';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function RotaScheduling() {
  const setCurrentModule = useSetCurrentModule();
  const { profile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('request');
  const [location, setLocation] = useState<any>(null);
  const [staffIssues, setStaffIssues] = useState<string[]>([]);
  
  // Check if user has permission to access this page
  const canAccessPage = profile?.role === 'Super User' || profile?.role === 'Owner' || profile?.role === 'GOD';
  
  // Force set current module to 'hiq' when component mounts
  useEffect(() => {
    setCurrentModule('hiq');
    
    // Fetch initial data
    fetchLocationData();
    
    return () => {
      // Cleanup if needed
    };
  }, [setCurrentModule]);
  
  const validateLocationData = (locationData: any) => {
    if (!locationData) {
      return "No location data found.";
    }
    if (!locationData.id) {
      return "Location data is missing an ID.";
    }
    return null; // No errors
  };
  
  const fetchLocationData = async () => {
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
      
      // Validate location data
      const validationError = validateLocationData(locationData);
      if (validationError) {
        toast.error("Invalid location data", {
          description: validationError
        });
        console.error("Location validation error:", validationError);
        return;
      }
      
      setLocation(locationData);
      
      console.log("Location data loaded:", locationData);
      
      // Also fetch staff to check availability and wage data issues
      const { data: staffData, error: staffError } = await supabase
        .from('profiles')
        .select('*')
        .eq('available_for_rota', true);
        
      if (!staffError && staffData) {
        console.log(`Found ${staffData.length} available staff members for scheduling`);
        
        if (staffData.length === 0) {
          toast.warning("No available staff found", {
            description: "Mark staff as available for rota to include them in scheduling."
          });
        }
        
        // Check for staff with missing wage information
        const staffIssuesList: string[] = [];
        staffData.forEach(staff => {
          const name = `${staff.first_name} ${staff.last_name}`;
          
          if (staff.employment_type === 'hourly' && (!staff.wage_rate || staff.wage_rate <= 0)) {
            staffIssuesList.push(`${name} (hourly) has no valid hourly rate set`);
          }
          
          if (staff.employment_type === 'salaried' && (!staff.annual_salary || staff.annual_salary <= 0)) {
            staffIssuesList.push(`${name} (salaried) has no valid annual salary set`);
          }
          
          if (staff.employment_type === 'contractor' && (!staff.wage_rate || staff.wage_rate <= 0)) {
            staffIssuesList.push(`${name} (contractor) has no valid contractor rate set`);
          }
        });
        
        setStaffIssues(staffIssuesList);
        
        if (staffIssuesList.length > 0) {
          toast.warning(`${staffIssuesList.length} staff with missing wage data`, {
            description: "Some staff members have missing or invalid wage information. This will affect cost calculations."
          });
        }
      }
      
      // Also fetch shift rules to ensure they're available
      const { data: shiftRules, error: shiftRulesError } = await supabase
        .from('shift_rules')
        .select('id, name, job_role_id, day_of_week')
        .eq('location_id', locationData.id)
        .eq('archived', false);
        
      if (!shiftRulesError && shiftRules) {
        console.log(`Found ${shiftRules.length} shift rules for scheduling`);
        
        if (shiftRules.length === 0) {
          toast.info("No shift rules found", {
            description: "You may want to create shift rules first for optimal scheduling."
          });
        }
      }
      
      // Also check if job roles exist
      const { data: jobRoles, error: jobRolesError } = await supabase
        .from('job_roles')
        .select('*')
        .eq('location_id', locationData.id);
        
      if (!jobRolesError && jobRoles) {
        console.log(`Found ${jobRoles.length} job roles for scheduling`);
        
        if (jobRoles.length === 0) {
          toast.warning("No job roles defined", {
            description: "You need to create job roles before scheduling can work properly."
          });
        }
      }
      
      // Also fetch role mapping data to ensure we can use it in the algorithm
      const { data: roleMappings, error: roleMappingsError } = await supabase
        .from('job_role_mappings')
        .select('*')
        .eq('location_id', locationData.id);
        
      if (!roleMappingsError && roleMappings) {
        console.log(`Found ${roleMappings.length} role mappings for scheduling`);
        
        if (roleMappings.length === 0) {
          toast.warning("No role mappings defined", {
            description: "You may want to set up role mappings for optimal staff assignment."
          });
        }
      }
      
    } catch (error) {
      console.error('Error fetching location data:', error);
      toast.error("Error loading location data", {
        description: "There was a problem loading the location data."
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!canAccessPage) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="text-4xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold mb-2">Access Restricted</h1>
        <p className="text-muted-foreground text-center">
          You don't have permission to access the AI Rota Engine. 
          This feature is only available to Super User, Owner and GOD roles.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in h-full w-full overflow-auto">
      <div className="px-0 space-y-4">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-[#3a86ff]/60 to-[#0072ff]/80 rounded-lg shadow-glass">
              <Calendar className="h-5 w-5 text-white/90" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#3a86ff] via-[#0072ff] to-[#3a86ff] bg-clip-text text-transparent">
              AI Rota Engine
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <RotasLogo size="md" className="hidden md:block animate-float" />
          </div>
        </div>
        
        {staffIssues.length > 0 && (
          <div className="px-4 mb-4">
            <Alert variant="warning" className="bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription>
                <div className="font-medium text-amber-800 mb-1">
                  Staff with missing wage information
                </div>
                <ul className="text-sm list-disc pl-5 text-amber-700 space-y-1">
                  {staffIssues.slice(0, 3).map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                  {staffIssues.length > 3 && (
                    <li>Plus {staffIssues.length - 3} more issues...</li>
                  )}
                </ul>
                <p className="text-xs mt-2 text-amber-600">
                  Missing wage information will result in £0.00 costs. Please update staff profiles with correct wage data.
                </p>
              </AlertDescription>
            </Alert>
          </div>
        )}
        
        <Card className="shadow-md rounded-none border-x-0 m-0 w-full">
          <CardHeader className="pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>AI Rota Scheduling</CardTitle>
                <CardDescription>Generate optimal rotas based on revenue forecasts and staff capabilities</CardDescription>
              </div>
              <Button variant="outline" onClick={fetchLocationData}>Refresh Data</Button>
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
              <Tabs defaultValue="request" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full grid grid-cols-5 mb-6">
                  <TabsTrigger value="request" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="hidden sm:inline">Request Rota</span>
                    <span className="sm:hidden">Request</span>
                  </TabsTrigger>
                  <TabsTrigger value="thresholds" className="flex items-center gap-2">
                    <BarChart className="h-4 w-4" />
                    <span className="hidden sm:inline">Thresholds</span>
                    <span className="sm:hidden">Thresholds</span>
                  </TabsTrigger>
                  <TabsTrigger value="review" className="flex items-center gap-2">
                    <FileEdit className="h-4 w-4" />
                    <span className="hidden sm:inline">Review Draft</span>
                    <span className="sm:hidden">Review</span>
                  </TabsTrigger>
                  <TabsTrigger value="approval" className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">Approve & Publish</span>
                    <span className="sm:hidden">Approve</span>
                  </TabsTrigger>
                  <TabsTrigger value="staff" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="hidden sm:inline">Staff Ranking</span>
                    <span className="sm:hidden">Staff</span>
                  </TabsTrigger>
                </TabsList>
                
                <div className="mb-4">
                  <Separator />
                </div>
                
                <TabsContent value="request" className="mt-0 space-y-4">
                  <RotaRequestForm location={location} onRequestComplete={() => setActiveTab('review')} />
                </TabsContent>
                
                <TabsContent value="thresholds" className="mt-0 space-y-4">
                  <RotaThresholdEditor location={location} />
                </TabsContent>
                
                <TabsContent value="review" className="mt-0 space-y-4">
                  <RotaScheduleReview
                    location={location}
                    onApprovalRequest={() => setActiveTab('approval')}
                  />
                </TabsContent>
                
                <TabsContent value="approval" className="mt-0 space-y-4">
                  <RotaScheduleApproval
                    location={location}
                  />
                </TabsContent>
                
                <TabsContent value="staff" className="mt-0 space-y-4">
                  <StaffRankingPanel location={location} />
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
