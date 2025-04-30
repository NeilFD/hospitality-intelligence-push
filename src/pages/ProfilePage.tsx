
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import JobDataSection from '@/components/profile/JobDataSection';
import HiScoreSection from '@/components/profile/HiScoreSection';
import { useAuthStore } from '@/services/auth-service';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const ProfilePage = () => {
  const { userId } = useParams();
  const { profile: currentUserProfile } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditingJob, setIsEditingJob] = useState(false);
  const [editJobForm, setEditJobForm] = useState({
    jobTitle: '',
    employmentType: 'hourly',
    wageRate: 0,
    annualSalary: 0,
    contractorRate: 0,
    employmentStartDate: '',
    employmentStatus: 'full-time',
    minHoursPerWeek: 0,
    maxHoursPerWeek: 40,
    minHoursPerDay: 0,
    maxHoursPerDay: 8,
    availableForRota: true,
    inFtEducation: false
  });
  
  // If no userId is provided, use the current user's profile
  const profileId = userId || currentUserProfile?.id;
  const isOwnProfile = !userId || userId === currentUserProfile?.id;
  
  // Log for debugging
  console.log("ProfilePage - userId from params:", userId);
  console.log("ProfilePage - current user profileId:", currentUserProfile?.id);
  console.log("ProfilePage - using profileId:", profileId);
  
  useEffect(() => {
    if (profileId) {
      console.log("Loading profile data... for ID:", profileId);
      fetchProfile(profileId);
    } else {
      console.warn("No profile ID available");
      setLoading(false);
    }
  }, [profileId]);
  
  const fetchProfile = async (id) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        throw error;
      }
      
      console.log("Loaded profile:", data);
      setProfile(data);

      // Initialize the edit form with current profile data
      if (data) {
        setEditJobForm({
          jobTitle: data.job_title || '',
          employmentType: data.employment_type || 'hourly',
          wageRate: data.wage_rate || 0,
          annualSalary: data.annual_salary || 0,
          contractorRate: data.contractor_rate || 0,
          employmentStartDate: data.employment_start_date || '',
          employmentStatus: data.employment_status || 'full-time',
          minHoursPerWeek: data.min_hours_per_week || 0,
          maxHoursPerWeek: data.max_hours_per_week || 40,
          minHoursPerDay: data.min_hours_per_day || 0,
          maxHoursPerDay: data.max_hours_per_day || 8,
          availableForRota: data.available_for_rota !== false,
          inFtEducation: data.in_ft_education === true
        });
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
      toast("Failed to load profile", {
        description: "There was a problem loading the profile data.",
        style: { backgroundColor: "#f44336", color: "#fff" },
      });
    } finally {
      setLoading(false);
    }
  };
  
  const updateAvailability = async (available) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ available_for_rota: available })
        .eq('id', profileId);
      
      if (error) throw error;
      
      // Update local state
      setProfile(prev => ({
        ...prev,
        available_for_rota: available
      }));
      
      toast(available ? "You are now available for rotas" : "You are now unavailable for rotas");
    } catch (error) {
      console.error('Error updating availability:', error);
      toast("Failed to update availability", {
        description: "There was a problem updating your availability.",
        style: { backgroundColor: "#f44336", color: "#fff" },
      });
    }
  };

  const handleEditJobDetails = () => {
    setIsEditingJob(true);
  };

  const handleCancelEdit = () => {
    setIsEditingJob(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-hi-purple border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="py-12 text-center">
            <h2 className="text-2xl font-semibold text-red-500">Profile Not Found</h2>
            <p className="mt-2 text-muted-foreground">
              This profile does not exist or you don't have permission to view it.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-center">
        <ProfileAvatar 
          profileId={profile.id} 
          avatarUrl={profile.avatar_url} 
          fallback={`${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`}
          size="lg"
        />
      </div>
      
      <Card>
        <CardHeader className="text-center">
          <CardTitle>
            {profile.first_name} {profile.last_name}
          </CardTitle>
          <p className="text-muted-foreground">{profile.role || "Team Member"}</p>
        </CardHeader>
      </Card>
      
      {isOwnProfile && (
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center space-x-4">
              <Switch 
                id="availability" 
                checked={profile.available_for_rota}
                onCheckedChange={updateAvailability}
              />
              <Label htmlFor="availability" className="text-base font-medium cursor-pointer">
                {profile.available_for_rota 
                  ? "Available for rota scheduling" 
                  : "Not available for rota scheduling"}
              </Label>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="job">Job & Performance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="personal" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>About Me</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{profile.about_me || "No information provided."}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground">Favorite Dish</h4>
                  <p>{profile.favourite_dish || "Not specified"}</p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground">Favorite Drink</h4>
                  <p>{profile.favourite_drink || "Not specified"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="job" className="space-y-6 mt-6">
          <JobDataSection 
            profile={profile} 
            isEditing={isEditingJob}
            editForm={editJobForm}
            setEditForm={setEditJobForm}
            onCancel={handleCancelEdit}
            onEditJobDetails={handleEditJobDetails}
          />
          <HiScoreSection 
            profileId={profileId} 
            onScoreUpdate={(score) => console.log("High score updated:", score)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfilePage;
