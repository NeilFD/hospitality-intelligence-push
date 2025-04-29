import React, { useEffect, useState, useRef } from 'react';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { Switch } from '@/components/ui/switch';
import { useParams, useNavigate } from 'react-router-dom';
import { UserProfile } from '@/types/supabase-types';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarDays, Briefcase, Cake, Utensils, Wine, MessageSquare, Upload, Camera, Edit, Save, X, Move, Check, Bell, Pencil, BriefcaseBusiness, Star } from 'lucide-react';
import { useAuthStore } from '@/services/auth-service';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { fabric } from 'fabric';
import { Slider } from '@/components/ui/slider';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ProfilePictureUploader } from '@/components/team/ProfilePictureUploader';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import JobDataSection from '@/components/profile/JobDataSection';
import HiScoreSection from '@/components/profile/HiScoreSection';

// Extend the UserProfile type with the job data properties
interface ExtendedUserProfile extends UserProfile {
  employment_type?: string;
  min_hours_per_day?: number;
  max_hours_per_day?: number;
  min_hours_per_week?: number;
  max_hours_per_week?: number;
  wage_rate?: number;
  annual_salary?: number;
  contractor_rate?: number;
  available_for_rota?: boolean;
  employment_start_date?: string;
  employment_status?: string;
}

// Job title options
const FOH_JOB_TITLES = [
  "Owner",
  "General Manager",
  "Assistant Manager",
  "Bar Supervisor",
  "FOH Supervisor",
  "FOH Team",
  "Bar Team",
  "Runner"
];

const BOH_JOB_TITLES = [
  "Head Chef",
  "Sous Chef",
  "Chef de Partie",
  "Commis Chef",
  "KP"
];

// All job titles combined
const JOB_TITLES = [...FOH_JOB_TITLES, ...BOH_JOB_TITLES];

const ProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { profile: currentUserProfile, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [profile, setProfile] = useState<ExtendedUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isRepositioningBanner, setIsRepositioningBanner] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    jobTitle: '',
    favouriteDish: '',
    favouriteDrink: '',
    aboutMe: '',
    birthDate: '',
    employmentType: '',
    minHoursPerDay: 0,
    maxHoursPerDay: 0,
    minHoursPerWeek: 0,
    maxHoursPerWeek: 0,
    wageRate: 0,
    annualSalary: 0,
    contractorRate: 0,
    availableForRota: true,
    employmentStartDate: '',
    employmentStatus: 'full-time'
  });
  
  // State for managing active tab
  const [activeTab, setActiveTab] = useState('about');
  
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [yPosition, setYPosition] = useState(0);
  const [canvasInitialized, setCanvasInitialized] = useState(false);
  const isMountedRef = useRef(true);
  const profileLoadAttemptedRef = useRef(false);
  const initialRenderRef = useRef(true);
  const activeObjectRef = useRef<fabric.Object | null>(null);

  const { 
    isSubscribed, 
    subscribeUser, 
    unsubscribeUser, 
    isSupported, 
    isPermissionBlocked 
  } = usePushNotifications();

  // Check if user has permission to view job data tab (GOD, SuperUser, or Owner)
  const hasJobDataAccess = () => {
    if (!currentUserProfile?.role) return false;
    return ['GOD', 'Super User', 'Owner', 'Manager'].includes(currentUserProfile.role.toString());
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      console.log("User not authenticated in ProfilePage. Redirecting to login.");
      toast.error("Please log in to view profiles");
      navigate("/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    const loadProfile = async () => {
      if (authLoading || !isAuthenticated) {
        console.log("Skipping profile load while authentication is loading or user not authenticated");
        return;
      }
      
      if (!currentUserProfile && userId === undefined) {
        if (profileLoadAttemptedRef.current) {
          console.log("Waiting for current user profile to be available");
          return;
        } else {
          console.log("First attempt to load current user profile");
        }
      }
      
      profileLoadAttemptedRef.current = true;
      
      if (initialRenderRef.current) {
        setLoading(true);
        initialRenderRef.current = false;
      }
      
      try {
        console.log("Loading profile data...", userId ? `for ID: ${userId}` : "for current user");
        let profileToLoad;
        
        if (userId) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();
            
          if (error) throw error;
          
          if (!data) {
            toast.error("Profile not found");
            navigate('/home/dashboard');
            return;
          }
          
          profileToLoad = data;
        } else {
          if (!currentUserProfile) {
            console.log("Current user profile not available yet");
            return; // Will try again when currentUserProfile becomes available
          }
          profileToLoad = currentUserProfile as ExtendedUserProfile;
        }
        
        console.log("Loaded profile:", profileToLoad);
        
        if (profileToLoad?.banner_position_y !== undefined && profileToLoad?.banner_position_y !== null) {
          setYPosition(profileToLoad.banner_position_y);
        }
        
        setProfile(profileToLoad);
        
        if (profileToLoad) {
          setEditForm({
            firstName: profileToLoad.first_name || '',
            lastName: profileToLoad.last_name || '',
            jobTitle: profileToLoad.job_title || '',
            favouriteDish: profileToLoad.favourite_dish || '',
            favouriteDrink: profileToLoad.favourite_drink || '',
            aboutMe: profileToLoad.about_me || '',
            birthDate: profileToLoad.birth_date || '',
            employmentType: profileToLoad.employment_type || 'hourly',
            minHoursPerDay: profileToLoad.min_hours_per_day || 0,
            maxHoursPerDay: profileToLoad.max_hours_per_day || 8,
            minHoursPerWeek: profileToLoad.min_hours_per_week || 0,
            maxHoursPerWeek: profileToLoad.max_hours_per_week || 40,
            wageRate: profileToLoad.wage_rate || 0,
            annualSalary: profileToLoad.annual_salary || 0,
            contractorRate: profileToLoad.contractor_rate || 0,
            availableForRota: profileToLoad.available_for_rota !== undefined ? profileToLoad.available_for_rota : true,
            employmentStartDate: profileToLoad.employment_start_date || '',
            employmentStatus: profileToLoad.employment_status || 'full-time'
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Failed to load profile');
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };
    
    loadProfile();

    return () => {
      isMountedRef.current = false;
    };
  }, [userId, currentUserProfile, isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (
      !userId && 
      !loading && 
      currentUserProfile && 
      isAuthenticated && 
      (!profile || profile.id !== currentUserProfile.id)
    ) {
      console.log("Updating profile from currentUserProfile change");
      setProfile(currentUserProfile as ExtendedUserProfile);
      
      const extendedProfile = currentUserProfile as ExtendedUserProfile;
      
      setEditForm({
        firstName: currentUserProfile.first_name || '',
        lastName: currentUserProfile.last_name || '',
        jobTitle: currentUserProfile.job_title || '',
        favouriteDish: currentUserProfile.favourite_dish || '',
        favouriteDrink: currentUserProfile.favourite_drink || '',
        aboutMe: currentUserProfile.about_me || '',
        birthDate: currentUserProfile.birth_date || '',
        employmentType: extendedProfile.employment_type || 'hourly',
        minHoursPerDay: extendedProfile.min_hours_per_day || 0,
        maxHoursPerDay: extendedProfile.max_hours_per_day || 8,
        minHoursPerWeek: extendedProfile.min_hours_per_week || 0,
        maxHoursPerWeek: extendedProfile.max_hours_per_week || 40,
        wageRate: extendedProfile.wage_rate || 0,
        annualSalary: extendedProfile.annual_salary || 0,
        contractorRate: extendedProfile.contractor_rate || 0,
        availableForRota: extendedProfile.available_for_rota !== undefined ? extendedProfile.available_for_rota : true,
        employmentStartDate: extendedProfile.employment_start_date || '',
        employmentStatus: extendedProfile.employment_status || 'full-time'
      });
    }
  }, [currentUserProfile, userId, loading, profile, isAuthenticated]);

  // Clean up canvas resources when component unmounts
  useEffect(() => {
    return () => {
      try {
        if (canvasRef.current) {
          // Safely clear any active objects
          if (activeObjectRef.current) {
            try {
              canvasRef.current.discardActiveObject();
              canvasRef.current.remove(activeObjectRef.current);
              activeObjectRef.current = null;
            } catch (e) {
              console.log("Error removing active object during cleanup:", e);
            }
          }
          
          // Clear and dispose of canvas
          canvasRef.current.clear();
          canvasRef.current.dispose();
          canvasRef.current = null;
        }
      } catch (e) {
        console.log('Error during canvas cleanup on unmount:', e);
      }
    };
  }, []);

  useEffect(() => {
    if (isRepositioningBanner && canvasElRef.current && containerRef.current && profile?.banner_url && !canvasInitialized) {
      const initCanvas = async () => {
        try {
          // Clean up any existing canvas instance first
          if (canvasRef.current) {
            if (activeObjectRef.current) {
              try {
                canvasRef.current.discardActiveObject();
                canvasRef.current.remove(activeObjectRef.current);
                activeObjectRef.current = null;
              } catch (e) {
                console.log("Error removing active object:", e);
              }
            }
            
            canvasRef.current.clear();
            canvasRef.current.dispose();
            canvasRef.current = null;
          }
          
          const container = containerRef.current;
          if (!container) return;
          
          const containerWidth = container.clientWidth;
          const containerHeight = container.clientHeight;
          
          await new Promise(resolve => setTimeout(resolve, 0));
          
          if (!canvasElRef.current || !isMountedRef.current) return;
          
          const canvas = new fabric.Canvas(canvasElRef.current, {
            width: containerWidth,
            height: containerHeight,
            backgroundColor: "#ffffff",
            selection: false,
          });
          
          canvasRef.current = canvas;
          setCanvasInitialized(true);
          
          // Create a new image object in Fabric.js
          fabric.Image.fromURL(profile.banner_url, (img) => {
            if (!isMountedRef.current || !canvas) return;
            
            const scale = containerWidth / img.width!;
            img.scaleX = scale;
            img.scaleY = scale;
            
            img.lockMovementX = true;
            img.lockRotation = true;
            img.lockScalingX = true;
            img.lockScalingY = true;
            
            img.left = 0;
            img.top = yPosition || 0;
            
            // Add image to canvas
            try {
              canvas.add(img);
              canvas.setActiveObject(img);
              activeObjectRef.current = img;
              
              img.on('moved', function() {
                if (isMountedRef.current) {
                  setYPosition(img.top || 0);
                }
              });
              
              canvas.renderAll();
            } catch (e) {
              console.log("Error adding image to canvas:", e);
            }
          });
        } catch (e) {
          console.error('Error initializing canvas:', e);
          setCanvasInitialized(false);
        }
      };
      
      initCanvas();
    }
  }, [isRepositioningBanner, profile?.banner_url, canvasInitialized, yPosition]);

  useEffect(() => {
    if (!isRepositioningBanner && canvasInitialized) {
      const cleanupCanvas = () => {
        try {
          if (canvasRef.current) {
            if (activeObjectRef.current) {
              try {
                canvasRef.current.discardActiveObject();
                canvasRef.current.remove(activeObjectRef.current);
                activeObjectRef.current = null;
              } catch (e) {
                console.log("Error removing active object during mode switch:", e);
              }
            }
            
            canvasRef.current.clear();
            canvasRef.current.dispose();
            canvasRef.current = null;
          }
        } catch (e) {
          console.log('Error cleaning up canvas:', e);
        } finally {
          setCanvasInitialized(false);
        }
      };
      
      setTimeout(cleanupCanvas, 0);
    }
  }, [isRepositioningBanner, canvasInitialized]);

  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) {
      console.log("No file selected or profile not loaded");
      return;
    }

    try {
      setUploadingBanner(true);
      console.log("Uploading banner image:", file.name);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `banner-${profile.id}-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(`${profile.id}/${fileName}`, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast.error('Failed to upload banner image');
        return;
      }
      
      console.log("File uploaded successfully:", uploadData);
      
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(`${profile.id}/${fileName}`);
      
      console.log("Public URL:", publicUrl);
        
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ banner_url: publicUrl })
        .eq('id', profile.id);
        
      if (updateError) {
        console.error("Profile update error:", updateError);
        toast.error('Failed to update profile with banner');
        return;
      }
      
      console.log("Profile updated with new banner URL");
      
      setProfile(prevProfile => {
        if (!prevProfile) return null;
        return {
          ...prevProfile,
          banner_url: publicUrl
        };
      });
      
      toast.success('Banner image updated successfully');
    } catch (error) {
      console.error('Error uploading banner:', error);
      toast.error('Failed to upload banner image');
    } finally {
      setUploadingBanner(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleStartRepositioning = () => {
    setIsRepositioningBanner(true);
  };

  const handleSaveRepositioning = async () => {
    if (!profile) return;
    
    try {
      console.log("Saving banner position:", yPosition, "for profile ID:", profile.id);
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          banner_position_y: yPosition
        })
        .eq('id', profile.id);
        
      if (error) {
        console.error("Error saving banner position:", error);
        toast.error('Failed to save banner position');
        return;
      }
      
      setProfile(prevProfile => {
        if (!prevProfile) return null;
        return {
          ...prevProfile,
          banner_position_y: yPosition
        };
      });
      
      setIsRepositioningBanner(false);
      toast.success('Banner position updated');
    } catch (error) {
      console.error('Error saving banner position:', error);
      toast.error('Failed to save banner position');
    }
  };

  const handleCancelRepositioning = () => {
    if (profile?.banner_position_y !== undefined && profile.banner_position_y !== null) {
      setYPosition(profile.banner_position_y);
    }
    setIsRepositioningBanner(false);
  };

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (profile) {
      setEditForm({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        jobTitle: profile.job_title || '',
        favouriteDish: profile.favourite_dish || '',
        favouriteDrink: profile.favourite_drink || '',
        aboutMe: profile.about_me || '',
        birthDate: profile.birth_date || '',
        employmentType: profile.employment_type || 'hourly',
        minHoursPerDay: profile.min_hours_per_day || 0,
        maxHoursPerDay: profile.max_hours_per_day || 8,
        minHoursPerWeek: profile.min_hours_per_week || 0,
        maxHoursPerWeek: profile.max_hours_per_week || 40,
        wageRate: profile.wage_rate || 0,
        annualSalary: profile.annual_salary || 0,
        contractorRate: profile.contractor_rate || 0,
        availableForRota: profile.available_for_rota !== undefined ? profile.available_for_rota : true,
        employmentStartDate: profile.employment_start_date || '',
        employmentStatus: profile.employment_status || 'full-time'
      });
    }
    setIsEditing(false);
    setActiveTab('job-data');
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    
    try {
      const updateData: any = {
        first_name: editForm.firstName,
        last_name: editForm.lastName,
        favourite_dish: editForm.favouriteDish,
        favourite_drink: editForm.favouriteDrink,
        about_me: editForm.aboutMe,
        birth_date: editForm.birthDate,
        job_title: editForm.jobTitle,
        employment_type: editForm.employmentType,
        min_hours_per_day: editForm.minHoursPerDay,
        max_hours_per_day: editForm.maxHoursPerDay,
        min_hours_per_week: editForm.minHoursPerWeek,
        max_hours_per_week: editForm.maxHoursPerWeek,
        available_for_rota: editForm.availableForRota,
        employment_start_date: editForm.employmentStartDate,
        employment_status: editForm.employmentStatus
      };
      
      // Add appropriate wage field based on employment type
      if (editForm.employmentType === 'hourly') {
        updateData.wage_rate = editForm.wageRate;
      } else if (editForm.employmentType === 'salary') {
        updateData.annual_salary = editForm.annualSalary;
      } else if (editForm.employmentType === 'contractor') {
        updateData.contractor_rate = editForm.contractorRate;
      }
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id);
        
      if (error) throw error;
      
      setProfile({
        ...profile,
        ...updateData
      });
      
      setIsEditing(false);
      setActiveTab('job-data');
      toast.success('Profile updated successfully');
      
      if (!userId && currentUserProfile) {
        useAuthStore.setState({
          profile: {
            ...currentUserProfile,
            ...updateData
          } as any
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  // New function to handle the "Edit Job Details" button click
  const handleEditJobDetails = () => {
    setActiveTab('job-data-edit');
  };

  const handleUpdateAvatar = (updatedProfile: any) => {
    // Update the profile if it's been changed
    if (updatedProfile && profile) {
      setProfile({
        ...profile,
        avatar_url: updatedProfile.avatar_url
      });
      
      // If this is the current user, update the auth store
      if (!userId && currentUserProfile) {
        useAuthStore.setState({
          profile: {
            ...currentUserProfile,
            avatar_url: updatedProfile.avatar_url
          } as any
        });
      }
    }
  };

  if (loading || authLoading) {
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
  
  const isCurrentUser = !userId || userId === currentUserProfile?.id;

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-8 overflow-hidden border-0 shadow-xl rounded-xl">
          <div ref={containerRef} className="relative h-48 sm:h-64">
            {isRepositioningBanner ? (
              <div className="h-full w-full">
                <canvas ref={canvasElRef} className="w-full h-full"></canvas>
                
                <div className="absolute top-0 left-0 w-full bg-gradient-to-b from-black/50 to-transparent px-4 py-2 flex items-center justify-between">
                  <div className="text-white text-sm font-medium">
                    Drag image up or down to reposition
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="bg-white text-hi-purple hover:bg-gray-100"
                      onClick={handleCancelRepositioning}
                    >
                      <X className="h-4 w-4 mr-1" /> Cancel
                    </Button>
                    
                    <Button 
                      size="sm" 
                      className="bg-hi-purple text-white hover:bg-hi-purple-dark"
                      onClick={handleSaveRepositioning}
                    >
                      <Save className="h-4 w-4 mr-1" /> Save
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full w-full group relative">
                {profile.banner_url ? (
                  <img 
                    src={profile.banner_url} 
                    alt="Profile banner" 
                    className="h-full w-full object-cover"
                    style={{ objectPosition: `center ${profile.banner_position_y !== undefined && profile.banner_position_y !== null ? profile.banner_position_y : yPosition}px` }}
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-r from-hi-purple-light to-hi-purple"></div>
                )}
                {isCurrentUser && (
                  <div className="absolute bottom-4 right-4 flex space-x-2 z-10">
                    {profile.banner_url && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white transition-colors shadow-md border border-white/50"
                              onClick={handleStartRepositioning}
                            >
                              <Move className="h-4 w-4 mr-1" /> Reposition
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Adjust the banner image position</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <label htmlFor="banner-upload" className="bg-white/80 backdrop-blur-sm rounded-md p-2 cursor-pointer hover:bg-white transition-colors shadow-md border border-white/50 flex items-center justify-center">
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
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Upload a new banner image</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent"></div>
              </div>
            )}
          </div>
          
          <div className="relative px-6">
            <div className="-mt-16 flex items-end gap-4 relative z-10">
              <div className="relative">
                {isCurrentUser ? (
                  <ProfilePictureUploader profile={profile} onAvatarUpdate={handleUpdateAvatar} />
                ) : (
                  <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
                    {profile.avatar_url ? (
                      <AvatarImage src={profile.avatar_url} alt={`${profile.first_name} ${profile.last_name}`} />
                    ) : (
                      <AvatarFallback className="bg-hi-purple-light/30 text-hi-purple text-4xl">
                        {profile.first_name?.[0] || ''}{profile.last_name?.[0] || ''}
                      </AvatarFallback>
                    )}
                  </Avatar>
                )}
              </div>
            </div>
            
            <div className="mt-4">
              <h1 className="text-3xl font-bold">
                {profile.first_name} {profile.last_name}
              </h1>
              <div className="flex items-center gap-3 mt-1 mb-4">
                <Badge variant="outline" className="border-hi-purple-light/50 text-hi-purple">
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
          
          <CardContent className="px-6 pb-6 pt-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="mb-6 bg-gray-100 p-1 rounded-lg w-full">
                <TabsTrigger value="about" className="rounded-md w-full">About</TabsTrigger>
                
                {/* Only show Job Data tabs to users with appropriate permissions */}
                {hasJobDataAccess() && (
                  <>
                    <TabsTrigger value="job-data" className="rounded-md w-full">
                      <div className="flex items-center justify-center">
                        <BriefcaseBusiness className="h-4 w-4 mr-2" />
                        Job Data
                      </div>
                    </TabsTrigger>
                    
                    <TabsTrigger value="hi-score" className="rounded-md w-full">
                      <div className="flex items-center justify-center">
                        <Star className="h-4 w-4 mr-2" />
                        Hi Score
                      </div>
                    </TabsTrigger>
                  </>
                )}
                
                {isCurrentUser && (
                  <>
                    <TabsTrigger value="settings" className="rounded-md w-full">
                      <div className="flex items-center justify-center">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </div>
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="rounded-md w-full">
                      <div className="flex items-center justify-center">
                        <Bell className="h-4 w-4 mr-2" />
                        Notifications
                      </div>
                    </TabsTrigger>
                  </>
                )}
              </TabsList>
              
              {/* About Tab */}
              <TabsContent value="about">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Profile Details</h3>
                    
                    {profile.birth_date && (
                      <div className="flex items-center mb-3 text-gray-700 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <Cake className="h-5 w-5 mr-3 text-hi-purple" />
                        <span>Birthday: {profile.birth_date}</span>
                      </div>
                    )}
                    
                    {profile.favourite_dish && (
                      <div className="flex items-center mb-3 text-gray-700 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <Utensils className="h-5 w-5 mr-3 text-hi-purple" />
                        <span>Favourite Dish: {profile.favourite_dish}</span>
                      </div>
                    )}
                    
                    {profile.favourite_drink && (
                      <div className="flex items-center mb-3 text-gray-700 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <Wine className="h-5 w-5 mr-3 text-hi-purple" />
                        <span>Favourite Drink: {profile.favourite_drink}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center mb-3 text-gray-700 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <CalendarDays className="h-5 w-5 mr-3 text-hi-purple" />
                      <span>Member since {new Date(profile.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4">About Me</h3>
                    <div className="bg-gray-50 p-5 rounded-lg shadow-inner">
                      {profile.about_me ? (
                        <p className="whitespace-pre-line">{profile.about_me}</p>
                      ) : (
                        <p className="text-gray-500 italic">No bio provided</p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Job Data Tab */}
              {hasJobDataAccess() && (
                <TabsContent value="job-data">
                  <JobDataSection
                    profile={profile}
                    isEditing={false}
                    editForm={editForm}
                    setEditForm={setEditForm}
                    onCancel={handleCancelEdit}
                    onEditJobDetails={handleEditJobDetails}
                  />
                </TabsContent>
              )}
              
              {/* Job Data Edit Tab */}
              {hasJobDataAccess() && (
                <TabsContent value="job-data-edit">
                  <JobDataSection
                    profile={profile}
                    isEditing={true}
                    editForm={editForm}
                    setEditForm={setEditForm}
                    onCancel={() => setActiveTab('job-data')}
                    onEditJobDetails={handleEditJobDetails}
                  />
                  
                  <div className="flex justify-end mt-4">
                    <Button onClick={handleSaveProfile} className="bg-hi-purple hover:bg-hi-purple-dark">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </TabsContent>
              )}
              
              {/* Hi Score Tab */}
              {hasJobDataAccess() && (
                <TabsContent value="hi-score">
                  {profile?.id && <HiScoreSection profileId={profile.id} />}
                </TabsContent>
              )}
              
              {/* Settings Tab */}
              {isCurrentUser && (
                <TabsContent value="settings">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Personal Details</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="firstName">First Name</Label>
                            <Input 
                              id="firstName" 
                              value={editForm.firstName} 
                              onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                              placeholder="First Name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input 
                              id="lastName" 
                              value={editForm.lastName} 
                              onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                              placeholder="Last Name"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="birthDate">Birth Date</Label>
                          <Input 
                            id="birthDate" 
                            value={editForm.birthDate} 
                            onChange={(e) => setEditForm({...editForm, birthDate: e.target.value})}
                            placeholder="DD/MM/YYYY"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="favouriteDish">Favourite Dish</Label>
                          <Input 
                            id="favouriteDish" 
                            value={editForm.favouriteDish} 
                            onChange={(e) => setEditForm({...editForm, favouriteDish: e.target.value})}
                            placeholder="What's your favourite dish?"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="favouriteDrink">Favourite Drink</Label>
                          <Input 
                            id="favouriteDrink" 
                            value={editForm.favouriteDrink} 
                            onChange={(e) => setEditForm({...editForm, favouriteDrink: e.target.value})}
                            placeholder="What's your favourite drink?"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-4">About Me</h3>
                      <div>
                        <Label htmlFor="aboutMe">Bio</Label>
                        <Textarea 
                          id="aboutMe" 
                          value={editForm.aboutMe} 
                          onChange={(e) => setEditForm({...editForm, aboutMe: e.target.value})}
                          placeholder="Tell us about yourself..."
                          className="min-h-[150px]"
                        />
                      </div>
                      
                      <div className="mt-6 flex justify-end space-x-2">
                        <Button variant="outline" onClick={handleCancelEdit}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveProfile}>
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              )}
              
              {isCurrentUser && (
                <TabsContent value="notifications">
                  <div className="grid gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Push Notifications</h3>
                      
                      <div className="bg-gray-50 p-6 rounded-lg">
                        {!isSupported ? (
                          <div className="text-center py-4">
                            <p className="text-gray-500">Push notifications are not supported on this device.</p>
                          </div>
                        ) : isPermissionBlocked ? (
                          <div className="text-center py-4">
                            <p className="text-gray-500">Notifications are blocked. Please update your browser permissions.</p>
                            <Button className="mt-4" variant="outline" size="sm" onClick={() => window.open('chrome://settings/content/notifications')}>
                              Open Browser Settings
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">Enable Push Notifications</h4>
                              <p className="text-sm text-gray-500">Get notified about important updates and messages</p>
                            </div>
                            <Switch 
                              checked={isSubscribed}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  subscribeUser();
                                } else {
                                  unsubscribeUser();
                                }
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
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
