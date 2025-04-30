
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
      <ProfileAvatar profile={profile} isOwnProfile={isOwnProfile} />
      
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
          <JobDataSection profile={profile} />
          <HiScoreSection profileId={profileId} isOwnProfile={isOwnProfile} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfilePage;
