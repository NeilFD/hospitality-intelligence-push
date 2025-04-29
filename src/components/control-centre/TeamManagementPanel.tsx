
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import TeamMemberProfiles from '@/components/rotas/TeamMemberProfiles';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/services/auth-service';

const TeamManagementPanel: React.FC = () => {
  const [location, setLocation] = useState<any>(null);
  const [jobRoles, setJobRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuthStore();
  
  useEffect(() => {
    const fetchLocationAndRoles = async () => {
      try {
        // Fetch the default location
        const { data: locationData, error: locationError } = await supabase
          .from('locations')
          .select('*')
          .limit(1)
          .single();
          
        if (locationError) throw locationError;
        
        // Fetch job roles
        const { data: rolesData, error: rolesError } = await supabase
          .from('job_roles')
          .select('*')
          .order('title', { ascending: true });
          
        if (rolesError) throw rolesError;
        
        setLocation(locationData);
        setJobRoles(rolesData || []);
      } catch (error) {
        console.error("Error loading team management data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLocationAndRoles();
  }, []);
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <p>Loading team management data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Team Management</h2>
          <p className="text-muted-foreground">Manage team members and their permissions</p>
        </div>
      </div>
      
      {location && (
        <TeamMemberProfiles location={location} jobRoles={jobRoles} />
      )}
    </div>
  );
};

export default TeamManagementPanel;
