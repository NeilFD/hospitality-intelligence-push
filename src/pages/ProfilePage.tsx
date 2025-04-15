
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { UserProfile } from '@/types/supabase-types';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarDays, Briefcase, Cake, Utensils, Wine, MessageSquare, Upload, Camera } from 'lucide-react';
import { useAuthStore } from '@/services/auth-service';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

const ProfilePage = () => {
  const { id } = useParams();
  const { profile: currentUserProfile } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        let profileToLoad;
        
        if (id) {
          // Load another user's profile
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();
            
          if (error) throw error;
          profileToLoad = data;
        } else {
          // Load current user's profile
          profileToLoad = currentUserProfile;
        }
        
        setProfile(profileToLoad);
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    
    loadProfile();
  }, [id, currentUserProfile]);

  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    try {
      setUploadingBanner(true);
      
      // Upload the file to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `banner-${profile.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('profiles')
        .upload(fileName, file);
        
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(fileName);
        
      // Update the profile with the banner URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ banner_url: publicUrl })
        .eq('id', profile.id);
        
      if (updateError) throw updateError;
      
      // Update the local profile state
      setProfile({
        ...profile,
        banner_url: publicUrl
      });
      
      toast.success('Banner image updated successfully');
    } catch (error) {
      console.error('Error uploading banner:', error);
      toast.error('Failed to upload banner image');
    } finally {
      setUploadingBanner(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hi-purple"></div>
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-2">Profile Not Found</h2>
        <p className="text-gray-600 mb-4">The profile you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }
  
  const isCurrentUser = !id || id === currentUserProfile?.id;

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-8 overflow-hidden border-0 shadow-lg">
          <div className="relative h-32">
            {profile.banner_url ? (
              <img 
                src={profile.banner_url} 
                alt="Profile banner" 
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-r from-hi-purple-light to-hi-purple"></div>
            )}
            {isCurrentUser && (
              <label htmlFor="banner-upload" className="absolute bottom-2 right-2 bg-white bg-opacity-80 rounded-full p-2 cursor-pointer hover:bg-opacity-100 transition-colors">
                <Camera className="h-5 w-5 text-hi-purple" />
                <input 
                  type="file" 
                  id="banner-upload" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleBannerUpload}
                  disabled={uploadingBanner}
                />
              </label>
            )}
          </div>
          
          <div className="relative px-6">
            <div className="-mt-16">
              <Avatar className="h-32 w-32 border-4 border-white shadow-md">
                {profile.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt={`${profile.first_name} ${profile.last_name}`} />
                ) : (
                  <AvatarFallback className="bg-hi-purple-light/30 text-hi-purple text-4xl">
                    {profile.first_name?.[0] || ''}{profile.last_name?.[0] || ''}
                  </AvatarFallback>
                )}
              </Avatar>
            </div>
            
            <div className="mt-4">
              <h1 className="text-3xl font-bold">
                {profile.first_name} {profile.last_name}
              </h1>
              <div className="flex items-center mt-1 mb-4">
                <Badge variant="outline" className="mr-2 border-hi-purple-light/50 text-hi-purple">
                  {profile.role || 'Team Member'}
                </Badge>
                {profile.job_title && (
                  <div className="flex items-center text-gray-500">
                    <Briefcase className="h-4 w-4 mr-1" /> {profile.job_title}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <CardContent className="px-6 pb-6">
            <Tabs defaultValue="about" className="mt-2">
              <TabsList className="mb-6">
                <TabsTrigger value="about">About</TabsTrigger>
                {isCurrentUser && <TabsTrigger value="settings">Settings</TabsTrigger>}
              </TabsList>
              
              <TabsContent value="about">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Profile Details</h3>
                    
                    {profile.birth_date && (
                      <div className="flex items-center mb-3 text-gray-700">
                        <Cake className="h-5 w-5 mr-3 text-hi-purple-light" />
                        <span>Birthday: {profile.birth_date}</span>
                      </div>
                    )}
                    
                    {profile.favourite_dish && (
                      <div className="flex items-center mb-3 text-gray-700">
                        <Utensils className="h-5 w-5 mr-3 text-hi-purple-light" />
                        <span>Favourite Dish: {profile.favourite_dish}</span>
                      </div>
                    )}
                    
                    {profile.favourite_drink && (
                      <div className="flex items-center mb-3 text-gray-700">
                        <Wine className="h-5 w-5 mr-3 text-hi-purple-light" />
                        <span>Favourite Drink: {profile.favourite_drink}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center mb-3 text-gray-700">
                      <CalendarDays className="h-5 w-5 mr-3 text-hi-purple-light" />
                      <span>Member since {new Date(profile.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4">About Me</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      {profile.about_me ? (
                        <p className="whitespace-pre-line">{profile.about_me}</p>
                      ) : (
                        <p className="text-gray-500 italic">No bio provided</p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {isCurrentUser && (
                <TabsContent value="settings">
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-hi-purple-light/50 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Profile Settings</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      Profile settings are available in the Control Centre. Please contact your system administrator
                      for assistance in updating your profile information.
                    </p>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
