import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { UserProfile } from '@/types/supabase-types';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarDays, Briefcase, Cake, Utensils, Wine, MessageSquare, Upload, Camera, Edit, Save, X, Move, Check } from 'lucide-react';
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

const ProfilePage = () => {
  const { id } = useParams();
  const { profile: currentUserProfile } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
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
    birthDate: ''
  });
  
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [yPosition, setYPosition] = useState(0);
  const [canvasInitialized, setCanvasInitialized] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        let profileToLoad;
        
        if (id) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();
            
          if (error) throw error;
          profileToLoad = data;
        } else {
          profileToLoad = currentUserProfile;
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
            birthDate: profileToLoad.birth_date || ''
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
  }, [id, currentUserProfile]);

  useEffect(() => {
    return () => {
      if (canvasRef.current) {
        try {
          canvasRef.current.clear();
          canvasRef.current.dispose();
          canvasRef.current = null;
        } catch (e) {
          console.error('Error disposing canvas on unmount:', e);
        }
      }
    };
  }, []);

  const [activeObject, setActiveObject] = useState<fabric.Object | null>(null);

  useEffect(() => {
    if (isRepositioningBanner && canvasElRef.current && containerRef.current && profile?.banner_url && !canvasInitialized) {
      const initCanvas = async () => {
        try {
          if (canvasRef.current) {
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
            
            canvas.add(img);
            canvas.setActiveObject(img);
            setActiveObject(img);
            
            img.on('moved', function() {
              if (isMountedRef.current) {
                setYPosition(img.top || 0);
              }
            });
            
            canvas.renderAll();
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
            if (activeObject) {
              canvasRef.current.remove(activeObject);
              setActiveObject(null);
            }
            
            canvasRef.current.clear();
            canvasRef.current.dispose();
            canvasRef.current = null;
          }
        } catch (e) {
          console.error('Error cleaning up canvas:', e);
        } finally {
          setCanvasInitialized(false);
        }
      };
      
      setTimeout(cleanupCanvas, 0);
    }
  }, [isRepositioningBanner, canvasInitialized, activeObject]);

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
        birthDate: profile.birth_date || ''
      });
    }
    setIsEditing(false);
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: editForm.firstName,
          last_name: editForm.lastName,
          job_title: editForm.jobTitle,
          favourite_dish: editForm.favouriteDish,
          favourite_drink: editForm.favouriteDrink,
          about_me: editForm.aboutMe,
          birth_date: editForm.birthDate
        })
        .eq('id', profile.id);
        
      if (error) throw error;
      
      setProfile({
        ...profile,
        first_name: editForm.firstName,
        last_name: editForm.lastName,
        job_title: editForm.jobTitle,
        favourite_dish: editForm.favouriteDish,
        favourite_drink: editForm.favouriteDrink,
        about_me: editForm.aboutMe,
        birth_date: editForm.birthDate
      });
      
      setIsEditing(false);
      toast.success('Profile updated successfully');
      
      if (!id && currentUserProfile) {
        useAuthStore.setState({
          profile: {
            ...currentUserProfile,
            first_name: editForm.firstName,
            last_name: editForm.lastName,
            job_title: editForm.jobTitle,
            favourite_dish: editForm.favouriteDish,
            favourite_drink: editForm.favouriteDrink,
            about_me: editForm.aboutMe,
            birth_date: editForm.birthDate
          }
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleUpdateAvatar = (newAvatarUrl: string) => {
    if (profile) {
      console.log("Updating profile avatar to:", newAvatarUrl);
      setProfile({
        ...profile,
        avatar_url: newAvatarUrl
      });
      
      if (isCurrentUser && currentUserProfile) {
        useAuthStore.setState({
          profile: {
            ...currentUserProfile,
            avatar_url: newAvatarUrl
          }
        });
      }
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
  console.log("Banner URL from profile:", profile.banner_url, "Y Position:", profile.banner_position_y || yPosition);

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-8 overflow-hidden border-0 shadow-lg">
          <div ref={containerRef} className="relative h-32">
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
                  <div className="absolute bottom-2 right-2 flex space-x-2 z-10">
                    {profile.banner_url && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="bg-white bg-opacity-0 group-hover:bg-opacity-80 text-gray-600 hover:text-hi-purple transition-all duration-300 opacity-0 group-hover:opacity-100"
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
                          <label htmlFor="banner-upload" className="bg-white bg-opacity-80 rounded-md p-2 cursor-pointer hover:bg-opacity-100 transition-colors">
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
              </div>
            )}
          </div>
          
          <div className="relative px-6">
            <div className="-mt-16 flex items-end gap-4">
              <div className="relative">
                {isCurrentUser ? (
                  <ProfilePictureUploader profile={profile} onAvatarUpdate={handleUpdateAvatar} />
                ) : (
                  <Avatar className="h-32 w-32 border-4 border-white shadow-md">
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
                {isCurrentUser && <TabsTrigger value="settings">Edit Profile</TabsTrigger>}
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
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input 
                          id="firstName" 
                          value={editForm.firstName}
                          onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                          placeholder="First name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input 
                          id="lastName" 
                          value={editForm.lastName}
                          onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                          placeholder="Last name"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="jobTitle">Job Title</Label>
                      <Input 
                        id="jobTitle" 
                        value={editForm.jobTitle}
                        onChange={(e) => setEditForm({...editForm, jobTitle: e.target.value})}
                        placeholder="e.g. Head Chef, Server, Manager"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="birthDate">Birthday (MM-DD)</Label>
                      <Input 
                        id="birthDate" 
                        value={editForm.birthDate}
                        onChange={(e) => setEditForm({...editForm, birthDate: e.target.value})}
                        placeholder="MM-DD (e.g. 05-15)"
                      />
                      <p className="text-sm text-muted-foreground">Format: MM-DD (e.g. 05-15)</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="favouriteDish">Favourite Dish</Label>
                      <Input 
                        id="favouriteDish" 
                        value={editForm.favouriteDish}
                        onChange={(e) => setEditForm({...editForm, favouriteDish: e.target.value})}
                        placeholder="What's your favourite dish?"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="favouriteDrink">Favourite Drink</Label>
                      <Input 
                        id="favouriteDrink" 
                        value={editForm.favouriteDrink}
                        onChange={(e) => setEditForm({...editForm, favouriteDrink: e.target.value})}
                        placeholder="What's your favourite drink?"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="aboutMe">About Me</Label>
                      <Textarea 
                        id="aboutMe" 
                        value={editForm.aboutMe}
                        onChange={(e) => setEditForm({...editForm, aboutMe: e.target.value})}
                        placeholder="Tell us a bit about yourself..."
                        className="min-h-[100px]"
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2 mt-4">
                      <Button 
                        variant="outline" 
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleSaveProfile}>
                        Save Changes
                      </Button>
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
